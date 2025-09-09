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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
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
                            <h3 class="step-title" id="step-title">${this.getStepTitle(step)}</h3>
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
                    <div class="preview-card">
                        <h4>Project Preview</h4>
                        <div class="preview-field">
                            <strong>Name:</strong> ${project.name}
                        </div>
                        <div class="preview-field">
                            <strong>Description:</strong> ${project.shortDescription || 'Will be filled in this step'}
                        </div>
                        <div class="preview-field">
                            <strong>Genre:</strong> ${project.genre || 'Will be selected'}
                        </div>
                    </div>
                `;
            case 'assets':
                return `
                    <div class="preview-card">
                        <h4>Asset Preview</h4>
                        <div class="asset-preview">
                            <div class="asset-placeholder">Game Logo</div>
                            <div class="asset-placeholder">Cover Art</div>
                        </div>
                    </div>
                `;
            case 'integration':
                return `
                    <div class="preview-card">
                        <h4>Integration Status</h4>
                        <div class="status-item">
                            <span class="status-label">Pass SSO:</span>
                            <span class="status-value">${project.passSsoIntegrationStatus || 'Not started'}</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Readyverse SDK:</span>
                            <span class="status-value">${project.readyverseSdkIntegrationStatus || 'Not started'}</span>
                        </div>
                    </div>
                `;
            case 'compliance':
                return `
                    <div class="preview-card">
                        <h4>Compliance Status</h4>
                        <div class="status-item">
                            <span class="status-label">Age Rating:</span>
                            <span class="status-value">${project.ageRating || 'Not selected'}</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Legal:</span>
                            <span class="status-value">${project.legalRequirementsCompleted ? 'Complete' : 'Pending'}</span>
                        </div>
                    </div>
                `;
            case 'review':
                return `
                    <div class="preview-card">
                        <h4>Ready to Submit</h4>
                        <p>All information has been collected. Review the details and submit for approval.</p>
                    </div>
                `;
            default:
                return '<div class="preview-card"><p>Preview not available</p></div>';
        }
    }

    bindOnboardingEvents() {
        // Form submission
        const form = document.getElementById('onboarding-form');
        form.addEventListener('submit', this.handleOnboardingSubmit.bind(this));
        
        // Navigation buttons
        const backBtn = document.getElementById('wizard-back');
        const skipBtn = document.getElementById('wizard-skip');
        const exitBtn = document.getElementById('wizard-exit');
        
        backBtn.addEventListener('click', this.goToPreviousStep.bind(this));
        skipBtn.addEventListener('click', this.skipCurrentStep.bind(this));
        exitBtn.addEventListener('click', this.exitOnboarding.bind(this));
        
        // File upload handlers
        this.bindFileUploadEvents();
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

    handleFileUpload(event, areaId) {
        const file = event.target.files[0];
        if (!file) return;
        
        const area = document.getElementById(areaId);
        const placeholder = area.querySelector('.upload-placeholder');
        
        // Show file name
        placeholder.innerHTML = `
            <div class="upload-icon">✓</div>
            <div class="upload-text">${file.name}</div>
            <div class="upload-hint">Click to change</div>
        `;
    }

    async handleOnboardingSubmit(event) {
        event.preventDefault();
        
        const formData = this.collectStepData();
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save onboarding step');
        }
        
        // Update local project data
        Object.assign(this.currentOnboardingProject, data);
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
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const projects = await response.json();
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
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
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