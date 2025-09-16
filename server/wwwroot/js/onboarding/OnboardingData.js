// Onboarding data collection and API communication
class OnboardingData {
    constructor(portalCore) {
        this.core = portalCore;
    }

    collectStepData(step) {
        console.log('=== COLLECT STEP DATA CALLED ===');
        console.log('Step parameter:', step);
        console.log('Step type:', typeof step);
        const data = { step };
        
        switch (step) {
            case 'basics':
                console.log('Calling collectBasicsData');
                return this.collectBasicsData(data);
            case 'assets':
                console.log('Calling collectAssetsData');
                return this.collectAssetsData(data);
            case 'showroom':
                console.log('Calling collectShowroomData');
                return this.collectShowroomData(data);
            case 'integration':
                console.log('Calling collectIntegrationData');
                return this.collectIntegrationData(data);
            case 'compliance':
                console.log('Calling collectComplianceData');
                return this.collectComplianceData(data);
            case 'review':
                console.log('Calling collectReviewData');
                return this.collectReviewData(data);
            default:
                console.log('Unknown step, returning basic data:', step);
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

    collectShowroomData(data) {
        console.log('=== COLLECTING SHOWROOM DATA ===');
        console.log('Document ready state:', document.readyState);
        console.log('All radio buttons with name showroomTier:', document.querySelectorAll('input[name="showroomTier"]'));
        console.log('All elements with id tier-standard:', document.querySelectorAll('#tier-standard'));
        console.log('All elements with id tier-bespoke:', document.querySelectorAll('#tier-bespoke'));
        console.log('All elements with id showroom-lighting-color:', document.querySelectorAll('#showroom-lighting-color'));
        
        const tierStandard = document.getElementById('tier-standard');
        const tierBespoke = document.getElementById('tier-bespoke');
        const colorPicker = document.getElementById('showroom-lighting-color');
        
        console.log('Tier standard element:', tierStandard);
        console.log('Tier bespoke element:', tierBespoke);
        console.log('Color picker element:', colorPicker);
        console.log('Tier standard checked:', tierStandard?.checked);
        console.log('Tier bespoke checked:', tierBespoke?.checked);
        console.log('Color picker value:', colorPicker?.value);
        
        // Also try alternative selectors
        const allTierRadios = document.querySelectorAll('input[name="showroomTier"]');
        console.log('All tier radios found:', allTierRadios.length);
        allTierRadios.forEach((radio, index) => {
            console.log(`Radio ${index}:`, {
                id: radio.id,
                value: radio.value,
                checked: radio.checked,
                name: radio.name
            });
        });
        
        // Determine selected tier
        if (tierStandard && tierStandard.checked) {
            data.showroomTier = 'standard';
            console.log('Selected tier: standard');
        } else if (tierBespoke && tierBespoke.checked) {
            data.showroomTier = 'bespoke';
            console.log('Selected tier: bespoke');
        } else {
            console.log('No tier selected - checking all radios manually');
            allTierRadios.forEach(radio => {
                if (radio.checked) {
                    data.showroomTier = radio.value;
                    console.log('Found selected tier via manual check:', radio.value);
                }
            });
        }
        
        // Get lighting color (only for standard tier)
        if (colorPicker && data.showroomTier === 'standard') {
            data.showroomLightingColor = colorPicker.value;
            console.log('Collected lighting color:', data.showroomLightingColor);
        } else {
            console.log('Not collecting lighting color - tier:', data.showroomTier, 'colorPicker:', !!colorPicker);
        }
        
        console.log('Final showroom data:', data);
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
        console.log('=== RESTORE FORM DATA CALLED ===');
        console.log('Current onboarding step:', this.core.currentOnboardingStep);
        console.log('Project:', project);
        
        switch (this.core.currentOnboardingStep) {
            case 'basics':
                console.log('Restoring basics data...');
                this.restoreBasicsData(project);
                break;
            case 'assets':
                console.log('Restoring assets data...');
                this.restoreAssetsData(project);
                break;
            case 'showroom':
                console.log('Restoring showroom data...');
                this.restoreShowroomData(project);
                break;
            case 'integration':
                console.log('Restoring integration data...');
                this.restoreIntegrationData(project);
                break;
            case 'compliance':
                console.log('Restoring compliance data...');
                this.restoreComplianceData(project);
                break;
            default:
                console.log('Unknown onboarding step:', this.core.currentOnboardingStep);
        }
    }


    restoreShowroomData(project) {
        console.log('Restoring showroom data for project:', project);
        console.log('Project showroomTier:', project.showroomTier);
        console.log('Project showroomLightingColor:', project.showroomLightingColor);
        
        // Restore tier selection
        if (project.showroomTier) {
            const tierStandard = document.getElementById('tier-standard');
            const tierBespoke = document.getElementById('tier-bespoke');
            
            if (project.showroomTier === 'standard' && tierStandard) {
                tierStandard.checked = true;
                // Show lighting config
                const lightingConfig = document.getElementById('lighting-config');
                const bespokeInfo = document.getElementById('bespoke-info');
                if (lightingConfig) lightingConfig.style.display = 'block';
                if (bespokeInfo) bespokeInfo.style.display = 'none';
            } else if (project.showroomTier === 'bespoke' && tierBespoke) {
                tierBespoke.checked = true;
                // Show bespoke info
                const lightingConfig = document.getElementById('lighting-config');
                const bespokeInfo = document.getElementById('bespoke-info');
                if (lightingConfig) lightingConfig.style.display = 'none';
                if (bespokeInfo) bespokeInfo.style.display = 'block';
            }
        }
        
        // Restore lighting color
        if (project.showroomLightingColor) {
            const colorPicker = document.getElementById('showroom-lighting-color');
            if (colorPicker) {
                colorPicker.value = project.showroomLightingColor;
                
                // Update color preview
                const colorSwatch = document.querySelector('.color-swatch');
                const colorValue = document.querySelector('.color-value');
                if (colorSwatch) colorSwatch.style.backgroundColor = project.showroomLightingColor;
                if (colorValue) colorValue.textContent = project.showroomLightingColor;
            }
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
        console.log('=== RESTORE ASSETS DATA CALLED ===');
        console.log('Restoring assets for project:', project);
        console.log('Project asset keys:', {
            [AssetConstants.ASSET_KEYS.GAME_LOGO]: project[AssetConstants.ASSET_KEYS.GAME_LOGO],
            [AssetConstants.ASSET_KEYS.COVER_ART]: project[AssetConstants.ASSET_KEYS.COVER_ART],
            [AssetConstants.ASSET_KEYS.TRAILER]: project[AssetConstants.ASSET_KEYS.TRAILER]
        });
        console.log('All project keys:', Object.keys(project));
        
        // Check if project has any assets before showing loading states
        const hasAnyAssets = project[AssetConstants.ASSET_KEYS.GAME_LOGO] || 
                            project[AssetConstants.ASSET_KEYS.COVER_ART] || 
                            project[AssetConstants.ASSET_KEYS.TRAILER] ||
                            (project.screenshots && project.screenshots.length > 0);
        
        if (!hasAnyAssets) {
            console.log('No assets found for project, skipping loading states');
            return;
        }
        
        // Show loading state only for areas that have assets
        console.log('Showing loading state for asset areas with data...');
        this.showAssetLoadingForExistingAssets(project);
        
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
                    // Check if it's a video file
                    if (projectUrls.trailerUrl.toLowerCase().includes('.mp4') || 
                        projectUrls.trailerUrl.toLowerCase().includes('.webm') ||
                        projectUrls.trailerUrl.toLowerCase().includes('.mov')) {
                        // Handle as video
                        background.innerHTML = `<video controls><source src="${projectUrls.trailerUrl}" type="video/mp4"></video>`;
                        trailerArea.classList.add('has-video');
                        this.hideAssetLoading(trailerArea);
                    } else {
                        // Handle as image (thumbnail)
                        const img = new Image();
                        img.onload = () => {
                    background.style.backgroundImage = `url(${projectUrls.trailerUrl})`;
                            trailerArea.classList.add('has-image');
                            this.hideAssetLoading(trailerArea);
                        };
                        img.onerror = () => {
                            console.error('❌ Failed to load trailer thumbnail');
                            this.hideAssetLoading(trailerArea);
                        };
                        img.src = projectUrls.trailerUrl;
                    }
                }
            }
        }

        // Handle screenshots from project's screenshotsKeys field
        const screenshotsArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.SCREENSHOTS));
        console.log('Screenshots area found:', !!screenshotsArea);
        if (screenshotsArea && project.screenshotsKeys) {
            let list = screenshotsArea.querySelector('.thumb-list');
            if (!list) {
                list = document.createElement('div');
                list.className = 'thumb-list';
                screenshotsArea.appendChild(list);
            }
            
            try {
                const screenshotKeys = JSON.parse(project.screenshotsKeys);
                console.log('Processing screenshots from project key:', screenshotKeys.length, 'screenshots');
                
                if (screenshotKeys.length === 0) {
                    this.hideScreenshotsLoading(screenshotsArea);
                    return;
                }
                
                // Show loading state for screenshots
                console.log('Showing loading for screenshots area');
                this.showScreenshotsLoading(screenshotsArea);
                
                // Add a small delay to ensure loading state is visible
                setTimeout(() => {
                    console.log('Loading state should be visible now');
                }, 100);
                
                let loadedCount = 0;
                const totalScreenshots = screenshotKeys.length;
                
                // Get screenshot URLs from the project asset URLs API
                console.log('Calling screenshot API with project ID:', project.id);
                console.log('API URL:', `${this.core.apiBaseUrl}/api/uploads/${project.id}/project-urls`);
                
                fetch(`${this.core.apiBaseUrl}/api/uploads/${project.id}/project-urls`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                }).then(async response => {
                    console.log('Screenshot API response status:', response.status);
                    console.log('Screenshot API response headers:', response.headers);
                    
                    if (response.ok) {
                        const responseText = await response.text();
                        console.log('Screenshot API raw response:', responseText);
                        
                        // Check if response is HTML (error page)
                        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                            console.error('❌ API returned HTML instead of JSON - likely server error or authentication issue');
                            console.error('HTML response:', responseText.substring(0, 200) + '...');
                            this.hideScreenshotsLoading(screenshotsArea);
                            return;
                        }
                        
                        try {
                            const data = JSON.parse(responseText);
                            console.log('Screenshot API parsed data:', data);
                            
                            // The API should return screenshotUrls array
                            const screenshotUrls = data.screenshotUrls || [];
                            console.log('Received screenshot URLs:', screenshotUrls.length);
                        
                        for (let i = 0; i < screenshotUrls.length; i++) {
                            const screenshotUrl = screenshotUrls[i];
                            console.log('Processing screenshot URL:', screenshotUrl);
                            
                            const thumb = document.createElement('div');
                            thumb.className = 'thumb-item';
                            
                            const img = new Image();
                            img.onload = () => {
                                console.log('✅ Screenshot image loaded successfully:', screenshotUrl);
                                // Create thumbnail with remove button
                                thumb.innerHTML = `
                                    <img src="${screenshotUrl}" alt="Screenshot">
                                    <button class="remove-screenshot-btn" title="Remove screenshot">×</button>
                                `;
                                
                                // Bind remove button
                                const removeBtn = thumb.querySelector('.remove-screenshot-btn');
                                removeBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    this.removeScreenshotFromRestored(thumb, screenshotKeys[i]);
                                };
                                
                                list.appendChild(thumb);
                                loadedCount++;
                                console.log(`Screenshot ${loadedCount}/${screenshotUrls.length} loaded`);
                                if (loadedCount === screenshotUrls.length) {
                                    this.hideScreenshotsLoading(screenshotsArea);
                                    this.updateScreenshotControls(screenshotsArea);
                                }
                            };
                            img.onerror = () => {
                                console.error('❌ Failed to load screenshot:', screenshotUrl);
                                loadedCount++;
                                if (loadedCount === screenshotUrls.length) {
                                    this.hideScreenshotsLoading(screenshotsArea);
                                }
                            };
                            
                            console.log('Setting image source to:', screenshotUrl);
                            img.src = screenshotUrl;
                        }
                        
                            // If no screenshots to load, hide loading immediately
                            if (screenshotUrls.length === 0) {
                                this.hideScreenshotsLoading(screenshotsArea);
                            }
                        } catch (parseError) {
                            console.error('❌ Failed to parse screenshot API response as JSON:', parseError);
                            console.error('Raw response was:', responseText);
                            this.hideScreenshotsLoading(screenshotsArea);
                        }
                    } else {
                        console.error('❌ Screenshot API returned error status:', response.status);
                        const errorText = await response.text();
                        console.error('Error response body:', errorText);
                        
                        // Handle specific error cases
                        if (response.status === 401) {
                            console.error('❌ Authentication failed - user not logged in');
                        } else if (response.status === 404) {
                            console.error('❌ Project not found - project ID might be invalid:', project.id);
                        } else if (response.status === 500) {
                            console.error('❌ Server error - check server logs');
                        }
                        
                        this.hideScreenshotsLoading(screenshotsArea);
                    }
                }).catch(error => {
                    console.error('❌ Error fetching screenshot URLs:', error);
                    console.error('This might be due to server not running or authentication issues');
                    this.hideScreenshotsLoading(screenshotsArea);
                    
                    // Show user-friendly message
                    const list = screenshotsArea.querySelector('.thumb-list');
                    if (list) {
                        list.innerHTML = '<div class="error-message" style="padding: 1rem; text-align: center; color: #ff6b6b;">⚠️ Unable to load screenshots. Please try refreshing the page.</div>';
                    }
                });
            } catch (e) {
                console.error('Failed to parse screenshots key:', e);
                this.hideScreenshotsLoading(screenshotsArea);
            }
        } else if (screenshotsArea) {
            // No screenshots key, hide loading immediately
            this.hideScreenshotsLoading(screenshotsArea);
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
        console.log('showAssetLoading called for:', uploadArea.id);
        const overlay = uploadArea.querySelector('.upload-overlay');
        console.log('Found overlay:', !!overlay);
        if (overlay) {
            console.log('Setting loading content for overlay');
            overlay.innerHTML = `
                <div class="upload-icon">⏳</div>
                <div class="upload-text">
                    <strong>Loading...</strong>
                    <p>Fetching asset preview</p>
                </div>
            `;
            overlay.style.opacity = '0.8';
            console.log('Loading state applied to:', uploadArea.id);
        } else {
            console.log('❌ No overlay found in upload area:', uploadArea.id);
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
                        <p>PNG/JPG 1920x1080 px</p>
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
        console.log('=== SHOW SCREENSHOTS LOADING ===');
        console.log('Screenshots area:', screenshotsArea);
        console.log('Screenshots area ID:', screenshotsArea?.id);
        console.log('Screenshots area classes:', screenshotsArea?.className);
        
        const overlay = screenshotsArea.querySelector('.upload-overlay');
        console.log('Found overlay:', !!overlay);
        console.log('Overlay element:', overlay);
        
        if (overlay) {
            console.log('Overlay before update:', overlay.innerHTML);
            overlay.innerHTML = `
                <div class="upload-icon" style="font-size: 2rem; animation: spin 1s linear infinite;">⏳</div>
                <div class="upload-text">
                    <strong>Loading Screenshots...</strong>
                    <p>Fetching screenshot previews</p>
                </div>
            `;
            overlay.style.display = 'block';
            overlay.style.opacity = '1';
            overlay.style.background = 'rgba(0, 0, 0, 0.8)';
            overlay.style.border = '2px dashed #4A90E2';
            console.log('Loading state applied to screenshots area');
            console.log('Overlay after update:', overlay.innerHTML);
            console.log('Overlay styles:', {
                display: overlay.style.display,
                opacity: overlay.style.opacity,
                background: overlay.style.background
            });
        } else {
            console.error('❌ No overlay found in screenshots area');
            console.log('Available elements in screenshots area:', screenshotsArea?.querySelectorAll('*'));
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

        console.log('Asset area IDs to show loading for:', assetAreas);
        
        assetAreas.forEach(areaId => {
            const area = document.getElementById(areaId);
            console.log(`Looking for area ${areaId}:`, !!area);
            if (area) {
                console.log(`Showing loading for ${areaId}`);
                this.showAssetLoading(area);
            } else {
                console.log(`❌ Area ${areaId} not found in DOM`);
            }
        });
    }

    // Show loading state only for asset areas that have existing assets
    showAssetLoadingForExistingAssets(project) {
        console.log('Showing loading only for areas with existing assets...');
        
        // Check each asset type and show loading only if it exists
        if (project[AssetConstants.ASSET_KEYS.GAME_LOGO]) {
            const logoArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.APP_ICON));
            if (logoArea) {
                console.log('Showing loading for game logo area');
                this.showAssetLoading(logoArea);
            }
        }
        
        if (project[AssetConstants.ASSET_KEYS.COVER_ART]) {
            const coverArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.HERO_IMAGE));
            if (coverArea) {
                console.log('Showing loading for cover art area');
                this.showAssetLoading(coverArea);
            }
        }
        
        if (project[AssetConstants.ASSET_KEYS.TRAILER]) {
            const trailerArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.TRAILER));
            if (trailerArea) {
                console.log('Showing loading for trailer area');
                this.showAssetLoading(trailerArea);
            }
        }
        
        if (project.screenshots && project.screenshots.length > 0) {
            const screenshotsArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.SCREENSHOTS));
            if (screenshotsArea) {
                console.log('Showing loading for screenshots area');
                this.showAssetLoading(screenshotsArea);
            }
        }
    }

    // Screenshot management methods for restored data
    removeScreenshotFromRestored(thumbItem, fileKey) {
        console.log('Removing restored screenshot with key:', fileKey);
        
        // Remove from UI
        thumbItem.remove();
        
        // Remove from project data
        if (this.core.currentOnboardingProject && this.core.currentOnboardingProject.screenshotsKeys) {
            try {
                let screenshots = JSON.parse(this.core.currentOnboardingProject.screenshotsKeys);
                screenshots = screenshots.filter(key => key !== fileKey);
                this.core.currentOnboardingProject.screenshotsKeys = JSON.stringify(screenshots);
                
                console.log('Updated screenshots array after removal:', screenshots);
                
                // Update controls visibility
                const screenshotsArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.SCREENSHOTS));
                if (screenshotsArea) {
                    this.updateScreenshotControls(screenshotsArea);
                }
            } catch (e) {
                console.error('Failed to parse screenshots keys:', e);
            }
        }
    }

    updateScreenshotControls(screenshotsArea) {
        const list = screenshotsArea.querySelector('.thumb-list');
        const controls = screenshotsArea.querySelector('.screenshot-controls');
        const count = list ? list.children.length : 0;
        
        if (count > 0) {
            // Show controls
            if (controls) controls.style.display = 'block';
            
            // Bind clear all button
            const clearBtn = screenshotsArea.querySelector('#clear-screenshots-btn');
            if (clearBtn && !clearBtn.hasAttribute('data-bound')) {
                clearBtn.setAttribute('data-bound', 'true');
                clearBtn.onclick = () => {
                    if (confirm('Are you sure you want to clear all screenshots?')) {
                        this.clearAllScreenshots();
                    }
                };
            }
        } else {
            // Hide controls
            if (controls) controls.style.display = 'none';
        }
    }

    clearAllScreenshots() {
        console.log('Clearing all screenshots');
        
        // Clear from project data
        if (this.core.currentOnboardingProject) {
            this.core.currentOnboardingProject.screenshotsKeys = JSON.stringify([]);
        }
        
        // Clear UI
        const screenshotsArea = document.getElementById(AssetConstants.getUploadAreaId(AssetConstants.ASSET_TYPES.SCREENSHOTS));
        if (screenshotsArea) {
            const list = screenshotsArea.querySelector('.thumb-list');
            if (list) {
                list.innerHTML = '';
            }
            
            // Reset upload area appearance
            const overlay = screenshotsArea.querySelector('.upload-overlay');
            if (overlay) {
                overlay.style.display = 'block';
                overlay.style.opacity = '1';
            }
            
            // Hide controls
            this.updateScreenshotControls(screenshotsArea);
        }
        
        console.log('All screenshots cleared');
    }
}
