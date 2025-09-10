// Readyverse-inspired Portal JavaScript
class ShowroomPortal {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
        this.projects = [];
        this.isVerifyingMagicLink = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.hideLogoutButton(); // Hide logout button by default
        this.handleMagicLinkCallback();
        this.checkAuthStatus();
    }

    bindEvents() {
        const magicLinkForm = document.getElementById('magic-link-form');
        if (magicLinkForm) {
            magicLinkForm.addEventListener('submit', this.handleMagicLinkSubmit.bind(this));
        }

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', this.handleLogout.bind(this));
        }

        const createProjectButton = document.getElementById('create-project-button');
        if (createProjectButton) {
            createProjectButton.addEventListener('click', this.showCreateProjectForm.bind(this));
        }

        const getStartedButton = document.getElementById('get-started-btn');
        if (getStartedButton) {
            getStartedButton.addEventListener('click', this.showAuthSection.bind(this));
        }

        const retryButton = document.getElementById('retry-magic-link');
        if (retryButton) {
            retryButton.addEventListener('click', this.enableMagicLinkForm.bind(this));
        }
    }

    hideLogoutButton() {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.style.display = 'none';
        }
    }

    handleMagicLinkCallback() {
        // Check if this is a magic link callback (Supabase may use hash params)
        const searchParams = new URLSearchParams(window.location.search);
        const hashString = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hashString);

        // Prefer hash params (Supabase default), fallback to query params
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');

        if (accessToken) {
            this.isVerifyingMagicLink = true;
            this.verifyMagicLink(accessToken, refreshToken).finally(() => {
                this.isVerifyingMagicLink = false;
            });
        }
    }

    async verifyMagicLink(accessToken, refreshToken) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    AccessToken: accessToken,
                    RefreshToken: refreshToken
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showMessage('Authentication successful!', 'success');
                this.showDashboard();
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                if (window.location.hash) {
                    // Remove hash without reloading
                    const url = new URL(window.location);
                    url.hash = '';
                    window.history.replaceState({}, document.title, url);
                }
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Authentication failed', 'error');
            }
        } catch (error) {
            console.error('Magic link verification error:', error);
            this.showMessage('Authentication failed. Please try again.', 'error');
        }
    }

    async checkAuthStatus() {
        try {
            if (this.isVerifyingMagicLink) return; // wait for verification to complete
            const response = await fetch(`${this.apiBaseUrl}/api/auth/session`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.user) {
                this.currentUser = data.user;
                this.showDashboard();
            } else {
                    // Don't show auth section automatically - keep landing page visible
                    this.showLandingPage();
                }
            } else {
                // Don't show auth section automatically - keep landing page visible
                this.showLandingPage();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // Don't show auth section automatically - keep landing page visible
            this.showLandingPage();
        }
    }

    async handleMagicLinkSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('email-input').value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        const messageEl = document.getElementById('auth-message');
        const formEl = document.getElementById('magic-link-form');
        const retryContainer = document.getElementById('retry-container');
        
        if (!email) {
            this.showMessage('Please enter your email address', 'error', messageEl);
            return;
        }

        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<span class="loading"></span> Sending...';
        submitButton.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                this.showMessage('Magic link sent! Check your email and click the link to sign in.', 'success', messageEl);
                document.getElementById('email-input').value = '';
                // Hide form and show retry option
                if (formEl) formEl.classList.add('hidden');
                if (retryContainer) retryContainer.style.display = 'block';
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to send magic link', 'error', messageEl);
            }
        } catch (error) {
            console.error('Magic link error:', error);
            this.showMessage('Network error. Please try again.', 'error', messageEl);
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    enableMagicLinkForm() {
        const formEl = document.getElementById('magic-link-form');
        const retryContainer = document.getElementById('retry-container');
        const messageEl = document.getElementById('auth-message');
        if (formEl) formEl.classList.remove('hidden');
        if (retryContainer) retryContainer.style.display = 'none';
        if (messageEl) messageEl.textContent = '';
        const emailInput = document.getElementById('email-input');
        if (emailInput) emailInput.focus();
    }

    async handleLogout() {
        try {
            await fetch(`${this.apiBaseUrl}/api/auth/logout`, { method: 'POST' });
            this.currentUser = null;
            this.showAuthSection();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showCreateProjectForm() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Create New Project</h2>
                    <p class="section-subtitle">Build something amazing in the Readyverse</p>
                </div>
                <div class="auth-card" style="max-width: 600px; margin: 0 auto;">
                    <form id="project-form" class="auth-form">
                        <div class="form-group">
                            <label class="form-label" for="project-name">Project Name *</label>
                            <input type="text" id="project-name" class="form-input" placeholder="Enter project name" required>
                        </div>
                        
                        <div class="flex gap-20">
                            <button type="submit" class="btn btn-primary">Create Project</button>
                            <button type="button" class="btn btn-secondary" onclick="portal.showProjectsList()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            const form = document.getElementById('project-form');
            form.addEventListener('submit', this.submitCreateProject.bind(this));
        }
    }

    async submitCreateProject(e) {
        e.preventDefault();
        const name = document.getElementById('project-name').value.trim();
        if (!name) return;

        const button = e.target.querySelector('button[type="submit"]');
        const original = button.textContent;
        button.innerHTML = '<span class="loading"></span> Creating...';
        button.disabled = true;

        try {
            const resp = await fetch(`${this.apiBaseUrl}/api/projects`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies for authentication
                body: JSON.stringify({ 
                    name: name
                })
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                if (resp.status === 400 && err.error?.includes('organization')) {
                    this.showMessage('Please set up your organization first before creating projects.', 'error');
                    this.showOrganizationSetup();
                } else {
                    this.showMessage(err.error || 'Failed to create project', 'error');
                }
                return;
            }
            const project = await resp.json();
            this.startOnboarding(project);
        } catch (err) {
            console.error('Create project error', err);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            button.textContent = original;
            button.disabled = false;
        }
    }

    startOnboarding(project) {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection) return;
        
        // Store current project for wizard
        this.currentOnboardingProject = project;
        this.currentOnboardingStep = project.onboardingStep || 'basics';
        
        this.renderOnboardingWizard();
        
        // Restore form data after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.restoreFormData(project);
        }, 100);
    }

    restoreFormData(project) {
        // Restore form fields based on the current step
        switch (this.currentOnboardingStep) {
            case 'basics':
                this.restoreBasicsData(project);
                break;
            case 'integration':
                this.restoreIntegrationData(project);
                break;
            case 'compliance':
                this.restoreComplianceData(project);
                break;
        }
    }

    restoreBasicsData(project) {
        // Restore basic project information
        const shortDescEl = document.getElementById('ob-short-description');
        if (shortDescEl && project.shortDescription) {
            shortDescEl.value = project.shortDescription;
        }

        const fullDescEl = document.getElementById('ob-full-description');
        if (fullDescEl && project.fullDescription) {
            fullDescEl.value = project.fullDescription;
        }

        const genreEl = document.getElementById('ob-genre');
        if (genreEl && project.genre) {
            genreEl.value = project.genre;
        }

        const trackEl = document.getElementById('ob-publishing-track');
        if (trackEl && project.publishingTrack) {
            trackEl.value = project.publishingTrack;
        }

        const statusEl = document.getElementById('ob-build-status');
        if (statusEl && project.buildStatus) {
            statusEl.value = project.buildStatus;
        }

        // Restore target platforms
        if (project.targetPlatforms) {
            try {
                const platforms = JSON.parse(project.targetPlatforms);
                platforms.forEach(platform => {
                    const checkbox = document.getElementById(`ob-platform-${platform.toLowerCase()}`);
                    if (checkbox) checkbox.checked = true;
                });
            } catch (e) {
                console.warn('Failed to parse target platforms:', e);
            }
        }

        // Restore public setting
        const publicEl = document.getElementById('ob-is-public');
        if (publicEl) {
            publicEl.checked = project.isPublic || false;
        }
    }

    restoreIntegrationData(project) {
        // Restore integration status
        const passSsoEl = document.getElementById('ob-pass-sso');
        if (passSsoEl && project.passSsoIntegrationStatus) {
            passSsoEl.value = project.passSsoIntegrationStatus;
        }

        const sdkEl = document.getElementById('ob-sdk-status');
        if (sdkEl && project.readyverseSdkIntegrationStatus) {
            sdkEl.value = project.readyverseSdkIntegrationStatus;
        }

        const gameUrlEl = document.getElementById('ob-game-url');
        if (gameUrlEl && project.gameUrl) {
            gameUrlEl.value = project.gameUrl;
        }
    }

    restoreComplianceData(project) {
        // Restore compliance checkboxes
        const legalEl = document.getElementById('ob-legal-requirements');
        if (legalEl) {
            legalEl.checked = project.legalRequirementsCompleted || false;
        }

        const privacyEl = document.getElementById('ob-privacy-policy');
        if (privacyEl) {
            privacyEl.checked = project.privacyPolicyProvided || false;
        }

        const termsEl = document.getElementById('ob-terms-accepted');
        if (termsEl) {
            termsEl.checked = project.termsAccepted || false;
        }

        const contentEl = document.getElementById('ob-content-guidelines');
        if (contentEl) {
            contentEl.checked = project.contentGuidelinesAccepted || false;
        }

        const distributionEl = document.getElementById('ob-distribution-rights');
        if (distributionEl) {
            distributionEl.checked = project.distributionRightsConfirmed || false;
        }

        // Restore other fields
        const ratingEl = document.getElementById('ob-rating-board');
        if (ratingEl && project.ratingBoard) {
            ratingEl.value = project.ratingBoard;
        }

        const supportEl = document.getElementById('ob-support-email');
        if (supportEl && project.supportEmail) {
            supportEl.value = project.supportEmail;
        }
    }

    renderOnboardingWizard() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection || !this.currentOnboardingProject) return;
        
        const project = this.currentOnboardingProject;
        const step = this.currentOnboardingStep;
        
        dashboardSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Project Onboarding</h2>
                <p class="section-subtitle">Complete these steps to get your project ready for the Readyverse</p>
            </div>
            <div class="wizard-grid">
                <div class="wizard-card">
                    <div class="wizard-stepper">
                        <div class="wizard-step ${step === 'basics' ? 'active' : step === 'completed' ? 'completed' : ''}" data-step="basics">
                            <div class="step-number">1</div>
                            <div class="step-label">Basics</div>
                        </div>
                        <div class="wizard-step ${step === 'assets' ? 'active' : ['basics', 'integration', 'compliance', 'review'].includes(step) ? 'completed' : ''}" data-step="assets">
                            <div class="step-number">2</div>
                            <div class="step-label">Assets</div>
                        </div>
                        <div class="wizard-step ${step === 'integration' ? 'active' : ['compliance', 'review'].includes(step) ? 'completed' : ''}" data-step="integration">
                            <div class="step-number">3</div>
                            <div class="step-label">Integration</div>
                        </div>
                        <div class="wizard-step ${step === 'compliance' ? 'active' : step === 'review' ? 'completed' : ''}" data-step="compliance">
                            <div class="step-number">4</div>
                            <div class="step-label">Compliance</div>
                        </div>
                        <div class="wizard-step ${step === 'review' ? 'active' : ''}" data-step="review">
                            <div class="step-number">5</div>
                            <div class="step-label">Review</div>
                        </div>
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
                                    <button type="button" class="btn btn-secondary" id="wizard-back" ${step === 'basics' ? 'style="display: none;"' : ''}>Back</button>
                                    <button type="button" class="btn btn-outline" id="wizard-skip" ${step === 'review' ? 'style="display: none;"' : ''}>Skip Step</button>
                                    <button type="button" class="btn btn-outline" id="wizard-exit">Exit</button>
                                </div>
                                <button type="submit" class="btn btn-primary" id="wizard-next">
                                    ${step === 'review' ? 'Complete Onboarding' : 'Save & Continue'}
                                </button>
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
            'basics': 'Provide essential game information and select your publishing track',
            'assets': 'Upload required game assets (logo, cover art, screenshots)',
            'integration': 'Configure Pass SSO authentication and Readyverse SDK integration',
            'compliance': 'Complete age rating, legal requirements, and terms acceptance',
            'review': 'Review all information and submit for Readyverse team approval'
        };
        return descriptions[step] || '';
    }

    getStepContent(step, project) {
        switch (step) {
            case 'basics':
                return `
                        <div class="form-group">
                        <label class="form-label" for="ob-short-description">Short Description *</label>
                        <textarea id="ob-short-description" class="form-input" rows="3" placeholder="A brief description of your game (2-3 sentences)..." required maxlength="500">${project.shortDescription || ''}</textarea>
                        <div class="form-hint">Brief description that will appear in the Readyverse launcher</div>
                        </div>
                    
                        <div class="form-group">
                        <label class="form-label" for="ob-full-description">Full Description</label>
                        <textarea id="ob-full-description" class="form-input" rows="4" placeholder="Detailed description of your game, features, and gameplay..." maxlength="2000">${project.fullDescription || ''}</textarea>
                        <div class="form-hint">Optional detailed description for internal review</div>
                        </div>
                    
                        <div class="form-group">
                        <label class="form-label" for="ob-genre">Genre *</label>
                        <select id="ob-genre" class="form-input" required>
                            <option value="">Select Genre</option>
                            <option value="Action" ${project.genre === 'Action' ? 'selected' : ''}>Action</option>
                            <option value="RPG" ${project.genre === 'RPG' ? 'selected' : ''}>RPG</option>
                            <option value="Strategy" ${project.genre === 'Strategy' ? 'selected' : ''}>Strategy</option>
                            <option value="Simulation" ${project.genre === 'Simulation' ? 'selected' : ''}>Simulation</option>
                            <option value="Puzzle" ${project.genre === 'Puzzle' ? 'selected' : ''}>Puzzle</option>
                            <option value="Adventure" ${project.genre === 'Adventure' ? 'selected' : ''}>Adventure</option>
                            <option value="Sports" ${project.genre === 'Sports' ? 'selected' : ''}>Sports</option>
                            <option value="Racing" ${project.genre === 'Racing' ? 'selected' : ''}>Racing</option>
                            <option value="Fighting" ${project.genre === 'Fighting' ? 'selected' : ''}>Fighting</option>
                            <option value="Horror" ${project.genre === 'Horror' ? 'selected' : ''}>Horror</option>
                            <option value="Other" ${project.genre === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="ob-publishing-track">Publishing Track *</label>
                        <select id="ob-publishing-track" class="form-input" required>
                            <option value="">Select Publishing Track</option>
                            <option value="Platform Games" ${project.publishingTrack === 'Platform Games' ? 'selected' : ''}>Platform Games (Epic/Steam)</option>
                            <option value="Self Hosted" ${project.publishingTrack === 'Self Hosted' ? 'selected' : ''}>Self Hosted or Web Based</option>
                            <option value="Readyverse Hosted" ${project.publishingTrack === 'Readyverse Hosted' ? 'selected' : ''}>Readyverse Hosted</option>
                        </select>
                        <div class="form-hint">Choose how your game will be distributed through Readyverse</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="ob-build-status">Build Status *</label>
                        <select id="ob-build-status" class="form-input" required>
                            <option value="">Select Status</option>
                            <option value="In Development" ${project.buildStatus === 'In Development' ? 'selected' : ''}>In Development</option>
                            <option value="Beta" ${project.buildStatus === 'Beta' ? 'selected' : ''}>Beta</option>
                            <option value="Production-Ready" ${project.buildStatus === 'Production-Ready' ? 'selected' : ''}>Production-Ready</option>
                        </select>
                        <div class="form-hint">Current state of your game build</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="ob-target-platforms">Target Platforms</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="ob-platform-pc" ${project.targetPlatforms?.includes('PC') ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                PC (Windows)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="ob-platform-mac" ${project.targetPlatforms?.includes('Mac') ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Mac
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="ob-platform-linux" ${project.targetPlatforms?.includes('Linux') ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Linux
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="ob-platform-web" ${project.targetPlatforms?.includes('Web') ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Web Browser
                            </label>
                        </div>
                        </div>
                `;
                
            case 'assets':
                return `
                    <div class="form-group">
                        <label class="form-label">Game Logo *</label>
                        <div class="file-upload-area" id="logo-upload">
                            <div class="upload-placeholder">
                                <div class="upload-icon">📷</div>
                                <div class="upload-text">Click to upload game logo</div>
                                <div class="upload-hint">PNG, JPG up to 2MB • Recommended: 512x512px</div>
                            </div>
                            <input type="file" id="ob-logo" accept="image/png,image/jpeg,image/jpg" style="display: none;">
                        </div>
                        <div class="form-hint">Square logo that will appear in the Readyverse launcher</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Cover Art *</label>
                        <div class="file-upload-area" id="cover-upload">
                            <div class="upload-placeholder">
                                <div class="upload-icon">🖼️</div>
                                <div class="upload-text">Click to upload cover art</div>
                                <div class="upload-hint">PNG, JPG up to 5MB • Recommended: 1920x1080px</div>
                            </div>
                            <input type="file" id="ob-cover" accept="image/png,image/jpeg,image/jpg" style="display: none;">
                        </div>
                        <div class="form-hint">Main promotional image for your game</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Screenshots *</label>
                        <div class="file-upload-area" id="screenshots-upload">
                            <div class="upload-placeholder">
                                <div class="upload-icon">📸</div>
                                <div class="upload-text">Click to upload screenshots</div>
                                <div class="upload-hint">PNG, JPG up to 2MB each • Min 3, Max 10 images</div>
                            </div>
                            <input type="file" id="ob-screenshots" accept="image/png,image/jpeg,image/jpg" multiple style="display: none;">
                        </div>
                        <div class="form-hint">Showcase your game with 3-10 screenshots</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Trailer Video (Optional)</label>
                        <div class="file-upload-area" id="trailer-upload">
                            <div class="upload-placeholder">
                                <div class="upload-icon">🎬</div>
                                <div class="upload-text">Click to upload trailer</div>
                                <div class="upload-hint">MP4 up to 50MB • Max 2 minutes</div>
                            </div>
                            <input type="file" id="ob-trailer" accept="video/mp4" style="display: none;">
                        </div>
                        <div class="form-hint">Optional gameplay trailer or promotional video</div>
                </div>
            `;
                
            case 'integration':
                return `
                    <div class="integration-info">
                        <div class="info-box">
                            <h4>🔐 Pass SSO Integration</h4>
                            <p>Implement OAuth + login APIs for user authentication. Users must be able to sign in with their Readyverse Pass account.</p>
                            <a href="https://www.futureverse.com/futurepass" target="_blank" class="btn btn-outline btn-sm">View Pass SSO Docs</a>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Pass SSO Integration Status *</label>
                        <select id="ob-pass-sso" class="form-input" required>
                            <option value="">Select Status</option>
                            <option value="Not Started" ${project.passSsoIntegrationStatus === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="In Progress" ${project.passSsoIntegrationStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Complete" ${project.passSsoIntegrationStatus === 'Complete' ? 'selected' : ''}>Complete</option>
                        </select>
                        <div class="form-hint">Required for all publishing tracks</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Readyverse SDK Integration Status *</label>
                        <select id="ob-sdk-integration" class="form-input" required>
                            <option value="">Select Status</option>
                            <option value="Not Started" ${project.readyverseSdkIntegrationStatus === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="In Progress" ${project.readyverseSdkIntegrationStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Complete" ${project.readyverseSdkIntegrationStatus === 'Complete' ? 'selected' : ''}>Complete</option>
                        </select>
                        <div class="form-hint">Required for collectable lookup, event tracking, and updates</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="ob-game-url">Game URL</label>
                        <input type="url" id="ob-game-url" class="form-input" placeholder="https://yourgame.com" value="${project.gameUrl || ''}">
                        <div class="form-hint">Public URL where your game is accessible (required for Self Hosted track)</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="ob-build-format">Build Format</label>
                        <select id="ob-build-format" class="form-input">
                            <option value="">Select Format</option>
                            <option value="Unreal Engine" ${project.buildFormat === 'Unreal Engine' ? 'selected' : ''}>Unreal Engine</option>
                            <option value="Unity" ${project.buildFormat === 'Unity' ? 'selected' : ''}>Unity</option>
                            <option value="Custom Engine" ${project.buildFormat === 'Custom Engine' ? 'selected' : ''}>Custom Engine</option>
                            <option value="WebGL" ${project.buildFormat === 'WebGL' ? 'selected' : ''}>WebGL</option>
                            <option value="Native" ${project.buildFormat === 'Native' ? 'selected' : ''}>Native (C++/C#)</option>
                        </select>
                        <div class="form-hint">Primary engine/framework used for your game</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-requires-launcher" ${project.requiresLauncher ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Requires Readyverse Launcher to run
                        </label>
                        <div class="form-hint">Check if your game needs the Readyverse Launcher to be running</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-https-enabled" ${project.httpsEnabled ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            HTTPS/TLS enabled (required for Self Hosted)
                        </label>
                        <div class="form-hint">Required for Self Hosted and Web Based games</div>
                    </div>
                `;
                
            case 'compliance':
                return `
                    <div class="compliance-info">
                        <div class="info-box">
                            <h4>⚖️ Legal & Compliance Requirements</h4>
                            <p>Complete all required legal documentation and age rating certification before submission.</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Age Rating *</label>
                        <select id="ob-age-rating" class="form-input" required>
                            <option value="">Select Age Rating</option>
                            <option value="E" ${project.ageRating === 'E' ? 'selected' : ''}>E - Everyone</option>
                            <option value="E10+" ${project.ageRating === 'E10+' ? 'selected' : ''}>E10+ - Everyone 10+</option>
                            <option value="T" ${project.ageRating === 'T' ? 'selected' : ''}>T - Teen</option>
                            <option value="M" ${project.ageRating === 'M' ? 'selected' : ''}>M - Mature</option>
                            <option value="AO" ${project.ageRating === 'AO' ? 'selected' : ''}>AO - Adults Only</option>
                        </select>
                        <div class="form-hint">Official age rating from ESRB, PEGI, or equivalent rating board</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="ob-rating-board">Rating Board</label>
                        <select id="ob-rating-board" class="form-input">
                            <option value="">Select Rating Board</option>
                            <option value="ESRB" ${project.ratingBoard === 'ESRB' ? 'selected' : ''}>ESRB (North America)</option>
                            <option value="PEGI" ${project.ratingBoard === 'PEGI' ? 'selected' : ''}>PEGI (Europe)</option>
                            <option value="CERO" ${project.ratingBoard === 'CERO' ? 'selected' : ''}>CERO (Japan)</option>
                            <option value="ACB" ${project.ratingBoard === 'ACB' ? 'selected' : ''}>ACB (Australia)</option>
                            <option value="Other" ${project.ratingBoard === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-legal-completed" ${project.legalRequirementsCompleted ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Legal requirements completed
                        </label>
                        <div class="form-hint">All necessary legal clearances and documentation obtained</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-privacy-policy" ${project.privacyPolicyProvided ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Privacy policy provided and accessible
                        </label>
                        <div class="form-hint">Required for all games that collect user data</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-terms-accepted" ${project.termsAccepted ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Terms of service accepted
                        </label>
                        <div class="form-hint">Readyverse terms and conditions accepted</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-content-guidelines" ${project.contentGuidelinesAccepted ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Content guidelines compliance confirmed
                        </label>
                        <div class="form-hint">Game content meets Readyverse community standards</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-distribution-rights" ${project.distributionRightsConfirmed ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Distribution rights confirmed
                        </label>
                        <div class="form-hint">You have the right to distribute this game through Readyverse</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="ob-support-email">Support Contact Email</label>
                        <input type="email" id="ob-support-email" class="form-input" placeholder="support@yourcompany.com" value="${project.supportEmail || ''}">
                        <div class="form-hint">Email address for user support and technical issues</div>
                    </div>
                `;
                
            case 'review':
                return `
                    <div class="review-header">
                        <h3>📋 Review & Submit</h3>
                        <p>Please review all information before submitting for Readyverse team approval.</p>
                    </div>
                    
                    <div class="review-section">
                        <h4>🎮 Project Information</h4>
                        <div class="review-grid">
                            <div class="review-item">
                                <strong>Project Name:</strong> <span id="review-name">${project.name}</span>
                            </div>
                            <div class="review-item">
                                <strong>Description:</strong> <span id="review-description">${project.shortDescription || 'Not provided'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Genre:</strong> <span id="review-genre">${project.genre || 'Not selected'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Publishing Track:</strong> <span id="review-track">${project.publishingTrack || 'Not selected'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Build Status:</strong> <span id="review-build-status">${project.buildStatus || 'Not selected'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Target Platforms:</strong> <span id="review-platforms">${project.targetPlatforms ? JSON.parse(project.targetPlatforms).join(', ') : 'Not selected'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-section">
                        <h4>🔧 Technical Integration</h4>
                        <div class="review-grid">
                            <div class="review-item">
                                <strong>Pass SSO:</strong> <span id="review-pass-sso" class="status-badge ${project.passSsoIntegrationStatus?.toLowerCase().replace(' ', '-') || 'not-started'}">${project.passSsoIntegrationStatus || 'Not started'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Readyverse SDK:</strong> <span id="review-sdk" class="status-badge ${project.readyverseSdkIntegrationStatus?.toLowerCase().replace(' ', '-') || 'not-started'}">${project.readyverseSdkIntegrationStatus || 'Not started'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Game URL:</strong> <span id="review-game-url">${project.gameUrl || 'Not provided'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Build Format:</strong> <span id="review-build-format">${project.buildFormat || 'Not selected'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Requires Launcher:</strong> <span id="review-launcher">${project.requiresLauncher ? 'Yes' : 'No'}</span>
                            </div>
                            <div class="review-item">
                                <strong>HTTPS Enabled:</strong> <span id="review-https">${project.httpsEnabled ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-section">
                        <h4>⚖️ Compliance & Legal</h4>
                        <div class="review-grid">
                            <div class="review-item">
                                <strong>Age Rating:</strong> <span id="review-age-rating">${project.ageRating || 'Not selected'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Rating Board:</strong> <span id="review-rating-board">${project.ratingBoard || 'Not selected'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Legal Requirements:</strong> <span id="review-legal" class="status-badge ${project.legalRequirementsCompleted ? 'complete' : 'not-started'}">${project.legalRequirementsCompleted ? 'Completed' : 'Not completed'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Privacy Policy:</strong> <span id="review-privacy" class="status-badge ${project.privacyPolicyProvided ? 'complete' : 'not-started'}">${project.privacyPolicyProvided ? 'Provided' : 'Not provided'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Terms Accepted:</strong> <span id="review-terms" class="status-badge ${project.termsAccepted ? 'complete' : 'not-started'}">${project.termsAccepted ? 'Accepted' : 'Not accepted'}</span>
                            </div>
                            <div class="review-item">
                                <strong>Support Email:</strong> <span id="review-support-email">${project.supportEmail || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-section">
                        <h4>📁 Assets</h4>
                        <div class="review-grid">
                            <div class="review-item">
                                <strong>Game Logo:</strong> <span id="review-logo" class="status-badge not-started">Not uploaded</span>
                            </div>
                            <div class="review-item">
                                <strong>Cover Art:</strong> <span id="review-cover" class="status-badge not-started">Not uploaded</span>
                            </div>
                            <div class="review-item">
                                <strong>Screenshots:</strong> <span id="review-screenshots" class="status-badge not-started">Not uploaded</span>
                            </div>
                            <div class="review-item">
                                <strong>Trailer Video:</strong> <span id="review-trailer" class="status-badge not-started">Not uploaded</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-actions">
                        <div class="checkbox-label">
                            <input type="checkbox" id="review-confirmation" required>
                            <span class="checkmark"></span>
                            I confirm that all information is accurate and I have the right to distribute this game through Readyverse
                        </div>
                    </div>
                `;
                
            default:
                return '<p>Step content not found.</p>';
        }
    }

    getStepPreview(step, project) {
        switch (step) {
            case 'basics':
                return `
                    <div class="preview-card enhanced">
                        <div class="preview-card-header">
                            <h4>Project Preview</h4>
                            <div class="preview-badge">Live Preview</div>
                        </div>
                        <div class="preview-project-card">
                            <div class="preview-project-title" id="preview-project-name">${project.name}</div>
                            <div class="preview-project-description" id="preview-project-desc">${project.shortDescription || 'Your project description will appear here'}</div>
                            <div class="preview-project-meta">
                                <span class="preview-genre" id="preview-genre">${project.genre || 'Genre'}</span>
                                <span class="preview-track" id="preview-track">${project.publishingTrack || 'Track'}</span>
                            </div>
                            <div class="preview-project-status">
                                <span class="status-badge" id="preview-status">${project.buildStatus || 'Development'}</span>
                            </div>
                        </div>
                    </div>
                `;
            case 'assets':
                return `
                    <div class="preview-card enhanced">
                        <div class="preview-card-header">
                            <h4>Asset Gallery</h4>
                            <div class="preview-badge">Upload Preview</div>
                        </div>
                        <div class="asset-gallery-preview">
                            <div class="asset-slot logo-slot">
                                <div class="asset-placeholder" id="logo-placeholder">
                                    <div class="asset-icon">🎮</div>
                                    <div class="asset-label">Game Logo</div>
                                </div>
                            </div>
                            <div class="asset-slot cover-slot">
                                <div class="asset-placeholder" id="cover-placeholder">
                                    <div class="asset-icon">🖼️</div>
                                    <div class="asset-label">Cover Art</div>
                                </div>
                            </div>
                            <div class="asset-slot screenshot-slot">
                                <div class="asset-placeholder" id="screenshot-placeholder">
                                    <div class="asset-icon">📸</div>
                                    <div class="asset-label">Screenshots</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 'integration':
                return `
                    <div class="preview-card enhanced">
                        <div class="preview-card-header">
                            <h4>Integration Dashboard</h4>
                            <div class="preview-badge">Status Overview</div>
                        </div>
                        <div class="integration-status-grid">
                            <div class="status-card">
                                <div class="status-icon">🔐</div>
                                <div class="status-info">
                                    <div class="status-title">Pass SSO</div>
                                    <div class="status-value" id="preview-pass-sso">${project.passSsoIntegrationStatus || 'Not started'}</div>
                                </div>
                            </div>
                            <div class="status-card">
                                <div class="status-icon">⚡</div>
                                <div class="status-info">
                                    <div class="status-title">Readyverse SDK</div>
                                    <div class="status-value" id="preview-sdk-status">${project.readyverseSdkIntegrationStatus || 'Not started'}</div>
                                </div>
                            </div>
                            <div class="status-card">
                                <div class="status-icon">🌐</div>
                                <div class="status-info">
                                    <div class="status-title">Game URL</div>
                                    <div class="status-value" id="preview-game-url">${project.gameUrl ? 'Configured' : 'Not set'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 'compliance':
                return `
                    <div class="preview-card enhanced">
                        <div class="preview-card-header">
                            <h4>Compliance Checklist</h4>
                            <div class="preview-badge">Legal Review</div>
                        </div>
                        <div class="compliance-checklist">
                            <div class="checklist-item" id="preview-legal-req">
                                <span class="check-icon">${project.legalRequirementsCompleted ? '✅' : '⏳'}</span>
                                <span>Legal Requirements</span>
                            </div>
                            <div class="checklist-item" id="preview-privacy">
                                <span class="check-icon">${project.privacyPolicyProvided ? '✅' : '⏳'}</span>
                                <span>Privacy Policy</span>
                            </div>
                            <div class="checklist-item" id="preview-terms">
                                <span class="check-icon">${project.termsAccepted ? '✅' : '⏳'}</span>
                                <span>Terms Accepted</span>
                            </div>
                            <div class="checklist-item" id="preview-content">
                                <span class="check-icon">${project.contentGuidelinesAccepted ? '✅' : '⏳'}</span>
                                <span>Content Guidelines</span>
                            </div>
                        </div>
                    </div>
                `;
            case 'review':
                return `
                    <div class="preview-card enhanced final">
                        <div class="preview-card-header">
                            <h4>Ready for Submission</h4>
                            <div class="preview-badge success">Complete</div>
                        </div>
                        <div class="final-preview">
                            <div class="completion-summary">
                                <div class="summary-item">
                                    <strong>Project:</strong> ${project.name}
                                </div>
                                <div class="summary-item">
                                    <strong>Description:</strong> ${project.shortDescription || 'No description'}
                                </div>
                                <div class="summary-item">
                                    <strong>Genre:</strong> ${project.genre || 'Not specified'}
                                </div>
                                <div class="summary-item">
                                    <strong>Track:</strong> ${project.publishingTrack || 'Not specified'}
                                </div>
                            </div>
                            <div class="submission-note">
                                <p>Your project will be reviewed by the Readyverse team within 2-3 business days.</p>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return '<div class="preview-card"><p>Preview not available</p></div>';
        }
    }

    bindOnboardingEvents() {
        // Form submission
        const form = document.getElementById('onboarding-form');
        if (form) {
            form.addEventListener('submit', this.handleOnboardingSubmit.bind(this));
        }
        
        // Navigation buttons
        const backBtn = document.getElementById('wizard-back');
        const skipBtn = document.getElementById('wizard-skip');
        const exitBtn = document.getElementById('wizard-exit');
        
        if (backBtn) backBtn.addEventListener('click', this.goToPreviousStep.bind(this));
        if (skipBtn) skipBtn.addEventListener('click', this.skipCurrentStep.bind(this));
        if (exitBtn) exitBtn.addEventListener('click', this.exitOnboarding.bind(this));
        
        // File upload handlers
        this.bindFileUploadEvents();
        
        // Live preview updates
        this.bindLivePreviewEvents();
    }

    bindLivePreviewEvents() {
        // Update preview as user types
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

    validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous validation
        this.clearFieldValidation(field);

        // Field-specific validation
        switch (fieldId) {
            case 'ob-short-description':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Short description is required';
                } else if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'Description must be at least 10 characters';
                } else if (value.length > 500) {
                    isValid = false;
                    errorMessage = 'Description must be less than 500 characters';
                }
                break;

            case 'ob-full-description':
                if (value && value.length > 2000) {
                    isValid = false;
                    errorMessage = 'Full description must be less than 2000 characters';
                }
                break;

            case 'ob-genre':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a genre';
                }
                break;

            case 'ob-publishing-track':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a publishing track';
                }
                break;

            case 'ob-build-status':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a build status';
                }
                break;

            case 'ob-game-url':
                if (value && !this.isValidUrl(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid URL';
                }
                break;

            case 'ob-support-email':
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
        }

        // Show validation result
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.showFieldSuccess(field);
        }

        return isValid;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    clearFieldValidation(field) {
        const errorEl = field.parentNode.querySelector('.field-error');
        const successEl = field.parentNode.querySelector('.field-success');
        
        if (errorEl) errorEl.remove();
        if (successEl) successEl.remove();
        
        field.classList.remove('field-error', 'field-success');
    }

    showFieldError(field, message) {
        field.classList.add('field-error');
        field.classList.remove('field-success');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        
        field.parentNode.appendChild(errorEl);
    }

    showFieldSuccess(field) {
        field.classList.add('field-success');
        field.classList.remove('field-error');
        
        const successEl = document.createElement('div');
        successEl.className = 'field-success';
        successEl.textContent = '✓';
        
        field.parentNode.appendChild(successEl);
    }

    validateStep(step) {
        const requiredFields = this.getRequiredFieldsForStep(step);
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getRequiredFieldsForStep(step) {
        switch (step) {
            case 'basics':
                return ['ob-short-description', 'ob-genre', 'ob-publishing-track', 'ob-build-status'];
            case 'integration':
                return ['ob-pass-sso', 'ob-sdk-status'];
            case 'compliance':
                return ['ob-legal-requirements', 'ob-privacy-policy', 'ob-terms-accepted', 'ob-content-guidelines'];
            default:
                return [];
        }
    }

    updateLivePreview() {
        if (!this.currentOnboardingProject) return;

        // Collect current form data
        const formData = this.collectStepData(this.currentOnboardingStep);
        
        // Update the preview elements based on current step
        switch (this.currentOnboardingStep) {
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

        // Auto-save progress (debounced)
        this.debouncedAutoSave();
    }

    debouncedAutoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // Set new timeout for auto-save (2 seconds after user stops typing)
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveProgress();
        }, 2000);
    }

    async autoSaveProgress() {
        if (!this.currentOnboardingProject) return;

        try {
            const formData = this.collectStepData(this.currentOnboardingStep);
            
            // Only save if there's actual data to save
            if (this.hasFormData(formData)) {
                console.log('Auto-saving progress for step:', this.currentOnboardingStep);
                
                // Show saving indicator
                this.showSavingIndicator();
                
                const result = await this.saveOnboardingStep({
                    step: this.currentOnboardingStep,
                    ...formData
                });

                if (result) {
                    // Update local project data
                    Object.assign(this.currentOnboardingProject, formData);
                    console.log('Progress auto-saved successfully');
                    
                    // Show saved indicator
                    this.showSavedIndicator();
                }
            }
        } catch (error) {
            console.warn('Auto-save failed:', error);
            // Don't show error to user for auto-save failures
        }
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
            
            // Hide after 2 seconds
            setTimeout(() => {
                if (indicator) {
                    indicator.textContent = '';
                    indicator.className = 'save-indicator';
                }
            }, 2000);
        }
    }

    hasFormData(data) {
        // Check if there's meaningful data to save
        return Object.values(data).some(value => 
            value !== null && 
            value !== undefined && 
            value !== '' && 
            value !== false
        );
    }

    updateBasicsPreview(data) {
        // Update project name
        const nameEl = document.getElementById('preview-project-name');
        if (nameEl) nameEl.textContent = data.name || this.currentOnboardingProject.name;

        // Update description
        const descEl = document.getElementById('preview-project-desc');
        if (descEl) descEl.textContent = data.shortDescription || 'Your project description will appear here';

        // Update genre
        const genreEl = document.getElementById('preview-genre');
        if (genreEl) genreEl.textContent = data.genre || 'Genre';

        // Update track
        const trackEl = document.getElementById('preview-track');
        if (trackEl) trackEl.textContent = data.publishingTrack || 'Track';

        // Update status
        const statusEl = document.getElementById('preview-status');
        if (statusEl) statusEl.textContent = data.buildStatus || 'Development';
    }

    updateIntegrationPreview(data) {
        // Update Pass SSO status
        const passSsoEl = document.getElementById('preview-pass-sso');
        if (passSsoEl) passSsoEl.textContent = data.passSsoIntegrationStatus || 'Not started';

        // Update SDK status
        const sdkEl = document.getElementById('preview-sdk-status');
        if (sdkEl) sdkEl.textContent = data.readyverseSdkIntegrationStatus || 'Not started';

        // Update Game URL
        const urlEl = document.getElementById('preview-game-url');
        if (urlEl) urlEl.textContent = data.gameUrl ? 'Configured' : 'Not set';
    }

    updateCompliancePreview(data) {
        // Update legal requirements
        const legalEl = document.getElementById('preview-legal-req');
        if (legalEl) {
            const iconEl = legalEl.querySelector('.check-icon');
            if (iconEl) iconEl.textContent = data.legalRequirementsCompleted ? '✅' : '⏳';
        }

        // Update privacy policy
        const privacyEl = document.getElementById('preview-privacy');
        if (privacyEl) {
            const iconEl = privacyEl.querySelector('.check-icon');
            if (iconEl) iconEl.textContent = data.privacyPolicyProvided ? '✅' : '⏳';
        }

        // Update terms
        const termsEl = document.getElementById('preview-terms');
        if (termsEl) {
            const iconEl = termsEl.querySelector('.check-icon');
            if (iconEl) iconEl.textContent = data.termsAccepted ? '✅' : '⏳';
        }

        // Update content guidelines
        const contentEl = document.getElementById('preview-content');
        if (contentEl) {
            const iconEl = contentEl.querySelector('.check-icon');
            if (iconEl) iconEl.textContent = data.contentGuidelinesAccepted ? '✅' : '⏳';
        }
    }

    bindFileUploadEvents() {
        const uploadAreas = ['logo-upload', 'cover-upload', 'screenshots-upload', 'trailer-upload'];
        uploadAreas.forEach(areaId => {
            const area = document.getElementById(areaId);
            if (area) {
                const input = area.querySelector('input[type="file"]');
                if (input) {
                    area.addEventListener('click', () => input.click());
                    input.addEventListener('change', (e) => this.handleFileUpload(e, areaId));
                }
            }
        });
    }

    async handleFileUpload(event, areaId) {
        const file = event.target.files[0];
        if (!file) return;
        
        const area = document.getElementById(areaId);
        const placeholder = area.querySelector('.upload-placeholder');
        
        // Show uploading state
        placeholder.innerHTML = `
            <div class="upload-icon">⏳</div>
            <div class="upload-text">Uploading ${file.name}...</div>
            <div class="upload-hint">Please wait</div>
        `;
        
        try {
            // Upload file to server
            const formData = new FormData();
            formData.append('file', file);
            formData.append('kind', this.getFileKindFromAreaId(areaId));
            
            const response = await fetch(`${this.apiBaseUrl}/api/uploads/${this.currentOnboardingProject.id}`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                body: formData
            });
            
            if (response.ok) {
                const asset = await response.json();
                
                // Show success state
                placeholder.innerHTML = `
                    <div class="upload-icon">✓</div>
                    <div class="upload-text">${file.name}</div>
                    <div class="upload-hint">Click to change</div>
                `;
                
                // Store the asset for later use
                if (!this.uploadedAssets) this.uploadedAssets = [];
                this.uploadedAssets.push(asset);
                
                this.showMessage('File uploaded successfully!', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            
            // Show error state
            placeholder.innerHTML = `
                <div class="upload-icon">❌</div>
                <div class="upload-text">Upload failed</div>
                <div class="upload-hint">Click to try again</div>
            `;
            
            this.showMessage('Failed to upload file: ' + error.message, 'error');
        }
    }

    getFileKindFromAreaId(areaId) {
        const kindMap = {
            'logo-upload': 'logo',
            'cover-upload': 'cover',
            'screenshots-upload': 'screenshot',
            'trailer-upload': 'trailer'
        };
        return kindMap[areaId] || 'screenshot';
    }

    async handleOnboardingSubmit(event) {
        event.preventDefault();
        console.log('Form submitted for step:', this.currentOnboardingStep);
        
        // Validate current step before submitting
        if (!this.validateStep(this.currentOnboardingStep)) {
            this.showMessage('Please fix the validation errors before continuing', 'error');
            return;
        }
        
        const formData = this.collectStepData();
        console.log('Collected form data:', formData);
        
        const nextStep = this.getNextStep();
        
        try {
            // Save current step data
            await this.saveOnboardingStep(formData);
            
            if (nextStep) {
                // Move to next step
                this.currentOnboardingStep = nextStep;
                this.renderOnboardingWizard();
            } else {
                // Complete onboarding
                await this.completeOnboarding();
                this.showMessage('Onboarding completed successfully!', 'success');
                this.showProjectsList();
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            this.showMessage('Error saving onboarding data', 'error');
        }
    }

    collectStepData() {
        const step = this.currentOnboardingStep;
        const data = { step };
        
        switch (step) {
            case 'basics':
                data.shortDescription = document.getElementById('ob-short-description')?.value.trim();
                data.fullDescription = document.getElementById('ob-full-description')?.value.trim();
                data.genre = document.getElementById('ob-genre')?.value;
                data.publishingTrack = document.getElementById('ob-publishing-track')?.value;
                data.buildStatus = document.getElementById('ob-build-status')?.value;
                
                // Collect target platforms as JSON string
                const platforms = [];
                if (document.getElementById('ob-platform-pc')?.checked) platforms.push('PC');
                if (document.getElementById('ob-platform-mac')?.checked) platforms.push('Mac');
                if (document.getElementById('ob-platform-linux')?.checked) platforms.push('Linux');
                if (document.getElementById('ob-platform-web')?.checked) platforms.push('Web');
                data.targetPlatforms = JSON.stringify(platforms);
                
                // Debug: Log what we're collecting
                console.log('Collecting basics data:', {
                    shortDescription: data.shortDescription,
                    fullDescription: data.fullDescription,
                    genre: data.genre,
                    publishingTrack: data.publishingTrack,
                    buildStatus: data.buildStatus,
                    targetPlatforms: data.targetPlatforms
                });
                break;
                
            case 'assets':
                // File uploads would be handled separately
                // For now, just track that assets step was completed
                data.assetsCompleted = true;
                break;
                
            case 'integration':
                data.passSsoIntegrationStatus = document.getElementById('ob-pass-sso')?.value;
                data.readyverseSdkIntegrationStatus = document.getElementById('ob-sdk-integration')?.value;
                data.gameUrl = document.getElementById('ob-game-url')?.value.trim();
                data.buildFormat = document.getElementById('ob-build-format')?.value;
                data.requiresLauncher = document.getElementById('ob-requires-launcher')?.checked;
                data.httpsEnabled = document.getElementById('ob-https-enabled')?.checked;
                break;
                
            case 'compliance':
                data.ageRating = document.getElementById('ob-age-rating')?.value;
                data.ratingBoard = document.getElementById('ob-rating-board')?.value;
                data.legalRequirementsCompleted = document.getElementById('ob-legal-completed')?.checked;
                data.privacyPolicyProvided = document.getElementById('ob-privacy-policy')?.checked;
                data.termsAccepted = document.getElementById('ob-terms-accepted')?.checked;
                data.contentGuidelinesAccepted = document.getElementById('ob-content-guidelines')?.checked;
                data.distributionRightsConfirmed = document.getElementById('ob-distribution-rights')?.checked;
                data.supportEmail = document.getElementById('ob-support-email')?.value.trim();
                break;
                
            case 'review':
                // Review step - confirm all data is accurate
                data.reviewCompleted = true;
                data.finalConfirmation = document.getElementById('review-confirmation')?.checked;
                break;
        }
        
        return data;
    }

    getNextStep() {
        const steps = ['basics', 'assets', 'integration', 'compliance', 'review'];
        const currentIndex = steps.indexOf(this.currentOnboardingStep);
        return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
    }

    getPreviousStep() {
        const steps = ['basics', 'assets', 'integration', 'compliance', 'review'];
        const currentIndex = steps.indexOf(this.currentOnboardingStep);
        return currentIndex > 0 ? steps[currentIndex - 1] : null;
    }

    async saveOnboardingStep(data) {
        const response = await fetch(`${this.apiBaseUrl}/api/projects/${this.currentOnboardingProject.id}/onboarding/step`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Include cookies for authentication
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save onboarding step');
        }
        
        const result = await response.json();
        
        // Update local project data
        Object.assign(this.currentOnboardingProject, data);
        return result;
    }

    goToPreviousStep() {
        const previousStep = this.getPreviousStep();
        if (previousStep) {
            this.currentOnboardingStep = previousStep;
            this.renderOnboardingWizard();
        }
    }

    skipCurrentStep() {
        const nextStep = this.getNextStep();
        if (nextStep) {
            this.currentOnboardingStep = nextStep;
            this.renderOnboardingWizard();
        }
    }

    exitOnboarding() {
        this.showProjectsList();
    }

    async completeOnboarding() {
        await this.saveOnboardingStep({
            step: 'completed',
            onboardingCompletedAt: new Date().toISOString()
        });
    }

    async showProjectsList() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Your Projects</h2>
                    <p class="section-subtitle">Manage your Readyverse projects and experiences</p>
                </div>
                <div class="text-center mb-4">
                    <button id="create-project-button" class="btn btn-primary">
                        Create New Project
                    </button>
                </div>
                <div id="projects-list" class="projects-grid">
                    <div class="text-center">
                        <p class="text-body mb-4">Loading projects...</p>
                    </div>
                </div>
            `;
            this.bindEvents();
            
            // Load projects from API
            await this.loadProjects();
        }
    }

    async loadProjects() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/projects`, {
                credentials: 'include' // Include cookies for authentication
            });
            
            if (response.ok) {
                const projects = await response.json();
                console.log('Loaded projects from server:', projects);
                this.projects = projects;
                this.displayProjects(projects);
            } else {
                console.error('Failed to load projects:', response.status);
                this.projects = [];
                this.displayProjects([]);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            this.projects = [];
            this.displayProjects([]);
        }
    }

    displayProjects(projects) {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;
        
        if (projects.length === 0) {
            projectsList.innerHTML = `
                    <div class="text-center">
                        <p class="text-body mb-4">No projects yet. Create your first project to get started!</p>
                        <button class="btn btn-primary" onclick="portal.showCreateProjectForm()">
                            Create Project
                        </button>
                </div>
            `;
            return;
        }
        
        // Debug: Log the first project to see its structure
        if (projects.length > 0) {
            console.log('First project data structure:', projects[0]);
            console.log('Available fields:', Object.keys(projects[0]));
        }
        
        projectsList.innerHTML = projects.map(project => `
            <div class="project-card" onclick="portal.showProjectDetail('${project.id}')">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <span class="project-status ${project.onboardingStep || 'basics'}">${this.getStatusText(project.onboardingStep)}</span>
                </div>
                <div class="project-content">
                    <p class="project-description">${project.shortDescription || 'No description provided'}</p>
                    <div class="project-meta">
                        <span class="project-genre">${project.genre || 'No genre'}</span>
                        <span class="project-track">${project.publishingTrack || 'No track'}</span>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); portal.startOnboarding(${JSON.stringify(project).replace(/"/g, '&quot;')})">
                        Continue Setup
                        </button>
                    </div>
                </div>
        `).join('');
    }

    getStatusText(step) {
        const statusMap = {
            'basics': 'Basics',
            'assets': 'Assets',
            'integration': 'Integration',
            'compliance': 'Compliance',
            'review': 'Review',
            'completed': 'Completed'
        };
        return statusMap[step] || 'Not Started';
    }

    showProjectDetail(projectId) {
        // For now, just start the onboarding process for the project
        // In the future, this could show a detailed project view
        const project = this.projects?.find(p => p.id === projectId);
        if (project) {
            this.startOnboarding(project);
        }
    }

    showLandingPage() {
        const heroSection = document.getElementById('hero-section');
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const projectDetailSection = document.getElementById('project-detail-section');
        const logoutButton = document.getElementById('logout-button');
        
        if (heroSection) heroSection.classList.remove('hidden');
        if (authSection) authSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.add('hidden');
        if (projectDetailSection) projectDetailSection.classList.add('hidden');
        
        // Hide logout button when not authenticated
        if (logoutButton) logoutButton.style.display = 'none';
    }

    showAuthSection() {
        const heroSection = document.getElementById('hero-section');
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const projectDetailSection = document.getElementById('project-detail-section');
        const logoutButton = document.getElementById('logout-button');
        const retryContainer = document.getElementById('retry-container');
        const formEl = document.getElementById('magic-link-form');
        const messageEl = document.getElementById('auth-message');
        
        if (heroSection) heroSection.classList.add('hidden');
        if (authSection) authSection.classList.remove('hidden');
        if (dashboardSection) dashboardSection.classList.add('hidden');
        if (projectDetailSection) projectDetailSection.classList.add('hidden');
        
        // Hide logout button when not authenticated
        if (logoutButton) logoutButton.style.display = 'none';

        // Reset auth UI
        if (retryContainer) retryContainer.style.display = 'none';
        if (formEl) formEl.classList.remove('hidden');
        if (messageEl) messageEl.textContent = '';
    }

    async showDashboard() {
        const heroSection = document.getElementById('hero-section');
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const projectDetailSection = document.getElementById('project-detail-section');
        const logoutButton = document.getElementById('logout-button');
        
        if (heroSection) heroSection.classList.add('hidden');
        if (authSection) authSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        if (projectDetailSection) projectDetailSection.classList.add('hidden');
        
        // Show logout button when authenticated
        if (logoutButton) logoutButton.style.display = 'inline-block';
        
        // Check if user has an organization set up
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/org/me`, {
                credentials: 'include' // Include cookies for authentication
            });
            
            if (response.status === 404) {
                // No organization found, show setup form
                this.showOrganizationSetup();
                return;
            } else if (!response.ok) {
                throw new Error('Failed to check organization status');
            }
            
            // Organization exists, show normal dashboard
        this.showProjectsList();
        } catch (error) {
            console.error('Error checking organization:', error);
            this.showMessage('Error checking organization status', 'error');
        }
    }

    getAuthToken() {
        // Get token from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'auth_token') {
                return decodeURIComponent(value);
            }
        }
        return null;
    }

    showOrganizationSetup() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection) return;
        
        dashboardSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Set up your Organization</h2>
                <p class="section-subtitle">Tell us about your company to get started</p>
            </div>
            <div class="auth-card" style="max-width: 600px; margin: 0 auto;">
                <form id="organization-form" class="auth-form">
                    <div class="form-group">
                        <label class="form-label" for="org-name">Company Name *</label>
                        <input type="text" id="org-name" class="form-input" placeholder="Your Company Inc." required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-website">Website</label>
                        <input type="url" id="org-website" class="form-input" placeholder="https://yourcompany.com">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-contact-name">Primary Contact Name</label>
                        <input type="text" id="org-contact-name" class="form-input" placeholder="John Doe">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-contact-email">Primary Contact Email</label>
                        <input type="email" id="org-contact-email" class="form-input" placeholder="john@yourcompany.com">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-contact-phone">Primary Contact Phone</label>
                        <input type="tel" id="org-contact-phone" class="form-input" placeholder="+1 (555) 123-4567">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-description">Company Description</label>
                        <textarea id="org-description" class="form-input" rows="3" placeholder="Tell us about your company..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-industry">Industry</label>
                        <select id="org-industry" class="form-input">
                            <option value="">Select Industry</option>
                            <option value="gaming">Gaming</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="technology">Technology</option>
                            <option value="media">Media</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-size">Company Size</label>
                        <select id="org-size" class="form-input">
                            <option value="">Select Size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-1000">201-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="org-country">Country</label>
                        <input type="text" id="org-country" class="form-input" placeholder="United States">
                    </div>
                    
                    <div class="flex gap-20">
                        <button type="submit" class="btn btn-primary">Save Organization</button>
                    </div>
                </form>
            </div>
        `;
        
        const form = document.getElementById('organization-form');
        form.addEventListener('submit', this.submitOrganizationSetup.bind(this));
    }

    async submitOrganizationSetup(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('org-name').value.trim(),
            website: document.getElementById('org-website').value.trim(),
            primaryContactName: document.getElementById('org-contact-name').value.trim(),
            primaryContactEmail: document.getElementById('org-contact-email').value.trim(),
            primaryContactPhone: document.getElementById('org-contact-phone').value.trim(),
            description: document.getElementById('org-description').value.trim(),
            industry: document.getElementById('org-industry').value,
            companySize: document.getElementById('org-size').value,
            country: document.getElementById('org-country').value.trim()
        };
        
        if (!formData.name) {
            this.showMessage('Company name is required', 'error');
            return;
        }
        
        const button = e.target.querySelector('button[type="submit"]');
        const original = button.textContent;
        button.innerHTML = '<span class="loading"></span> Saving...';
        button.disabled = true;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/org`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies for authentication
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                this.showMessage('Organization saved successfully!', 'success');
                // Show the normal dashboard now
        this.showProjectsList();
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to save organization', 'error');
            }
        } catch (error) {
            console.error('Organization setup error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            button.textContent = original;
            button.disabled = false;
        }
    }

    showMessage(message, type = 'info', element = null) {
        const messageEl = element || document.createElement('div');
        if (!element) {
            messageEl.id = 'temp-message';
            messageEl.style.cssText = 'position: fixed; top: 2rem; right: 2rem; z-index: 1000; max-width: 400px;';
            document.body.appendChild(messageEl);
        }
        
        messageEl.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        if (!element) {
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 5000);
        }
    }
}

// Initialize portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portal = new ShowroomPortal();
});

// Handle URL parameters for auth callback
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
        window.portal.showMessage('Successfully signed in!', 'success');
        const url = new URL(window.location);
        url.searchParams.delete('auth');
        window.history.replaceState({}, document.title, url);
    }
});