// Onboarding data collection and API communication
class OnboardingData {
    constructor(portalCore) {
        this.core = portalCore;
    }

    collectStepData(step) {
        const data = { step };
        
        switch (step) {
            case 'basics':
                return this.collectBasicsData(data);
            case 'assets':
                return this.collectAssetsData(data);
            case 'integration':
                return this.collectIntegrationData(data);
            case 'compliance':
                return this.collectComplianceData(data);
            case 'review':
                return this.collectReviewData(data);
            default:
                return data;
        }
    }

    collectBasicsData(data) {
        const shortDesc = document.getElementById('ob-short-description');
        const fullDesc = document.getElementById('ob-full-description');
        const genre = document.getElementById('ob-genre');
        const track = document.getElementById('ob-publishing-track');
        const status = document.getElementById('ob-build-status');
        const isPublic = document.getElementById('ob-is-public');
        
        if (shortDesc) data.shortDescription = shortDesc.value;
        if (fullDesc) data.fullDescription = fullDesc.value;
        if (genre) data.genre = genre.value;
        if (track) data.publishingTrack = track.value;
        if (status) data.buildStatus = status.value;
        if (isPublic) data.isPublic = isPublic.checked;
        
        // Collect target platforms
        const platformCheckboxes = document.querySelectorAll('input[name="targetPlatforms"]:checked');
        const platforms = Array.from(platformCheckboxes).map(cb => cb.value);
        data.targetPlatforms = JSON.stringify(platforms);
        
        return data;
    }

    collectAssetsData(data) {
        // Assets are handled separately through file upload
        data.assetsCompleted = true;
        return data;
    }

    collectIntegrationData(data) {
        const passSso = document.getElementById('ob-pass-sso');
        const sdkStatus = document.getElementById('ob-sdk-status');
        const gameUrl = document.getElementById('ob-game-url');
        const launcherUrl = document.getElementById('ob-launcher-url');
        const notes = document.getElementById('ob-integration-notes');
        
        if (passSso) data.passSsoIntegrationStatus = passSso.value;
        if (sdkStatus) data.readyverseSdkIntegrationStatus = sdkStatus.value;
        if (gameUrl) data.gameUrl = gameUrl.value;
        if (launcherUrl) data.launcherUrl = launcherUrl.value;
        if (notes) data.integrationNotes = notes.value;
        
        return data;
    }

    collectComplianceData(data) {
        const legal = document.getElementById('ob-legal-requirements');
        const privacy = document.getElementById('ob-privacy-policy');
        const terms = document.getElementById('ob-terms-accepted');
        const content = document.getElementById('ob-content-guidelines');
        const distribution = document.getElementById('ob-distribution-rights');
        const rating = document.getElementById('ob-rating-board');
        const support = document.getElementById('ob-support-email');
        
        if (legal) data.legalRequirementsCompleted = legal.checked;
        if (privacy) data.privacyPolicyProvided = privacy.checked;
        if (terms) data.termsAccepted = terms.checked;
        if (content) data.contentGuidelinesAccepted = content.checked;
        if (distribution) data.distributionRightsConfirmed = distribution.checked;
        if (rating) data.ratingBoard = rating.value;
        if (support) data.supportEmail = support.value;
        
        return data;
    }

    collectReviewData(data) {
        const notes = document.getElementById('ob-review-notes');
        
        if (notes) data.reviewNotes = notes.value;
        data.reviewCompleted = true;
        
        return data;
    }

    async saveOnboardingStep(data) {
        try {
            const response = await fetch(`${this.core.apiBaseUrl}/api/projects/${this.core.currentOnboardingProject.id}/onboarding/step`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save step');
            }
        } catch (error) {
            console.error('Error saving onboarding step:', error);
            throw error;
        }
    }

    async completeOnboarding() {
        try {
            const response = await fetch(`${this.core.apiBaseUrl}/api/projects/${this.core.currentOnboardingProject.id}/onboarding/complete`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to complete onboarding');
            }
        } catch (error) {
            console.error('Error completing onboarding:', error);
            throw error;
        }
    }

    restoreFormData(project) {
        switch (this.core.currentOnboardingStep) {
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

        const publicEl = document.getElementById('ob-is-public');
        if (publicEl) {
            publicEl.checked = project.isPublic || false;
        }
    }

    restoreIntegrationData(project) {
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

        const launcherUrlEl = document.getElementById('ob-launcher-url');
        if (launcherUrlEl && project.launcherUrl) {
            launcherUrlEl.value = project.launcherUrl;
        }

        const notesEl = document.getElementById('ob-integration-notes');
        if (notesEl && project.integrationNotes) {
            notesEl.value = project.integrationNotes;
        }
    }

    restoreComplianceData(project) {
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

        const ratingEl = document.getElementById('ob-rating-board');
        if (ratingEl && project.ratingBoard) {
            ratingEl.value = project.ratingBoard;
        }

        const supportEl = document.getElementById('ob-support-email');
        if (supportEl && project.supportEmail) {
            supportEl.value = project.supportEmail;
        }
    }
}
