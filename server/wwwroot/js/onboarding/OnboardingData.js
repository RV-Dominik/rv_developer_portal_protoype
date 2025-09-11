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
        if (track) {
            // Normalize common variants to stored values
            const value = track.value;
            data.publishingTrack = value === 'Self Hosted' ? 'Self-Hosted' : value;
        }
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
            // Debug: log payload before sending
            console.log('Saving onboarding step payload:', data);
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
                let message = 'Failed to save step';
                try {
                    const error = await response.json();
                    if (error && error.error) message = error.error;
                    if (error && error.details) {
                        console.warn('Server validation errors:', error.details);
                        message = `${message}`;
                    }
                } catch (_) {}
                throw new Error(message);
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

    async getSignedAssets(projectId) {
        try {
            const response = await fetch(`${this.core.apiBaseUrl}/api/uploads/${projectId}/signed`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (e) {
            console.warn('Failed to load signed assets', e);
            return [];
        }
    }

    restoreFormData(project) {
        switch (this.core.currentOnboardingStep) {
            case 'basics':
                this.restoreBasicsData(project);
                break;
            case 'assets':
                this.restoreAssetsData(project);
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
        console.log('Restoring basics data for project:', project);
        
        const shortDescEl = document.getElementById('ob-short-description');
        console.log('Short description element found:', !!shortDescEl);
        console.log('Project shortDescription:', project.shortDescription);
        if (shortDescEl && project.shortDescription) {
            shortDescEl.value = project.shortDescription;
            console.log('Set short description to:', shortDescEl.value);
        }

        const fullDescEl = document.getElementById('ob-full-description');
        if (fullDescEl && project.fullDescription) {
            fullDescEl.value = project.fullDescription;
        }

        const genreEl = document.getElementById('ob-genre');
        console.log('Genre element found:', !!genreEl);
        console.log('Project genre:', project.genre);
        if (genreEl && project.genre) {
            genreEl.value = project.genre;
            console.log('Set genre to:', genreEl.value);
        }

        const trackEl = document.getElementById('ob-publishing-track');
        console.log('Track element found:', !!trackEl);
        console.log('Project publishingTrack:', project.publishingTrack);
        if (trackEl && project.publishingTrack) {
            // Handle mismatch between stored/display variants
            const normalized = project.publishingTrack === 'Self Hosted' ? 'Self-Hosted' : project.publishingTrack;
            trackEl.value = normalized;
            console.log('Set track to:', trackEl.value);
        }

        const statusEl = document.getElementById('ob-build-status');
        console.log('Status element found:', !!statusEl);
        console.log('Project buildStatus:', project.buildStatus);
        if (statusEl && project.buildStatus) {
            statusEl.value = project.buildStatus;
            console.log('Set status to:', statusEl.value);
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

    async restoreAssetsData(project) {
        console.log('Restoring assets for project:', project);
        console.log('Project asset keys:', {
            [AssetConstants.ASSET_KEYS.GAME_LOGO]: project[AssetConstants.ASSET_KEYS.GAME_LOGO],
            [AssetConstants.ASSET_KEYS.COVER_ART]: project[AssetConstants.ASSET_KEYS.COVER_ART],
            [AssetConstants.ASSET_KEYS.TRAILER]: project[AssetConstants.ASSET_KEYS.TRAILER]
        });
        console.log('All project keys:', Object.keys(project));
        
        // Show loading state for all asset areas
        this.showAllAssetLoading();
        
        // Always fetch fresh signed URLs from the server using file keys
        // This prevents issues with expired URLs and ensures we have the latest assets
        console.log('Fetching fresh signed URLs from server...');
        const projectUrls = await this.getProjectAssetUrls(project.id);
        console.log('Fetched project URLs:', projectUrls);
        console.log('Project has coverArtKey:', !!project[AssetConstants.ASSET_KEYS.COVER_ART]);
        console.log('API returned coverArtUrl:', !!projectUrls.coverArtUrl);
        
        // Also get individual assets for screenshots
        const assets = await this.getSignedAssets(project.id);
        console.log('Fetched assets for screenshots:', assets);
        
        // Update single-image upload areas with project URLs
        if (projectUrls.gameLogoUrl) {
            console.log('Restoring game logo:', projectUrls.gameLogoUrl);
            const logoArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.APP_ICON));
            if (logoArea) {
                this.showAssetLoading(logoArea);
                const background = logoArea.querySelector('.upload-background');
                if (background) {
                    const img = new Image();
                    img.onload = () => {
                        background.style.backgroundImage = `url(${projectUrls.gameLogoUrl})`;
                        logoArea.classList.add('has-image');
                        this.hideAssetLoading(logoArea);
                    };
                    img.onerror = () => {
                        console.error('Failed to load game logo image');
                        this.hideAssetLoading(logoArea);
                    };
                    img.src = projectUrls.gameLogoUrl;
                }
            }
        }
        
        if (projectUrls.coverArtUrl) {
            console.log('Restoring cover art:', projectUrls.coverArtUrl);
            const heroArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.HERO_IMAGE));
            if (heroArea) {
                this.showAssetLoading(heroArea);
                const background = heroArea.querySelector('.upload-background');
                if (background) {
                    const img = new Image();
                    img.onload = () => {
                        background.style.backgroundImage = `url(${projectUrls.coverArtUrl})`;
                        heroArea.classList.add('has-image');
                        this.hideAssetLoading(heroArea);
                    };
                    img.onerror = () => {
                        console.error('Failed to load cover art image');
                        this.hideAssetLoading(heroArea);
                    };
                    img.src = projectUrls.coverArtUrl;
                }
            }
        }
        
        if (projectUrls.trailerUrl) {
            console.log('Restoring trailer:', projectUrls.trailerUrl);
            const trailerArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.TRAILER));
            if (trailerArea) {
                this.showAssetLoading(trailerArea);
                const background = trailerArea.querySelector('.upload-background');
                if (background) {
                    const img = new Image();
                    img.onload = () => {
                        background.style.backgroundImage = `url(${projectUrls.trailerUrl})`;
                        trailerArea.classList.add('has-image');
                        this.hideAssetLoading(trailerArea);
                    };
                    img.onerror = () => {
                        console.error('Failed to load trailer image');
                        this.hideAssetLoading(trailerArea);
                    };
                    img.src = projectUrls.trailerUrl;
                }
            }
        }

        // Handle screenshots (multiple files)
        const screenshotsArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.SCREENSHOTS));
        console.log('Screenshots area found:', !!screenshotsArea);
        if (screenshotsArea) {
            // Show loading state for screenshots
            this.showScreenshotsLoading(screenshotsArea);
            
            let list = screenshotsArea.querySelector('.thumb-list');
            if (!list) {
                list = document.createElement('div');
                list.className = 'thumb-list';
                screenshotsArea.appendChild(list);
            }
            
            console.log('Processing assets for screenshots:', assets.length, 'assets');
            let screenshotCount = 0;
            let loadedCount = 0;
            
            for (const a of assets) {
                console.log('Processing asset:', a.kind, a.mimeType, a.fileName);
                if ((a.kind || '').toLowerCase() === 'screenshot') {
                    if (a.mimeType && a.mimeType.startsWith('image/')) {
                        const item = document.createElement('div');
                        item.className = 'thumb-item';
                        const img = document.createElement('img');
                        const bust = `${a.signedUrl}${a.signedUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
                        
                        img.onload = () => {
                            loadedCount++;
                            if (loadedCount === screenshotCount) {
                                this.hideScreenshotsLoading(screenshotsArea);
                            }
                        };
                        img.onerror = () => {
                            console.error('Failed to load screenshot:', a.fileName);
                            loadedCount++;
                            if (loadedCount === screenshotCount) {
                                this.hideScreenshotsLoading(screenshotsArea);
                            }
                        };
                        
                        img.src = bust;
                        img.alt = a.fileName || 'screenshot';
                        item.appendChild(img);
                        list.appendChild(item);
                        screenshotCount++;
                        console.log('Added screenshot thumbnail:', a.fileName);
                    }
                }
            }
            
            // If no screenshots to load, hide loading immediately
            if (screenshotCount === 0) {
                this.hideScreenshotsLoading(screenshotsArea);
            }
            
            console.log('Total screenshots added:', screenshotCount);
        }
    }

    async getProjectAssetUrls(projectId) {
        try {
            console.log('Calling API for project asset URLs:', projectId);
            const response = await fetch(`${this.core.apiBaseUrl}/api/uploads/${projectId}/project-urls`, {
                method: 'GET',
                credentials: 'include'
            });
            console.log('API response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            console.log('API returned data:', result);
            return result;
        } catch (error) {
            console.error('Failed to get project asset URLs:', error);
            return {};
        }
    }

    // Show loading state for asset upload area
    showAssetLoading(uploadArea) {
        const overlay = uploadArea.querySelector('.upload-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="upload-icon">⏳</div>
                <div class="upload-text">
                    <strong>Loading...</strong>
                    <p>Fetching asset preview</p>
                </div>
            `;
            overlay.style.opacity = '0.8';
        }
    }

    // Hide loading state for asset upload area
    hideAssetLoading(uploadArea) {
        const overlay = uploadArea.querySelector('.upload-overlay');
        if (overlay) {
            // Reset to original content based on upload area type
            const areaId = uploadArea.id;
            if (areaId.includes('appicon')) {
                overlay.innerHTML = `
                    <div class="upload-icon">🧩</div>
                    <div class="upload-text">
                        <strong>App Icon</strong>
                        <p>PNG 1024x1024 px</p>
                    </div>
                `;
            } else if (areaId.includes('hero')) {
                overlay.innerHTML = `
                    <div class="upload-icon">🖼️</div>
                    <div class="upload-text">
                        <strong>Thumbnail / Hero Image</strong>
                        <p>PNG 1920x1080 px</p>
                    </div>
                `;
            } else if (areaId.includes('trailer')) {
                overlay.innerHTML = `
                    <div class="upload-icon">🎬</div>
                    <div class="upload-text">
                        <strong>Trailer</strong>
                        <p>MP4 Full HD 1920x1080, 15s max, 5MB max</p>
                    </div>
                `;
            }
            overlay.style.opacity = '1';
        }
    }

    // Show loading state for screenshots area
    showScreenshotsLoading(screenshotsArea) {
        const overlay = screenshotsArea.querySelector('.upload-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="upload-icon">⏳</div>
                <div class="upload-text">
                    <strong>Loading Screenshots...</strong>
                    <p>Fetching screenshot previews</p>
                </div>
            `;
            overlay.style.opacity = '0.8';
        }
    }

    // Hide loading state for screenshots area
    hideScreenshotsLoading(screenshotsArea) {
        const overlay = screenshotsArea.querySelector('.upload-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="upload-icon">📸</div>
                <div class="upload-text">
                    <strong>Screenshots</strong>
                    <p>PNG/JPG 1920x1080 px (max 10MB each)</p>
                </div>
            `;
            overlay.style.opacity = '1';
        }
    }

    // Show loading state for all asset areas
    showAllAssetLoading() {
        const assetAreas = [
            AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.APP_ICON),
            AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.HERO_IMAGE),
            AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.TRAILER),
            AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.SCREENSHOTS)
        ];

        assetAreas.forEach(areaId => {
            const area = document.getElementById(areaId);
            if (area) {
                this.showAssetLoading(area);
            }
        });
    }
}
