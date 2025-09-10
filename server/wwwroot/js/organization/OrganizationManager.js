// Organization management functionality
class OrganizationManager {
    constructor(portalCore) {
        this.core = portalCore;
    }

    async checkOrganizationStatus() {
        try {
            const response = await fetch(`${this.core.apiBaseUrl}/api/org/me`, {
                credentials: 'include'
            });

            if (response.ok) {
                const org = await response.json();
                return org;
            } else if (response.status === 404) {
                return null; // No organization found
            } else {
                throw new Error('Failed to check organization status');
            }
        } catch (error) {
            console.error('Error checking organization status:', error);
            return null;
        }
    }

    showOrganizationSetup() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (!dashboardSection) return;

        dashboardSection.innerHTML = `
            <div class="organization-setup">
                <div class="setup-header">
                    <h2>Welcome to Readyverse Developer Portal</h2>
                    <p>Before you can create projects, we need some information about your organization.</p>
                </div>
                
                <div class="setup-form-container">
                    <form id="organization-form" class="auth-form">
                        <div class="form-group">
                            <label for="org-name">Organization Name *</label>
                            <input type="text" id="org-name" name="name" required 
                                   placeholder="Enter your organization name" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label for="org-website">Website</label>
                            <input type="url" id="org-website" name="website" 
                                   placeholder="https://yourcompany.com" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label for="org-description">Description</label>
                            <textarea id="org-description" name="description" 
                                      placeholder="Brief description of your organization" 
                                      class="form-input" rows="3"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="org-contact-name">Primary Contact Name *</label>
                                <input type="text" id="org-contact-name" name="primaryContactName" required 
                                       placeholder="John Doe" class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label for="org-contact-email">Primary Contact Email *</label>
                                <input type="email" id="org-contact-email" name="primaryContactEmail" required 
                                       placeholder="john@yourcompany.com" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="org-contact-phone">Primary Contact Phone</label>
                            <input type="tel" id="org-contact-phone" name="primaryContactPhone" 
                                   placeholder="+1 (555) 123-4567" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label for="org-socials">Social Media Links</label>
                            <textarea id="org-socials" name="socials" 
                                      placeholder="Twitter: @yourcompany&#10;LinkedIn: linkedin.com/company/yourcompany" 
                                      class="form-input" rows="2"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Create Organization</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const form = document.getElementById('organization-form');
        if (form) {
            form.addEventListener('submit', this.handleOrganizationSubmit.bind(this));
        }
    }

    async handleOrganizationSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const orgData = {
            name: formData.get('name'),
            website: formData.get('website'),
            description: formData.get('description'),
            primaryContactName: formData.get('primaryContactName'),
            primaryContactEmail: formData.get('primaryContactEmail'),
            primaryContactPhone: formData.get('primaryContactPhone'),
            socials: formData.get('socials')
        };

        try {
            this.core.setButtonLoading(e.target.querySelector('button[type="submit"]'), 'Creating...');
            
            const response = await fetch(`${this.core.apiBaseUrl}/api/org`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(orgData)
            });

            const result = await response.json();

            if (response.ok) {
                this.core.showMessage('Organization created successfully!', 'success');
                // Navigate back to dashboard and refresh projects
                if (this.core.showDashboard) this.core.showDashboard();
                if (this.core.projectManager && this.core.projectManager.loadProjects) {
                    this.core.projectManager.loadProjects();
                }
            } else {
                this.core.showMessage(result.error || 'Failed to create organization', 'error');
            }
        } catch (error) {
            console.error('Create organization error:', error);
            this.core.showMessage('Failed to create organization', 'error');
        } finally {
            this.core.setButtonLoading(e.target.querySelector('button[type="submit"]'), 'Create Organization', false);
        }
    }

    async loadOrganization() {
        const org = await this.checkOrganizationStatus();
        if (org) {
            return org;
        } else {
            this.showOrganizationSetup();
            return null;
        }
    }
}
