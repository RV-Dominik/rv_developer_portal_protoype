// Readyverse-inspired Portal JavaScript
class ShowroomPortal {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
        this.projects = [];
        this.hasOrganization = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    async showServerErrorFromResponse(res, fallback = 'Server error') {
        try {
            const data = await res.clone().json();
            const msg = (data && (data.error || data.message)) || fallback;
            this.showMessage(msg, 'error');
        } catch (_) {
            try {
                const text = await res.text();
                this.showMessage(text || fallback, 'error');
            } catch {
                this.showMessage(fallback, 'error');
            }
        }
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
            createProjectButton.addEventListener('click', (e) => {
                if (!this.hasOrganization) {
                    e.preventDefault();
                    this.showOrgModal();
                    return;
                }
                this.showCreateProjectForm();
            });
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/session`);
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                await this.ensureOrganization();
                this.showDashboard();
            } else {
                this.showAuthSection();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthSection();
        }
    }

    async ensureOrganization() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/org/me`, { credentials: 'include' });
            if (res.ok) { this.hasOrganization = true; return; } // org exists
        } catch {}
        this.hasOrganization = false;
        this.showOrgModal();
    }

    showOrgModal() {
        let modal = document.getElementById('org-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'org-modal';
            modal.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:10000;';
            modal.innerHTML = `
                <div class="auth-card" style="max-width:640px;width:92%;background:#0f1b29;border:1px solid rgba(255,255,255,0.08);">
                    <div class="section-header" style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h2 class="section-title" style="margin:0">Organization</h2>
                            <p class="section-subtitle" style="margin:0">Tell us about your company</p>
                        </div>
                    </div>
                    <form id="org-form" class="auth-form">
                        <div class="form-group">
                            <label class="form-label" for="org-name">Company Name *</label>
                            <input id="org-name" class="form-input" required placeholder="Acme Inc.">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="org-website">Website</label>
                            <input id="org-website" class="form-input" placeholder="https://example.com">
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex:1;">
                                <label class="form-label" for="contact-name">Primary Contact</label>
                                <input id="contact-name" class="form-input" placeholder="Jane Doe">
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label class="form-label" for="contact-email">Contact Email</label>
                                <input id="contact-email" type="email" class="form-input" placeholder="jane@example.com">
                            </div>
                        </div>
                        <div class="flex gap-20">
                            <button type="submit" class="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>`;
            document.body.appendChild(modal);

            const form = modal.querySelector('#org-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submit = form.querySelector('button[type="submit"]');
                const original = submit.textContent; submit.textContent = 'Saving...'; submit.disabled = true;
                try {
                    const body = {
                        name: form.querySelector('#org-name').value.trim(),
                        website: form.querySelector('#org-website').value.trim(),
                        primaryContactName: form.querySelector('#contact-name').value.trim(),
                        primaryContactEmail: form.querySelector('#contact-email').value.trim()
                    };
                    if (!body.name) { this.showMessage('Company name is required', 'error'); return; }
                    const r = await fetch(`${this.apiBaseUrl}/api/org`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body)
                    });
                    if (r.ok) {
                        this.showMessage('Organization saved', 'success');
                        modal.style.display = 'none';
                    } else {
                        await this.showServerErrorFromResponse(r, 'Failed to save organization');
                    }
                } finally { submit.textContent = original; submit.disabled = false; }
            });
        }
        modal.style.display = 'flex';
    }

    async handleMagicLinkSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('email-input').value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        const messageEl = document.getElementById('auth-message');
        
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
                this.showMessage('Magic link sent! Check your email to sign in.', 'success', messageEl);
                document.getElementById('email-input').value = '';
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
        // Ensure dashboard area is not in a legacy "create" state
        try { this.showProjectsList(); } catch {}
        // Ensure a single modal instance exists
        let modal = document.getElementById('create-project-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'create-project-modal';
            modal.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:10000;';
            modal.innerHTML = `
                <div class="auth-card" style="max-width:620px;width:92%;background:#0f1b29;border:1px solid rgba(255,255,255,0.08);">
                    <div class="section-header" style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h2 class="section-title" style="margin:0">Create New Project</h2>
                            <p class="section-subtitle" style="margin:0">Build something amazing in the Readyverse</p>
                        </div>
                        <button id="create-project-close" class="btn btn-secondary">✕</button>
                    </div>
                    <form id="project-form" class="auth-form">
                        <div class="form-group">
                            <label class="form-label" for="project-name">Project Name *</label>
                            <input type="text" id="project-name" class="form-input" placeholder="Enter project name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="project-description">Description</label>
                            <textarea id="project-description" class="form-input" rows="4" placeholder="Describe your project"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="project-version">Version</label>
                            <input type="text" id="project-version" class="form-input" placeholder="1.0.0" value="1.0.0">
                        </div>
                        <div class="form-group">
                            <label style="display:flex;align-items:center;gap:0.5rem;">
                                <input type="checkbox" id="project-public" style="margin:0;">
                                <span class="form-label" style="margin:0;">Make this project public</span>
                            </label>
                        </div>
                        <div class="flex gap-20">
                            <button type="submit" class="btn btn-primary">Create Project</button>
                            <button type="button" id="create-project-cancel" class="btn btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>`;
            document.body.appendChild(modal);

            // Close handlers
            const hide = () => { modal.style.display = 'none'; document.body.style.overflow = ''; };
            modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
            modal.querySelector('#create-project-close').addEventListener('click', hide);
            modal.querySelector('#create-project-cancel').addEventListener('click', hide);

            // Submit handler
            const form = modal.querySelector('#project-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = (modal.querySelector('#project-name')?.value || '').trim();
                const description = modal.querySelector('#project-description')?.value || '';
                const isPublic = !!modal.querySelector('#project-public')?.checked;

                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Creating...';
                submitBtn.disabled = true;

                try {
                    if (!name) {
                        window.portal.showMessage('Project name is required', 'error');
                        return;
                    }

                    const res = await fetch(`${this.apiBaseUrl}/api/projects`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ name, shortDescription: description, isPublic })
                    });

                    if (res.ok) {
                        window.portal.showMessage('Project created successfully', 'success');
                        hide();
                        this.showProjectsList();
                    } else {
                        await this.showServerErrorFromResponse(res, 'Failed to create project');
                    }
                } catch (err) {
                    console.error('Create project error:', err);
                    window.portal.showMessage('Network error while creating project', 'error');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }

        // Always show existing modal (prevents duplicates)
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    showProjectsList() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Your Projects</h2>
                    <p class="section-subtitle">Manage your Readyverse projects and experiences</p>
                </div>
                <div class="text-center mb-4" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <button id="create-project-button" class="btn btn-primary">
                        ${this.hasOrganization ? 'Create New Project' : 'Add Organization to Create Project'}
                    </button>
                    <button id="manage-org-button" class="btn btn-secondary">Manage Organization</button>
                </div>
                <div id="projects-list" class="projects-grid">
                    <div class="text-center">
                        <p class="text-body mb-4">No projects yet. Create your first project to get started!</p>
                        <button class="btn btn-primary" onclick="portal.hasOrganization ? portal.showCreateProjectForm() : portal.showOrgModal()">
                            ${this.hasOrganization ? 'Create Project' : 'Add Organization'}
                        </button>
                        <button class="btn btn-secondary" onclick="portal.showOrgModal()">Manage Organization</button>
                    </div>
                </div>
            `;
            this.bindEvents();
        }
    }

    showAuthSection() {
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const projectDetailSection = document.getElementById('project-detail-section');
        
        if (authSection) authSection.classList.remove('hidden');
        if (dashboardSection) dashboardSection.classList.add('hidden');
        if (projectDetailSection) projectDetailSection.classList.add('hidden');
    }

    showDashboard() {
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const projectDetailSection = document.getElementById('project-detail-section');
        
        if (authSection) authSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        if (projectDetailSection) projectDetailSection.classList.add('hidden');
        
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