// Main Portal Application - Refactored
class ShowroomPortal {
    constructor() {
        // Initialize core
        this.core = new PortalCore();
        
        // Initialize managers
        this.projectManager = new ProjectManager(this.core);
        this.organizationManager = new OrganizationManager(this.core);
        
        // Initialize onboarding components
        this.onboardingWizard = new OnboardingWizard(this.core);
        this.onboardingSteps = new OnboardingSteps(this.core);
        this.onboardingValidation = new OnboardingValidation(this.core);
        this.onboardingData = new OnboardingData(this.core);
        
        // Bind methods to this context
        this.startOnboarding = this.startOnboarding.bind(this);
        this.showProjectDetail = this.showProjectDetail.bind(this);
    }

    async init() {
        this.core.init();
        
        // Check if user is authenticated
        if (this.core.currentUser) {
            // Check organization status
            const org = await this.organizationManager.loadOrganization();
            if (org) {
                // Organization exists, show projects
                this.projectManager.showProjectsList();
            }
            // If no org, organization setup will be shown by loadOrganization
        }
    }

    // Project management methods
    async loadProjects() {
        return this.projectManager.loadProjects();
    }

    displayProjects() {
        return this.projectManager.displayProjects();
    }

    showCreateProjectForm() {
        return this.projectManager.showCreateProjectForm();
    }

    showProjectDetail(projectId) {
        return this.projectManager.showProjectDetail(projectId);
    }

    showProjectsList() {
        return this.projectManager.showProjectsList();
    }

    // Onboarding methods
    startOnboarding(project) {
        // Update the wizard with step content and preview methods
        this.onboardingWizard.getStepContent = this.onboardingSteps.getStepContent.bind(this.onboardingSteps);
        this.onboardingWizard.getStepPreview = this.onboardingSteps.getStepPreview.bind(this.onboardingSteps);
        this.onboardingWizard.collectStepData = this.onboardingData.collectStepData.bind(this.onboardingData);
        this.onboardingWizard.saveOnboardingStep = this.onboardingData.saveOnboardingStep.bind(this.onboardingData);
        this.onboardingWizard.validateField = this.onboardingValidation.validateField.bind(this.onboardingValidation);
        this.onboardingWizard.validateStep = this.onboardingValidation.validateStep.bind(this.onboardingValidation);
        this.onboardingWizard.getValidationErrors = this.onboardingValidation.getValidationErrors.bind(this.onboardingValidation);
        this.onboardingWizard.restoreFormData = this.onboardingData.restoreFormData.bind(this.onboardingData);
        this.onboardingWizard.updateBasicsPreview = this.updateBasicsPreview.bind(this);
        this.onboardingWizard.updateIntegrationPreview = this.updateIntegrationPreview.bind(this);
        this.onboardingWizard.updateCompliancePreview = this.updateCompliancePreview.bind(this);
        this.onboardingWizard.bindFileUploadEvents = this.bindFileUploadEvents.bind(this);
        this.onboardingWizard.handleOnboardingSubmit = this.handleOnboardingSubmit.bind(this);
        
        return this.onboardingWizard.startOnboarding(project);
    }

