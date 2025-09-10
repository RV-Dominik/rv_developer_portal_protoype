// Onboarding wizard functionality
class OnboardingWizard {
    constructor(portalCore) {
        this.core = portalCore;
    }

    startOnboarding(project) {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection) return;
        
        this.core.currentOnboardingProject = project;
        this.core.currentOnboardingStep = project.onboardingStep || 'basics';
        
        this.core.trackEvent('onboarding_start', {
            projectId: project.id,
            step: this.core.currentOnboardingStep
        });
        this.core.trackStepStart(this.core.currentOnboardingStep);
        
        this.renderOnboardingWizard();
        
        setTimeout(() => {
            this.restoreFormData(project);
        }, 100);
    }

    renderOnboardingWizard() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection || !this.core.currentOnboardingProject) return;
        
        const project = this.core.currentOnboardingProject;
        const step = this.core.currentOnboardingStep;
        
        dashboardSection.innerHTML = `
            <div class="wizard-grid">
                <div class="wizard-card">
                    <div class="wizard-stepper">
                        ${this.getWizardSteps().map((stepName, index) => `
                            <div class="wizard-step ${this.getStepClasses(stepName, step)}" data-step="${stepName}">
                                <div class="step-number">${this.getStepNumber(stepName)}</div>
                                <div class="step-label">${this.getStepTitle(stepName)}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="wizard-content">
                        <div class="step-header">
                            <div class="step-title-row">
                                <h3 class="step-title" id="step-title">${this.getStepTitle(step)}</h3>
                                <div id="save-indicator" class="save-indicator"></div>
                            </div>
                            <p class="step-description" id="step-description">${this.getStepDescription(step)}</p>
                        </div>
                        
                        <form id="onboarding-form" class="auth-form">
                            <div id="step-content">
                                ${this.getStepContent(step, project)}
                            </div>
                            
                            <div class="wizard-actions">
                                <div class="wizard-nav">
                                    <button type="button" class="btn btn-secondary wizard-nav-btn" id="wizard-back" ${step === 'basics' ? 'style="display: none;"' : ''}>
                                        <span class="btn-icon">←</span>
                                        <span class="btn-text">Back</span>
                                    </button>
                                    <button type="button" class="btn btn-outline wizard-nav-btn" id="wizard-skip" ${step === 'review' ? 'style="display: none;"' : ''}>
                                        <span class="btn-icon">⏭</span>
                                        <span class="btn-text">Skip Step</span>
                                    </button>
                                    <button type="button" class="btn btn-outline wizard-nav-btn" id="wizard-exit">
                                        <span class="btn-icon">🚪</span>
                                        <span class="btn-text">Exit</span>
                                    </button>
                                </div>
                                <div class="wizard-cta">
                                    <div class="step-progress">
                                        <span class="progress-text">Step ${this.getStepNumber(step)} of 5</span>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${this.getStepProgress(step)}%"></div>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary wizard-cta-btn" id="wizard-next">
                                        <span class="btn-icon">${step === 'review' ? '✓' : '→'}</span>
                                        <span class="btn-text">${this.getCtaText(step)}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="preview-pane">
                    <div class="preview-overlay">
                        <div class="preview-header">
                            <div class="preview-title" id="pv-title">${project.name}</div>
                            <div class="preview-subtitle" id="pv-sub">${project.shortDescription || 'Your project description will appear here'}</div>
                        </div>
                        <div class="preview-content" id="preview-content">
                            ${this.getStepPreview(step, project)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindOnboardingEvents();
    }

    bindOnboardingEvents() {
        const form = document.getElementById('onboarding-form');
        if (form) {
            form.addEventListener('submit', this.handleOnboardingSubmit.bind(this));
        }
        
        const backBtn = document.getElementById('wizard-back');
        const skipBtn = document.getElementById('wizard-skip');
        const exitBtn = document.getElementById('wizard-exit');
        
        if (backBtn) backBtn.addEventListener('click', this.goToPreviousStep.bind(this));
        if (skipBtn) skipBtn.addEventListener('click', this.skipCurrentStep.bind(this));
        if (exitBtn) exitBtn.addEventListener('click', this.confirmExitOnboarding.bind(this));
        
        this.bindFileUploadEvents();
        this.bindLivePreviewEvents();
        this.bindStepperEvents();
    }

    bindLivePreviewEvents() {
        const inputs = document.querySelectorAll('#onboarding-form input, #onboarding-form textarea, #onboarding-form select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateLivePreview();
                this.validateField(input);
            });
            input.addEventListener('change', () => {
                this.updateLivePreview();
                this.validateField(input);
            });
            input.addEventListener('blur', () => this.validateField(input));
        });
    }

    bindStepperEvents() {
        const stepperSteps = document.querySelectorAll('.wizard-step');
        stepperSteps.forEach(step => {
            step.addEventListener('click', (e) => {
                const targetStep = e.currentTarget.getAttribute('data-step');
                if (targetStep && this.canNavigateToStep(targetStep)) {
                    this.navigateToStep(targetStep);
                }
            });
        });
    }

    // Step navigation methods
    goToPreviousStep() {
        const steps = this.getWizardSteps();
        const currentIndex = steps.indexOf(this.core.currentOnboardingStep);
        
        if (currentIndex > 0) {
            this.core.trackStepEnd(this.core.currentOnboardingStep, false);
            this.core.trackEvent('step_back', { 
                from: this.core.currentOnboardingStep,
                to: steps[currentIndex - 1]
            });
            
            this.core.currentOnboardingStep = steps[currentIndex - 1];
            this.core.trackStepStart(this.core.currentOnboardingStep);
            this.renderOnboardingWizard();
            
            setTimeout(() => {
                this.restoreFormData(this.core.currentOnboardingProject);
            }, 100);
        }
    }

    skipCurrentStep() {
        this.core.trackEvent('step_skipped', {
            step: this.core.currentOnboardingStep,
            timeSpent: this.core.getTimeSpentOnStep()
        });
        
        this.autoSaveProgress();
        
        const steps = this.getWizardSteps();
        const currentIndex = steps.indexOf(this.core.currentOnboardingStep);
        
        if (currentIndex < steps.length - 1) {
            this.core.trackStepEnd(this.core.currentOnboardingStep, false);
            this.core.currentOnboardingStep = steps[currentIndex + 1];
            this.core.trackStepStart(this.core.currentOnboardingStep);
            this.renderOnboardingWizard();
            
            setTimeout(() => {
                this.restoreFormData(this.core.currentOnboardingProject);
            }, 100);
        }
    }

    confirmExitOnboarding() {
        const hasUnsavedData = this.hasUnsavedChanges();
        
        if (hasUnsavedData) {
            const confirmed = confirm(
                'You have unsaved changes. Are you sure you want to exit? Your progress will be saved automatically.'
            );
            if (!confirmed) return;
        }
        
        this.exitOnboarding();
    }

    exitOnboarding() {
        this.core.trackEvent('onboarding_exit', {
            step: this.core.currentOnboardingStep,
            timeSpent: this.core.getTimeSpentOnStep(),
            completion: this.getStepProgress(this.core.currentOnboardingStep)
        });
        
        this.autoSaveProgress();
        this.core.showProjectsList();
        this.core.showMessage('Onboarding progress saved. You can continue later.', 'info');
    }

    navigateToStep(targetStep) {
        if (targetStep === this.core.currentOnboardingStep) return;
        
        this.core.trackStepEnd(this.core.currentOnboardingStep, false);
        this.autoSaveProgress();
        
        this.core.currentOnboardingStep = targetStep;
        
        this.core.trackStepStart(targetStep);
        this.core.trackEvent('step_navigation', {
            from: this.core.currentOnboardingStep,
            to: targetStep
        });
        
        this.renderOnboardingWizard();
        
        setTimeout(() => {
            this.restoreFormData(this.core.currentOnboardingProject);
        }, 100);
    }

    canNavigateToStep(targetStep) {
        const steps = this.getWizardSteps();
        const currentIndex = steps.indexOf(this.core.currentOnboardingStep);
        const targetIndex = steps.indexOf(targetStep);
        
        return targetIndex <= currentIndex;
    }

    // Helper methods
    getWizardSteps() {
        return ['basics', 'assets', 'integration', 'compliance', 'review'];
    }

    getStepClasses(stepName, currentStep) {
        const steps = this.getWizardSteps();
        const currentIndex = steps.indexOf(currentStep);
        const stepIndex = steps.indexOf(stepName);
        
        if (stepName === currentStep) {
            return 'active';
        } else if (stepIndex < currentIndex) {
            return 'completed';
        } else {
            return '';
        }
    }

    getStepNumber(step) {
        const stepNumbers = {
            'basics': 1,
            'assets': 2,
            'integration': 3,
            'compliance': 4,
            'review': 5
        };
        return stepNumbers[step] || 1;
    }

    getStepProgress(step) {
        const stepProgress = {
            'basics': 20,
            'assets': 40,
            'integration': 60,
            'compliance': 80,
            'review': 100
        };
        return stepProgress[step] || 0;
    }

    getCtaText(step) {
        const ctaTexts = {
            'basics': 'Continue to Assets',
            'assets': 'Continue to Integration',
            'integration': 'Continue to Compliance',
            'compliance': 'Review & Submit',
            'review': 'Complete Onboarding'
        };
        return ctaTexts[step] || 'Continue';
    }

    getStepTitle(step) {
        const titles = {
            'basics': 'Project Basics',
            'assets': 'Game Assets',
            'integration': 'Technical Integration',
            'compliance': 'Compliance & Legal',
            'review': 'Review & Submit'
        };
        return titles[step] || 'Onboarding';
    }

    getStepDescription(step) {
        const descriptions = {
            'basics': 'Tell us about your project and its basic information.',
            'assets': 'Upload your game assets including logos, screenshots, and trailers.',
            'integration': 'Configure technical integration with Readyverse services.',
            'compliance': 'Complete legal requirements and compliance checks.',
            'review': 'Review all information before submitting for approval.'
        };
        return descriptions[step] || 'Complete this step to continue.';
    }

    hasUnsavedChanges() {
        const inputs = document.querySelectorAll('#onboarding-form input, #onboarding-form textarea, #onboarding-form select');
        return Array.from(inputs).some(input => {
            const value = input.value.trim();
            const originalValue = input.getAttribute('data-original-value') || '';
            return value !== originalValue;
        });
    }

    // Auto-save functionality
    debouncedAutoSave() {
        if (this.core.autoSaveTimeout) {
            clearTimeout(this.core.autoSaveTimeout);
        }

        this.core.autoSaveTimeout = setTimeout(() => {
            this.autoSaveProgress();
        }, 2000);
    }

    async autoSaveProgress() {
        if (!this.core.currentOnboardingProject) return;

        try {
            const formData = this.collectStepData(this.core.currentOnboardingStep);
            
            if (this.hasFormData(formData)) {
                console.log('Auto-saving progress for step:', this.core.currentOnboardingStep);
                
                this.showSavingIndicator();
                
                const result = await this.saveOnboardingStep({
                    step: this.core.currentOnboardingStep,
                    ...formData
                });

                if (result) {
                    Object.assign(this.core.currentOnboardingProject, formData);
                    console.log('Progress auto-saved successfully');
                    this.showSavedIndicator();
                }
            }
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    hasFormData(data) {
        return Object.values(data).some(value => 
            value !== null && 
            value !== undefined && 
            value !== '' && 
            value !== false
        );
    }

    showSavingIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.textContent = 'Saving...';
            indicator.className = 'save-indicator saving';
        }
    }

    showSavedIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.textContent = 'Saved';
            indicator.className = 'save-indicator saved';
            
            setTimeout(() => {
                if (indicator) {
                    indicator.textContent = '';
                    indicator.className = 'save-indicator';
                }
            }, 2000);
        }
    }

    updateLivePreview() {
        if (!this.core.currentOnboardingProject) return;

        const formData = this.collectStepData(this.core.currentOnboardingStep);
        
        switch (this.core.currentOnboardingStep) {
            case 'basics':
                this.updateBasicsPreview(formData);
                break;
            case 'integration':
                this.updateIntegrationPreview(formData);
                break;
            case 'compliance':
                this.updateCompliancePreview(formData);
                break;
        }

        this.debouncedAutoSave();
    }

    // Placeholder methods - these would contain the actual step content, validation, etc.
    getStepContent(step, project) {
        // Implementation would go here
        return `<div>Step content for ${step}</div>`;
    }

    getStepPreview(step, project) {
        // Implementation would go here
        return `<div>Preview for ${step}</div>`;
    }

    collectStepData(step) {
        // Implementation would go here
        return {};
    }

    async saveOnboardingStep(data) {
        // Implementation would go here
        return true;
    }

    validateField(field) {
        // Implementation would go here
        return true;
    }

    restoreFormData(project) {
        // Implementation would go here
    }

    bindFileUploadEvents() {
        // Implementation would go here
    }

    updateBasicsPreview(data) {
        // Implementation would go here
    }

    updateIntegrationPreview(data) {
        // Implementation would go here
    }

    updateCompliancePreview(data) {
        // Implementation would go here
    }

    async handleOnboardingSubmit(event) {
        // Implementation would go here
    }
}
