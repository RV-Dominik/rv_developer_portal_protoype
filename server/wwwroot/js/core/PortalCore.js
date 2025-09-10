// Core Portal functionality
class PortalCore {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
        this.projects = [];
        this.isVerifyingMagicLink = false;
        this.currentOnboardingProject = null;
        this.currentOnboardingStep = 'basics';
        this.autoSaveTimeout = null;
        this.projectManager = null;
        this.organizationManager = null;
        this.analytics = {
            sessionStart: Date.now(),
            stepStartTimes: {},
            dropOffPoints: [],
            interactions: []
        };
    }

    init() {
        this.bindEvents();
        this.hideLogoutButton();
        this.handleMagicLinkCallback();
        this.checkAuthStatus();
        this.bindAnalyticsEvents();
    }

    bindEvents() {
        const magicLinkForm = document.getElementById('magic-link-form');
        if (magicLinkForm) {
            magicLinkForm.addEventListener('submit', this.handleMagicLinkSubmit.bind(this));
        }

        const createProjectBtn = document.getElementById('create-project-button');
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', () => {
                if (this.projectManager) {
                    this.projectManager.showCreateProjectForm();
                }
            });
        }

        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', this.showAuthSection.bind(this));
        }

        const retryBtn = document.getElementById('retry-magic-link');
        if (retryBtn) {
            retryBtn.addEventListener('click', this.enableMagicLinkForm.bind(this));
        }
    }

    hideLogoutButton() {
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(messageEl, container.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);
    }

    async handleMagicLinkSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('email-input').value;
        
        if (!email) {
            this.showMessage('Please enter your email address', 'error');
            return;
        }

        try {
            this.setButtonLoading(e.target.querySelector('button[type="submit"]'), 'Sending...');
            
            const response = await fetch(`${this.apiBaseUrl}/api/auth/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.showMessage('Magic link sent! Check your email.', 'success');
            } else {
                this.showMessage(result.error || 'Failed to send magic link', 'error');
            }
        } catch (error) {
            console.error('Magic link error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setButtonLoading(e.target.querySelector('button[type="submit"]'), 'Send Magic Link', false);
        }
    }

    setButtonLoading(button, text, loading = true) {
        if (!button) return;
        
        const original = button.textContent;
        button.textContent = text;
        button.disabled = loading;
        
        if (!loading) {
            button.textContent = original;
            button.disabled = false;
        }
    }

    async handleLogout() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.currentUser = null;
                this.showLandingPage();
                this.hideLogoutButton();
                this.showMessage('Logged out successfully', 'success');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Logout failed', 'error');
        }
    }


    handleMagicLinkCallback() {
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
            this.isVerifyingMagicLink = true;
            this.verifyMagicLink(hash);
        }
    }

    async verifyMagicLink(hash) {
        try {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (!accessToken) {
                this.showMessage('Invalid magic link', 'error');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    AccessToken: accessToken, 
                    RefreshToken: refreshToken 
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.currentUser = result.user;
                this.showDashboard();
                if (this.projectManager) {
                    this.projectManager.loadProjects();
                }
                this.showMessage('Successfully logged in!', 'success');
                
                // Clear URL hash
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                this.showMessage(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Magic link verification error:', error);
            this.showMessage('Login failed. Please try again.', 'error');
        } finally {
            this.isVerifyingMagicLink = false;
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/session`, {
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.user;
                this.showDashboard();
                if (this.projectManager) {
                    this.projectManager.loadProjects();
                }
            } else {
                this.showLandingPage();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showLandingPage();
        }
    }

    // Analytics Methods
    trackEvent(eventName, data = {}) {
        const event = {
            name: eventName,
            timestamp: Date.now(),
            step: this.currentOnboardingStep,
            projectId: this.currentOnboardingProject?.id,
            userId: this.currentUser?.id,
            data: data
        };
        
        this.analytics.interactions.push(event);
        console.log('Analytics Event:', event);
        this.sendAnalyticsEvent(event);
    }

    trackStepStart(step) {
        this.analytics.stepStartTimes[step] = Date.now();
        this.trackEvent('step_start', { step });
    }

    trackStepEnd(step, completed = false) {
        const timeSpent = this.getTimeSpentOnStep(step);
        this.trackEvent('step_end', { 
            step, 
            completed, 
            timeSpent 
        });
    }

    trackDropOff(reason, step = null) {
        const dropOff = {
            reason,
            step: step || this.currentOnboardingStep,
            timestamp: Date.now(),
            timeSpent: this.getTimeSpentOnStep(),
            projectId: this.currentOnboardingProject?.id
        };
        
        this.analytics.dropOffPoints.push(dropOff);
        this.trackEvent('drop_off', dropOff);
    }

    getTimeSpentOnStep(step = null) {
        const targetStep = step || this.currentOnboardingStep;
        const startTime = this.analytics.stepStartTimes[targetStep];
        return startTime ? Date.now() - startTime : 0;
    }

    async sendAnalyticsEvent(event) {
        try {
            console.log('Sending analytics event:', event);
            // In production, send to analytics service
        } catch (error) {
            console.warn('Failed to send analytics event:', error);
        }
    }

    bindAnalyticsEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentOnboardingProject) {
                this.trackEvent('page_hidden', {
                    step: this.currentOnboardingStep,
                    timeSpent: this.getTimeSpentOnStep()
                });
            } else if (!document.hidden && this.currentOnboardingProject) {
                this.trackEvent('page_visible', {
                    step: this.currentOnboardingStep
                });
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.currentOnboardingProject) {
                this.trackDropOff('page_unload', this.currentOnboardingStep);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.matches('#onboarding-form input, #onboarding-form textarea, #onboarding-form select')) {
                this.trackEvent('field_interaction', {
                    field: e.target.id,
                    step: this.currentOnboardingStep,
                    value: e.target.value.length
                });
            }
        });
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
        if (retryContainer) retryContainer.classList.add('hidden');
        if (formEl) formEl.classList.remove('hidden');
        if (messageEl) messageEl.textContent = '';
    }

    enableMagicLinkForm() {
        const formEl = document.getElementById('magic-link-form');
        const retryContainer = document.getElementById('retry-container');
        const messageEl = document.getElementById('auth-message');
        
        if (formEl) formEl.classList.remove('hidden');
        if (retryContainer) retryContainer.classList.add('hidden');
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
        if (logoutButton) logoutButton.style.display = 'block';

        // Load projects if project manager is available
        if (this.projectManager) {
            await this.projectManager.loadProjects();
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
}