    // File upload functionality
    bindFileUploadEvents() {
        const uploadAreas = document.querySelectorAll('.file-upload-area');
        uploadAreas.forEach(area => {
            area.addEventListener('click', () => {
                const fileInput = area.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.click();
                }
            });

            const fileInput = area.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.handleFileUpload(e, area);
                });
            }
        });
    }

    async handleFileUpload(event, uploadArea) {
        const file = event.target.files[0];
        if (!file) return;

        const projectId = this.core.currentOnboardingProject?.id;
        if (!projectId) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', projectId);

            const response = await fetch(`${this.core.apiBaseUrl}/api/uploads/${projectId}`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.core.showMessage('File uploaded successfully!', 'success');
                
                // Update the upload area to show success
                this.updateUploadArea(uploadArea, file, result.url);
            } else {
                const error = await response.json();
                this.core.showMessage(error.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.core.showMessage('Upload failed', 'error');
        }
    }

    updateUploadArea(uploadArea, file, url) {
        const icon = uploadArea.querySelector('.upload-icon');
        const text = uploadArea.querySelector('.upload-text');
        
        if (icon) icon.textContent = '✓';
        if (text) {
            text.innerHTML = `
                <strong>${file.name}</strong>
                <p>Uploaded successfully</p>
            `;
        }
        
        uploadArea.classList.add('uploaded');
    }

    // Preview update methods
    updateBasicsPreview(data) {
        const nameEl = document.getElementById('preview-project-name');
        const descEl = document.getElementById('preview-project-desc');
        const genreEl = document.getElementById('preview-genre');
        const trackEl = document.getElementById('preview-track');
        const statusEl = document.getElementById('preview-status');

        if (nameEl && data.name) nameEl.textContent = data.name;
        if (descEl) descEl.textContent = data.shortDescription || 'Your project description will appear here';
        if (genreEl) genreEl.textContent = data.genre || 'Genre';
        if (trackEl) trackEl.textContent = data.publishingTrack || 'Track';
        if (statusEl) statusEl.textContent = data.buildStatus || 'Development';
    }

    updateIntegrationPreview(data) {
        const passSsoEl = document.getElementById('preview-pass-sso');
        const sdkEl = document.getElementById('preview-sdk-status');
        const gameUrlEl = document.getElementById('preview-game-url');

        if (passSsoEl) passSsoEl.textContent = data.passSsoIntegrationStatus || 'Not started';
        if (sdkEl) sdkEl.textContent = data.readyverseSdkIntegrationStatus || 'Not started';
        if (gameUrlEl) gameUrlEl.textContent = data.gameUrl ? 'Configured' : 'Not set';
    }

    updateCompliancePreview(data) {
        const legalEl = document.getElementById('preview-legal-req');
        const privacyEl = document.getElementById('preview-privacy');
        const termsEl = document.getElementById('preview-terms');
        const contentEl = document.getElementById('preview-content');

        if (legalEl) {
            const icon = legalEl.querySelector('.check-icon');
            if (icon) icon.textContent = data.legalRequirementsCompleted ? '✅' : '⏳';
        }
        if (privacyEl) {
            const icon = privacyEl.querySelector('.check-icon');
            if (icon) icon.textContent = data.privacyPolicyProvided ? '✅' : '⏳';
        }
        if (termsEl) {
            const icon = termsEl.querySelector('.check-icon');
            if (icon) icon.textContent = data.termsAccepted ? '✅' : '⏳';
        }
        if (contentEl) {
            const icon = contentEl.querySelector('.check-icon');
            if (icon) icon.textContent = data.contentGuidelinesAccepted ? '✅' : '⏳';
        }
    }

    // Onboarding form submission
    async handleOnboardingSubmit(event) {
        event.preventDefault();
        
        const step = this.core.currentOnboardingStep;
        
        // Validate the current step
        if (!this.onboardingValidation.validateStep(step)) {
            this.core.trackEvent('validation_failed', {
                step: step,
                errors: this.onboardingValidation.getValidationErrors()
            });
            return;
        }

        try {
            this.core.setButtonLoading(event.target.querySelector('button[type="submit"]'), 'Saving...');
            
            // Collect and save step data
            const formData = this.onboardingData.collectStepData(step);
            const result = await this.onboardingData.saveOnboardingStep(formData);
            
            if (result) {
                // Update project data
                Object.assign(this.core.currentOnboardingProject, formData);
                
                this.core.trackEvent('step_completed', {
                    step: step,
                    timeSpent: this.core.getTimeSpentOnStep()
                });
                
                // Move to next step or complete onboarding
                const steps = this.onboardingWizard.getWizardSteps();
                const currentIndex = steps.indexOf(step);
                
                if (currentIndex < steps.length - 1) {
                    // Move to next step
                    this.core.trackStepEnd(step, true);
                    this.core.currentOnboardingStep = steps[currentIndex + 1];
                    this.core.trackStepStart(this.core.currentOnboardingStep);
                    this.onboardingWizard.renderOnboardingWizard();
                    
                    setTimeout(() => {
                        this.onboardingData.restoreFormData(this.core.currentOnboardingProject);
                    }, 100);
                } else {
                    // Complete onboarding
                    await this.completeOnboarding();
                }
            }
        } catch (error) {
            console.error('Onboarding submit error:', error);
            this.core.showMessage('Failed to save progress. Please try again.', 'error');
        } finally {
            this.core.setButtonLoading(event.target.querySelector('button[type="submit"]'), 'Continue', false);
        }
    }

    async completeOnboarding() {
        try {
            const result = await this.onboardingData.completeOnboarding();
            
            this.core.trackEvent('onboarding_completed', {
                projectId: this.core.currentOnboardingProject.id,
                timeSpent: Date.now() - this.core.analytics.sessionStart
            });
            
            this.core.showMessage('Onboarding completed successfully! Your project is now under review.', 'success');
            this.projectManager.showProjectsList();
        } catch (error) {
            console.error('Complete onboarding error:', error);
            this.core.showMessage('Failed to complete onboarding. Please try again.', 'error');
        }
    }
}

// Initialize the portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portal = new ShowroomPortal();
    window.portal.init();
});
