// Project management functionality
class ProjectManager {
    constructor(portalCore) {
        this.core = portalCore;
    }

    async loadProjects() {
        try {
            const response = await fetch(`${this.core.apiBaseUrl}/api/projects`, {
                credentials: 'include'
            });

            if (response.ok) {
                this.core.projects = await response.json();
                this.displayProjects();
            } else {
                this.core.showMessage('Failed to load projects', 'error');
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            this.core.showMessage('Failed to load projects', 'error');
        }
    }

    displayProjects() {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;

        if (this.core.projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started with the Readyverse platform.</p>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = this.core.projects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-status">
                        <span class="status-badge ${this.getStatusClass(project.onboardingStep)}">
                            ${this.getStatusText(project.onboardingStep)}
                        </span>
                    </div>
                </div>
                <div class="project-description">
                    ${project.shortDescription || 'No description provided'}
                </div>
                <div class="project-meta">
                    <span class="project-genre">${project.genre || 'No genre'}</span>
                    <span class="project-track">${project.publishingTrack || 'No track'}</span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary" onclick="portal.startOnboarding('${project.id}')">
                        ${project.onboardingStep === 'done' ? 'View Project' : 'Continue Setup'}
                    </button>
                    <button class="btn btn-secondary" onclick="portal.showProjectDetail('${project.id}')">
                        Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStatusClass(step) {
        const statusMap = {
            'basics': 'status-pending',
            'assets': 'status-pending',
            'integration': 'status-pending',
            'compliance': 'status-pending',
            'review': 'status-pending',
            'done': 'status-completed'
        };
        return statusMap[step] || 'status-pending';
    }

    getStatusText(step) {
        const statusMap = {
            'basics': 'Setup Required',
            'assets': 'Assets Needed',
            'integration': 'Integration Pending',
            'compliance': 'Compliance Review',
            'review': 'Final Review',
            'done': 'Completed'
        };
        return statusMap[step] || 'Setup Required';
    }

    showCreateProjectForm() {
        const formHtml = `
            <div class="modal-overlay" id="create-project-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Project</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <form id="create-project-form" class="auth-form">
                        <div class="form-group">
                            <label for="project-name">Project Name</label>
                            <input type="text" id="project-name" name="name" required 
                                   placeholder="Enter your project name" class="form-input">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Project</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        const form = document.getElementById('create-project-form');
        form.addEventListener('submit', this.handleCreateProject.bind(this));
    }

    async handleCreateProject(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const projectData = {
            name: formData.get('name')
        };

        try {
            this.core.setButtonLoading(e.target.querySelector('button[type="submit"]'), 'Creating...');
            
            const response = await fetch(`${this.core.apiBaseUrl}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(projectData)
            });

            const result = await response.json();

            if (response.ok) {
                this.core.projects.push(result);
                this.displayProjects();
                document.getElementById('create-project-modal').remove();
                this.core.showMessage('Project created successfully!', 'success');
                
                // Start onboarding for the new project
                this.core.startOnboarding(result);
            } else {
                this.core.showMessage(result.error || 'Failed to create project', 'error');
            }
        } catch (error) {
            console.error('Create project error:', error);
            this.core.showMessage('Failed to create project', 'error');
        } finally {
            this.core.setButtonLoading(e.target.querySelector('button[type="submit"]'), 'Create Project', false);
        }
    }

    showProjectDetail(projectId) {
        const project = this.core.projects.find(p => p.id === projectId);
        if (!project) return;

        // For now, just start onboarding
        this.core.startOnboarding(project);
    }

    showProjectsList() {
        this.core.showDashboard();
        this.loadProjects();
    }
}
