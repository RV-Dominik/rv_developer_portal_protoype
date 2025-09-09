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
                            <label class="form-label" for="project-description">Short Description</label>
                            <textarea id="project-description" class="form-input" rows="3" placeholder="Describe your project"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="company-name">Company Name</label>
                            <input type="text" id="company-name" class="form-input" placeholder="Company Inc.">
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" id="project-public" style="margin: 0;">
                                <span class="form-label" style="margin: 0;">Make this project public</span>
                            </label>
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
        const shortDescription = document.getElementById('project-description').value.trim();
        const companyName = document.getElementById('company-name').value.trim();
        const isPublic = document.getElementById('project-public').checked;
        if (!name) return;

        const button = e.target.querySelector('button[type="submit"]');
        const original = button.textContent;
        button.innerHTML = '<span class="loading"></span> Creating...';
        button.disabled = true;

        try {
            const resp = await fetch(`${this.apiBaseUrl}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, shortDescription, companyName, isPublic })
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
                        <div class="form-group">
                            <label class="form-label" for="ob-short">Short Description</label>
                            <textarea id="ob-short" class="form-input" rows="3" placeholder="A short, compelling summary">${project.shortDescription||''}</textarea>
                        </div>
                        <div class="form-group">
                            <label style="display:flex;align-items:center;gap:.5rem;">
                                <input type="checkbox" id="ob-public" ${project.isPublic? 'checked':''}>
                                <span class="form-label" style="margin:0;">Make project public</span>
                            </label>
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
        const shortEl = document.getElementById('ob-short');
        const subEl = document.getElementById('pv-sub');
        shortEl.addEventListener('input', () => {
            subEl.textContent = shortEl.value || 'Your short description will appear here';
        });
        exit.addEventListener('click', () => this.showProjectsList());
        form.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const payload = {
                step: 'assets',
                companyName: document.getElementById('ob-company').value.trim() || undefined,
                shortDescription: document.getElementById('ob-short').value.trim() || undefined,
                isPublic: document.getElementById('ob-public').checked
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

    showDashboard() {
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
        
        this.showProjectsList();
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