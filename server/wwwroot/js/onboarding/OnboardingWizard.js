// Onboarding wizard functionality
class OnboardingWizard {
    constructor(portalCore, onboardingSteps, onboardingValidation, onboardingData) {
        this.core = portalCore;
        this.steps = onboardingSteps;
        this.validation = onboardingValidation;
        this.data = onboardingData;
        this.isRendering = false; // Flag to prevent validation during rendering
    }

    startOnboarding(projectOrId) {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection) return;
        
        // Handle both project object and project ID
        let project;
        if (typeof projectOrId === 'string') {
            // Find project by ID
            project = this.core.projects.find(p => p.id === projectOrId);
            if (!project) {
                console.error('Project not found:', projectOrId);
                return;
            }
        } else {
            project = projectOrId;
        }
        
        this.core.currentOnboardingProject = project;
        this.core.currentOnboardingStep = project.onboardingStep || 'basics';
        
        // Debug: Log project data
        console.log('Starting onboarding with project:', project);
        console.log('Project name:', project.name);
        console.log('Project shortDescription:', project.shortDescription);
        console.log('Project genre:', project.genre);
        console.log('Project publishingTrack:', project.publishingTrack);
        console.log('Project buildStatus:', project.buildStatus);
        console.log('All project keys:', Object.keys(project));
        
        this.core.trackEvent('onboarding_start', {
            projectId: project.id,
            step: this.core.currentOnboardingStep
        });
        this.core.trackStepStart(this.core.currentOnboardingStep);
        
        this.renderOnboardingWizard();
        
        // Wait for DOM to be ready, then restore form data
        console.log('=== STARTING ONBOARDING ===');
        console.log('Project:', project);
        console.log('Current step:', this.core.currentOnboardingStep);
        
