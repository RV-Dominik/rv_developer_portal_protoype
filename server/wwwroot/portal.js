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
                        
                        <div class="form-group">
                            <label class="form-label" for="company-name">Company Name</label>
                            <input type="text" id="company-name" class="form-input" placeholder="Company Inc.">
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
        const companyName = document.getElementById('company-name').value.trim();
        if (!name) return;

        const button = e.target.querySelector('button[type="submit"]');
        const original = button.textContent;
        button.innerHTML = '<span class="loading"></span> Creating...';
        button.disabled = true;

        try {
            const resp = await fetch(`${this.apiBaseUrl}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, companyName })
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                this.showMessage(err.error || 'Failed to create project', 'error');
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
        const step = project.onboardingStep || 'basics';
        dashboardSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Onboarding</h2>
                <p class="section-subtitle">Let's get your project ready for the Readyverse</p>
            </div>
            <div class="wizard-grid">
                <div class="wizard-card">
                    <div class="wizard-stepper">
                        <span class="wizard-step ${step==='basics'?'active':''}">Basics</span>
                        <span class="wizard-step ${step==='assets'?'active':''}">Assets</span>
                        <span class="wizard-step ${step==='integration'?'active':''}">Integration</span>
                        <span class="wizard-step ${step==='compliance'?'active':''}">Compliance</span>
                        <span class="wizard-step ${step==='review'?'active':''}">Review</span>
                    </div>
                    <form id="onboarding-basics" class="auth-form">
                        <div class="form-group">
                            <label class="form-label" for="ob-company">Company Name</label>
                            <input id="ob-company" class="form-input" value="${project.companyName||''}" placeholder="Company Inc.">
                        </div>
                        
                        <div class="flex gap-20">
                            <button type="submit" class="btn btn-primary">Save & Continue</button>
                            <button type="button" class="btn btn-secondary" id="ob-exit">Exit</button>
                        </div>
                    </form>
                </div>
                <div class="preview-pane">
                    <div class="preview-overlay">
                        <div class="preview-title" id="pv-title">${project.name}</div>
                        <div class="preview-subtitle" id="pv-sub">${project.shortDescription||'Your short description will appear here'}</div>
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('onboarding-basics');
        const exit = document.getElementById('ob-exit');
        
        exit.addEventListener('click', () => this.showProjectsList());
        form.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const payload = {
                step: 'assets',
                companyName: document.getElementById('ob-company').value.trim() || undefined
            };
            const btn = form.querySelector('button[type="submit"]');
            const orig = btn.textContent;
            btn.innerHTML = '<span class="loading"></span> Saving...';
            btn.disabled = true;
            try {
                const resp = await fetch(`${this.apiBaseUrl}/api/projects/${project.id}/onboarding/step`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    this.showMessage(err.error || 'Failed to save step', 'error');
                    return;
                }
                this.showMessage('Saved. Next: Upload assets.', 'success');
                this.showProjectsList();
            } catch (e) {
                console.error('Onboarding save error', e);
                this.showMessage('Network error. Please try again.', 'error');
            } finally {
                btn.textContent = orig;
                btn.disabled = false;
            }
        });
    }

    showProjectsList() {
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
                        <p class="text-body mb-4">No projects yet. Create your first project to get started!</p>
                        <button class="btn btn-primary" onclick="portal.showCreateProjectForm()">
                            Create Project
                        </button>
                    </div>
                </div>
            `;
            this.bindEvents();
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