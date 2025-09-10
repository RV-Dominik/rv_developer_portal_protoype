// Main Portal Application - Refactored
class ShowroomPortal {
    constructor() {
        // Initialize core first
        this.core = new PortalCore();
        
        // Initialize managers with core reference
        this.projectManager = new ProjectManager(this.core);
        this.organizationManager = new OrganizationManager(this.core);
        
        // Set managers in core
        this.core.projectManager = this.projectManager;
        this.core.organizationManager = this.organizationManager;
        
        // Initialize onboarding components
        this.onboardingSteps = new OnboardingSteps(this.core);
        this.onboardingValidation = new OnboardingValidation(this.core);
        this.onboardingData = new OnboardingData(this.core);
        this.onboardingWizard = new OnboardingWizard(this.core, this.onboardingSteps, this.onboardingValidation, this.onboardingData);
        
        // Bind methods to this context
        this.startOnboarding = this.startOnboarding.bind(this);
        this.showProjectDetail = this.showProjectDetail.bind(this);
    }

    async init() {
        // Initialize core first and wait for authentication check to complete
        await this.core.init();
        
        // The core.init() calls checkAuthStatus() which will handle authentication
        // and project loading if the user is authenticated
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
        return this.onboardingWizard.startOnboarding(project);
    }

}

// Initialize the portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portal = new ShowroomPortal();
    window.portal.init();
});