        this.waitForFormElements().then(() => {
            console.log('✅ Form elements ready, calling restoreFormData...');
            this.restoreFormData(project);
        }).catch(error => {
            console.error('❌ Error waiting for form elements:', error);
        });
    }

    waitForFormElements() {
        return new Promise((resolve) => {
            const checkElements = () => {
                const form = document.getElementById('onboarding-form');
                
                console.log('=== WAIT FOR FORM ELEMENTS ===');
                console.log('Form found:', !!form);
                console.log('Current step:', this.core.currentOnboardingStep);
                
                // Check for step-specific elements
                let stepElementsFound = false;
                
                if (this.core.currentOnboardingStep === 'basics') {
                    const shortDesc = document.getElementById('ob-short-description');
                    const genre = document.getElementById('ob-genre');
                    console.log('Short desc found:', !!shortDesc);
                    console.log('Genre found:', !!genre);
                    stepElementsFound = shortDesc && genre;
                } else if (this.core.currentOnboardingStep === 'assets') {
                    // For assets step, check for upload areas
                    const uploadAreas = document.querySelectorAll('.file-upload-area');
                    console.log('Upload areas found:', uploadAreas.length);
                    stepElementsFound = uploadAreas.length > 0;
                } else if (this.core.currentOnboardingStep === 'integration') {
                    // For integration step, check for integration-specific elements
                    const integrationElements = document.querySelectorAll('[id^="ob-"]');
                    console.log('Integration elements found:', integrationElements.length);
                    stepElementsFound = integrationElements.length > 0;
                } else if (this.core.currentOnboardingStep === 'compliance') {
                    // For compliance step, check for compliance-specific elements
                    const complianceElements = document.querySelectorAll('[id^="ob-"]');
                    console.log('Compliance elements found:', complianceElements.length);
                    stepElementsFound = complianceElements.length > 0;
                }
                
                if (form && stepElementsFound) {
                    console.log('✅ All form elements found for step, resolving...');
                    resolve();
                } else {
                    console.log('⏳ Still waiting for form elements...');
                    // Use requestAnimationFrame for better performance than setTimeout
                    requestAnimationFrame(checkElements);
                }
            };
            
            checkElements();
        });
    }

    renderOnboardingWizard() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection || !this.core.currentOnboardingProject) return;
        
        // Set rendering flag to prevent validation during DOM updates
        this.isRendering = true;
        
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
        
        // Clear rendering flag after events are bound
        this.isRendering = false;
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
        this.bindReadyverseButtons();
    }

    bindLivePreviewEvents() {
        const inputs = document.querySelectorAll('#onboarding-form input, #onboarding-form textarea, #onboarding-form select');
        inputs.forEach(input => {
            // Update live preview and clear validation errors when user starts typing
            input.addEventListener('input', () => {
                this.updateLivePreview();
                // Clear validation errors when user starts typing
                this.clearFieldValidation(input);
            });
            
            input.addEventListener('change', () => {
                this.updateLivePreview();
                // Clear validation errors when user makes a selection
                this.clearFieldValidation(input);
            });
        });
    }

    clearFieldValidation(field) {
        // Clear validation errors for a specific field
        if (!field || !document.body.contains(field)) return;
        
        const container = field.closest('.form-group') || field.parentElement;
        if (!container || !document.body.contains(container)) return;

        const errorEl = container.querySelector('.field-error');
        const successEl = container.querySelector('.field-success');
        
        if (errorEl && container.contains(errorEl)) {
            try {
                container.removeChild(errorEl);
            } catch (e) {
                // Ignore if already removed
            }
        }
        
        if (successEl && container.contains(successEl)) {
            try {
                container.removeChild(successEl);
            } catch (e) {
                // Ignore if already removed
            }
        }
        
        field.classList.remove('field-error', 'field-success');
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

    bindReadyverseButtons() {
        const readyverseButtons = document.querySelectorAll('#open-unreal-btn');
        readyverseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = this.core.currentOnboardingProject?.id;
                if (projectId) {
                    // Check if assets are uploaded
                    const hasAssets = this.steps.hasRequiredAssets(this.core.currentOnboardingProject);
                    if (hasAssets) {
                        // Show modal warning
                        this.steps.showReadyverseModal(projectId);
                    } else {
                        // Show message that assets need to be uploaded first
                        this.core.showMessage('Please upload assets first before opening in Readyverse.', 'info');
                    }
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
            
            this.waitForFormElements().then(() => {
                this.restoreFormData(this.core.currentOnboardingProject);
            });
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
            
            this.waitForFormElements().then(() => {
                this.restoreFormData(this.core.currentOnboardingProject);
            });
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
        this.core.projectManager.showProjectsList();
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

        // Debounce auto-save with reasonable delay
        this.core.autoSaveTimeout = setTimeout(() => {
            this.autoSaveProgress();
        }, 2000); // 2 seconds is reasonable for auto-save debouncing
    }

    async autoSaveProgress() {
        if (!this.core.currentOnboardingProject) return;

        try {
            const formData = this.collectStepData(this.core.currentOnboardingStep);
            
            // Only auto-save if we have meaningful data to save
            if (!this.hasFormData(formData)) {
                return;
            }

            // Skip autosave during file uploads to avoid server 500s mid-transfer
            if (this.core.currentOnboardingStep === 'assets' && this.isUploadInFlight) {
                return;
            }
            
            // Only auto-save if the step has valid data (but don't show validation errors)
            const stepIsValid = this.validation.validateStepSilent(this.core.currentOnboardingStep);
            if (!stepIsValid) {
                // Don't auto-save if validation fails - wait for user to complete the form
                return;
            }
            
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
        } catch (error) {
            console.warn('Auto-save failed:', error);
            // Don't show error to user for auto-save failures
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
        return this.steps.getStepContent(step, project);
    }

    getStepPreview(step, project) {
        return this.steps.getStepPreview(step, project);
    }

    collectStepData(step) {
        return this.data.collectStepData(step);
    }

    async saveOnboardingStep(data) {
        return this.data.saveOnboardingStep(data);
    }

    validateField(field) {
        // Only validate on form submission, not during typing
        // This prevents DOM manipulation issues that cause fields to disappear
        return true; // Skip real-time validation
    }

    restoreFormData(project) {
        return this.data.restoreFormData(project);
    }

    validateImageDimensions(file, uploadArea) {
        return new Promise((resolve) => {
            const expectedW = parseInt(uploadArea.getAttribute('data-w'));
            const expectedH = parseInt(uploadArea.getAttribute('data-h'));
            
            if (!expectedW || !expectedH) {
                resolve(true); // No dimension requirements, allow upload
                return;
            }

            const img = new Image();
            img.onload = () => {
                const actualW = img.naturalWidth;
                const actualH = img.naturalHeight;
                
                console.log(`Image dimensions: ${actualW}x${actualH}, expected: ${expectedW}x${expectedH}`);
                
                if (actualW === expectedW && actualH === expectedH) {
                    console.log('✅ Image dimensions match requirements');
                    this.clearUploadAreaError(uploadArea);
                    resolve(true);
                } else {
                    const errorMsg = `Image dimensions must be exactly ${expectedW}x${expectedH}px. Your image is ${actualW}x${actualH}px.`;
                    console.error('❌', errorMsg);
                    this.core.showMessage(errorMsg, 'error');
                    this.showUploadAreaError(uploadArea, errorMsg);
                    resolve(false);
                }
            };
            
            img.onerror = (error) => {
                console.error('❌ Failed to load image for dimension validation:', error);
                console.error('Image source:', img.src);
                this.core.showMessage('Failed to load image for validation. Please try a different image.', 'error');
                resolve(false);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

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
                    // Clear any existing error when new file is selected
                    this.clearUploadAreaError(area);
                    this.handleFileUpload(e, area);
                });
            }
        });
    }

    async handleFileUpload(event, uploadArea) {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const projectId = this.core.currentOnboardingProject?.id;
        if (!projectId) return;

        try {
            this.isUploadInFlight = true;
            for (const file of files) {
                // Validate image dimensions before upload
                if (file.type.startsWith('image/')) {
                    const isValidDimensions = await this.validateImageDimensions(file, uploadArea);
                    if (!isValidDimensions) {
                        continue; // Skip this file if dimensions are invalid
                    }
                }

                const formData = new FormData();
                formData.append('file', file);
                // Derive kind from surface metadata
                const kind = uploadArea.getAttribute('data-kind') || (uploadArea.id.includes('logo') ? 'game_logo' : uploadArea.id.includes('hero') ? 'hero_image' : uploadArea.id.includes('trailer') ? 'trailer' : 'screenshot');
                formData.append('kind', kind);
                // Add client-captured dimensions if available
                const expectedW = uploadArea.getAttribute('data-w');
                const expectedH = uploadArea.getAttribute('data-h');
                if (expectedW) formData.append('width', expectedW);
                if (expectedH) formData.append('height', expectedH);

                // Show simple progress UI
                const progressTag = document.createElement('div');
                progressTag.className = 'upload-hint';
                progressTag.textContent = `Uploading ${file.name}...`;
                uploadArea.appendChild(progressTag);

                const response = await fetch(`${this.core.apiBaseUrl}/api/uploads/${projectId}`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    const displayUrl = result.signedUrl || result.publicUrl || null;
                    console.log(`Upload successful for ${file.name}:`, result);
                    this.core.showMessage('File uploaded successfully!', 'success');
                    this.updateUploadArea(uploadArea, file, displayUrl);

                    // Update project object with file keys for primary assets
                    const projectKey = AssetConstants.getProjectKeyForUploadArea(uploadArea);
                    const isScreenshot = uploadArea.getAttribute('data-kind') === AssetConstants.ASSET_TYPES.SCREENSHOTS;
                    
                    console.log('=== UPLOAD DEBUG ===');
                    console.log('Upload area ID:', uploadArea.id);
                    console.log('Upload area data-kind:', uploadArea.getAttribute('data-kind'));
                    console.log('Is screenshot upload:', isScreenshot);
                    console.log('Detected project key:', projectKey);
                    console.log('File key from server:', result.fileKey);
                    console.log('Current project keys before update:', {
                        gameLogoKey: this.core.currentOnboardingProject.gameLogoKey,
                        coverArtKey: this.core.currentOnboardingProject.coverArtKey,
                        trailerKey: this.core.currentOnboardingProject.trailerKey
                    });
                    
                    if (result.fileKey && projectKey) {
                        // Handle primary assets (logo, cover, trailer)
                        this.core.currentOnboardingProject[projectKey] = result.fileKey;
                        console.log(`✅ Set ${projectKey} to:`, result.fileKey);
                        console.log('Current project keys after update:', {
                            gameLogoKey: this.core.currentOnboardingProject.gameLogoKey,
                            coverArtKey: this.core.currentOnboardingProject.coverArtKey,
                            trailerKey: this.core.currentOnboardingProject.trailerKey
                        });
                        // Update preview pane if visible
                        this.updateLivePreview();
                    } else if (result.fileKey && isScreenshot) {
                        // Handle screenshots - store as JSON array in screenshotsKeys
                        console.log('✅ Screenshot uploaded successfully:', result.fileName);
                        console.log('Screenshot file key:', result.fileKey);
                        
                        // Get current screenshots array or create new one
                        let screenshots = [];
                        if (this.core.currentOnboardingProject.screenshotsKeys) {
                            try {
                                screenshots = JSON.parse(this.core.currentOnboardingProject.screenshotsKeys);
                            } catch (e) {
                                console.warn('Failed to parse existing screenshots:', e);
                                screenshots = [];
                            }
                        }
                        
                        // Add new screenshot key to array
                        screenshots.push(result.fileKey);
                        this.core.currentOnboardingProject.screenshotsKeys = JSON.stringify(screenshots);
                        
                        console.log('Updated screenshots array:', screenshots);
                        console.log('Current project keys after screenshot update:', {
                            gameLogoKey: this.core.currentOnboardingProject.gameLogoKey,
                            coverArtKey: this.core.currentOnboardingProject.coverArtKey,
                            trailerKey: this.core.currentOnboardingProject.trailerKey,
                            screenshotsKeys: this.core.currentOnboardingProject.screenshotsKeys
                        });
                        
                        // Update preview to show the uploaded file
                        this.updateScreenshotPreview(uploadArea, result.fileName, result.fileKey);
                    } else {
                        console.log('❌ No project key detected or no file key received');
                        console.log('Project key detected:', !!projectKey);
                        console.log('File key received:', !!result.fileKey);
                        console.log('Is screenshot:', isScreenshot);
                    }
                } else {
                    let message = 'Upload failed';
                    try {
                        const error = await response.json();
                        if (error && error.error) message = error.error;
                        console.error(`Upload failed for ${file.name}:`, error);
                    } catch (_) {
                        console.error(`Upload failed for ${file.name}:`, response.status, response.statusText);
                    }
                    this.core.showMessage(message, 'error');
                }

                if (progressTag && progressTag.parentNode) progressTag.parentNode.removeChild(progressTag);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.core.showMessage('Upload failed', 'error');
        } finally {
            this.isUploadInFlight = false;
        }
    }

    updateUploadArea(uploadArea, file, url) {
        // For the screenshots area, append thumbnails for each uploaded file
        if (uploadArea.id === AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.SCREENSHOTS)) {
            let list = uploadArea.querySelector('.thumb-list');
            if (!list) {
                list = document.createElement('div');
                list.className = 'thumb-list';
                uploadArea.appendChild(list);
            }
            const item = document.createElement('div');
            item.className = 'thumb-item';
            if (url && file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = url;
                img.alt = file.name;
                item.appendChild(img);
            } else {
                item.textContent = file.name;
            }
            list.appendChild(item);
        } else {
            const overlay = uploadArea.querySelector('.upload-overlay');
            const background = uploadArea.querySelector('.upload-background');
            const icon = uploadArea.querySelector('.upload-icon');
            const text = uploadArea.querySelector('.upload-text');
            
            if (icon) icon.textContent = '✓';
            if (text) {
                text.innerHTML = `
                    <strong>${file.name}</strong>
                    <p>Uploaded successfully</p>
                `;
            }
            
            // If we have an image URL for logo/hero, set it as background
            if (url && file.type.startsWith('image/')) {
                uploadArea.classList.add('has-image');
                // Cache-bust to avoid stale previews
                const bust = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
                if (background) {
                    background.style.backgroundImage = `url('${bust}')`;
                }
            }
            uploadArea.classList.add('uploaded');
        }
    }

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

    async handleOnboardingSubmit(event) {
        event.preventDefault();
        
        const step = this.core.currentOnboardingStep;
        
        // Only validate on form submission, not during typing
        // This prevents DOM manipulation issues that cause fields to disappear
        const isValid = this.validation.validateStep(step);
        if (!isValid) {
            this.core.trackEvent('validation_failed', {
                step: step,
                errors: this.validation.getValidationErrors()
            });
            return;
        }

        try {
            this.core.setButtonLoading(event.target.querySelector('button[type="submit"]'), 'Saving...');
            
            // Collect and save step data
            const formData = this.data.collectStepData(step);
            const result = await this.data.saveOnboardingStep(formData);
            
            if (result) {
                // Update project data
                Object.assign(this.core.currentOnboardingProject, formData);
                
                this.core.trackEvent('step_completed', {
                    step: step,
                    timeSpent: this.core.getTimeSpentOnStep()
                });
                
                // Move to next step or complete onboarding
                const steps = this.getWizardSteps();
                const currentIndex = steps.indexOf(step);
                
                if (currentIndex < steps.length - 1) {
                    // Move to next step
                    this.core.trackStepEnd(step, true);
                    this.core.currentOnboardingStep = steps[currentIndex + 1];
                    this.core.trackStepStart(this.core.currentOnboardingStep);
                    this.renderOnboardingWizard();
                    
                    this.waitForFormElements().then(() => {
                        this.data.restoreFormData(this.core.currentOnboardingProject);
                    });
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
            const result = await this.data.completeOnboarding();
            
            this.core.trackEvent('onboarding_completed', {
                projectId: this.core.currentOnboardingProject.id,
                timeSpent: Date.now() - this.core.analytics.sessionStart
            });
            
            this.core.showMessage('Onboarding completed successfully! Your project is now under review.', 'success');
            if (this.core.projectManager) {
                this.core.projectManager.showProjectsList();
            }
        } catch (error) {
            console.error('Complete onboarding error:', error);
            this.core.showMessage('Failed to complete onboarding. Please try again.', 'error');
        }
    }

    showUploadAreaError(uploadArea, errorMessage) {
        // Clear any existing error
        this.clearUploadAreaError(uploadArea);
        
        // Add error styling
        uploadArea.classList.add('has-error');
        
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'upload-error';
        errorDiv.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">${errorMessage}</div>
        `;
        
        // Insert error message after the upload overlay
        const overlay = uploadArea.querySelector('.upload-overlay');
        if (overlay) {
            overlay.parentNode.insertBefore(errorDiv, overlay.nextSibling);
        } else {
            uploadArea.appendChild(errorDiv);
        }
        
        console.log('✅ Showed upload area error:', errorMessage);
    }

    clearUploadAreaError(uploadArea) {
        // Remove error styling
        uploadArea.classList.remove('has-error');
        
        // Remove error message element
        const errorDiv = uploadArea.querySelector('.upload-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        
        console.log('✅ Cleared upload area error');
    }
}
