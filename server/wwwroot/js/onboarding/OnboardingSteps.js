// Onboarding step content and validation
class OnboardingSteps {
    constructor(portalCore) {
        this.core = portalCore;
    }

    getStepContent(step, project) {
        switch (step) {
            case 'basics':
                return this.getBasicsContent(project);
            case 'assets':
                return this.getAssetsContent(project);
            case 'integration':
                return this.getIntegrationContent(project);
            case 'compliance':
                return this.getComplianceContent(project);
            case 'review':
                return this.getReviewContent(project);
            default:
                return '<p>Step content not found.</p>';
        }
    }

    getBasicsContent(project) {
        return `
            <div class="form-group">
                <label for="ob-short-description">Short Description *</label>
                <textarea id="ob-short-description" name="shortDescription" 
                          placeholder="Brief description of your project (10-500 characters)" 
                          class="form-input" rows="3" required>${project.shortDescription || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label for="ob-full-description">Full Description</label>
                <textarea id="ob-full-description" name="fullDescription" 
                          placeholder="Detailed description of your project (optional)" 
                          class="form-input" rows="4">${project.fullDescription || ''}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="ob-genre">Genre *</label>
                    <select id="ob-genre" name="genre" class="form-input" required>
                        <option value="">Select a genre</option>
                        <option value="Action" ${project.genre === 'Action' ? 'selected' : ''}>Action</option>
                        <option value="Adventure" ${project.genre === 'Adventure' ? 'selected' : ''}>Adventure</option>
                        <option value="RPG" ${project.genre === 'RPG' ? 'selected' : ''}>RPG</option>
                        <option value="Simulation" ${project.genre === 'Simulation' ? 'selected' : ''}>Simulation</option>
                        <option value="Strategy" ${project.genre === 'Strategy' ? 'selected' : ''}>Strategy</option>
                        <option value="Sports" ${project.genre === 'Sports' ? 'selected' : ''}>Sports</option>
                        <option value="Racing" ${project.genre === 'Racing' ? 'selected' : ''}>Racing</option>
                        <option value="Fighting" ${project.genre === 'Fighting' ? 'selected' : ''}>Fighting</option>
                        <option value="Puzzle" ${project.genre === 'Puzzle' ? 'selected' : ''}>Puzzle</option>
                        <option value="Other" ${project.genre === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ob-publishing-track">Publishing Track *</label>
                    <select id="ob-publishing-track" name="publishingTrack" class="form-input" required>
                        <option value="">Select a track</option>
                        <option value="Platform Games" ${project.publishingTrack === 'Platform Games' ? 'selected' : ''}>Platform Games</option>
                        <option value="Self-Hosted" ${project.publishingTrack === 'Self-Hosted' ? 'selected' : ''}>Self-Hosted</option>
                        <option value="Readyverse Hosted" ${project.publishingTrack === 'Readyverse Hosted' ? 'selected' : ''}>Readyverse Hosted</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="ob-build-status">Build Status *</label>
                <select id="ob-build-status" name="buildStatus" class="form-input" required>
                    <option value="">Select build status</option>
                    <option value="In Development" ${project.buildStatus === 'In Development' ? 'selected' : ''}>In Development</option>
                    <option value="Beta" ${project.buildStatus === 'Beta' ? 'selected' : ''}>Beta</option>
                    <option value="Production-Ready" ${project.buildStatus === 'Production-Ready' ? 'selected' : ''}>Production-Ready</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Target Platforms</label>
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="ob-platform-pc" name="targetPlatforms" value="PC">
                        <span class="checkmark"></span>
                        PC
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="ob-platform-mac" name="targetPlatforms" value="Mac">
                        <span class="checkmark"></span>
                        Mac
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="ob-platform-linux" name="targetPlatforms" value="Linux">
                        <span class="checkmark"></span>
                        Linux
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="ob-platform-web" name="targetPlatforms" value="Web">
                        <span class="checkmark"></span>
                        Web
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="ob-is-public" name="isPublic" ${project.isPublic ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    Make this project public in the gallery
                </label>
            </div>
        `;
    }

    getAssetsContent(project) {
        return `
            <div class="assets-section">
                <h4>Upload Your Game Assets</h4>
                <p>Upload the required assets for your project. All files will be stored securely.</p>
                
                <div class="asset-upload-grid">
                    <div class="asset-upload-item small">
                        <div class="file-upload-area ratio-1-1" id="appicon-upload" data-kind="app_icon" data-w="1024" data-h="1024">
                            <div class="upload-background"></div>
                            <div class="upload-overlay">
                                <div class="upload-icon">🧩</div>
                                <div class="upload-text">
                                    <strong>App Icon</strong>
                                    <p>PNG 1024x1024 px</p>
                                </div>
                            </div>
                            <input type="file" id="appicon-file" accept="image/png" style="display: none;">
                        </div>
                    </div>
                    
                    <div class="asset-upload-item wide">
                        <div class="file-upload-area ratio-16-9" id="hero-upload" data-kind="hero_image" data-w="1920" data-h="1080">
                            <div class="upload-background"></div>
                            <div class="upload-overlay">
                                <div class="upload-icon">🖼️</div>
                                <div class="upload-text">
                                    <strong>Thumbnail / Hero Image</strong>
                                    <p>PNG 1920x1080 px</p>
                                </div>
                            </div>
                            <input type="file" id="hero-file" accept="image/png" style="display: none;">
                        </div>
                    </div>
                    
                    <div class="asset-upload-item medium">
                        <div class="file-upload-area ratio-16-9" id="screenshots-upload" data-kind="screenshot" data-w="1920" data-h="1080">
                            <div class="upload-background"></div>
                            <div class="upload-overlay">
                                <div class="upload-icon">📸</div>
                                <div class="upload-text">
                                    <strong>Screenshots</strong>
                                    <p>PNG/JPG 1920x1080 px (max 10MB each)</p>
                                </div>
                            </div>
                            <input type="file" id="screenshots-file" accept="image/*" multiple style="display: none;">
                        </div>
                    </div>
                    
                    <div class="asset-upload-item medium">
                        <div class="file-upload-area ratio-16-9" id="trailer-upload" data-kind="trailer" data-w="1920" data-h="1080" data-duration="15" data-maxsize="5242880">
                            <div class="upload-background"></div>
                            <div class="upload-overlay">
                                <div class="upload-icon">🎬</div>
                                <div class="upload-text">
                                    <strong>Trailer</strong>
                                    <p>MP4 Full HD 1920x1080, 15s max, 5MB max</p>
                                </div>
                            </div>
                            <input type="file" id="trailer-file" accept="video/mp4" style="display: none;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getIntegrationContent(project) {
        return `
            <div class="integration-section">
                <h4>Technical Integration</h4>
                <p>Configure your project's technical integration with Readyverse services.</p>
                
                <div class="form-group">
                    <label for="ob-pass-sso">Pass SSO Integration Status *</label>
                    <select id="ob-pass-sso" name="passSsoIntegrationStatus" class="form-input" required>
                        <option value="">Select status</option>
                        <option value="Not Started" ${project.passSsoIntegrationStatus === 'Not Started' ? 'selected' : ''}>Not Started</option>
                        <option value="In Progress" ${project.passSsoIntegrationStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Complete" ${project.passSsoIntegrationStatus === 'Complete' ? 'selected' : ''}>Complete</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ob-sdk-status">Readyverse SDK Integration Status *</label>
                    <select id="ob-sdk-status" name="readyverseSdkIntegrationStatus" class="form-input" required>
                        <option value="">Select status</option>
                        <option value="Not Started" ${project.readyverseSdkIntegrationStatus === 'Not Started' ? 'selected' : ''}>Not Started</option>
                        <option value="In Progress" ${project.readyverseSdkIntegrationStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Complete" ${project.readyverseSdkIntegrationStatus === 'Complete' ? 'selected' : ''}>Complete</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ob-game-url">Game URL</label>
                    <input type="url" id="ob-game-url" name="gameUrl" 
                           placeholder="https://yourgame.com" 
                           class="form-input" value="${project.gameUrl || ''}">
                </div>
                
                <div class="form-group">
                    <label for="ob-launcher-url">Launcher URL</label>
                    <input type="url" id="ob-launcher-url" name="launcherUrl" 
                           placeholder="https://launcher.yourgame.com" 
                           class="form-input" value="${project.launcherUrl || ''}">
                </div>
                
                <div class="form-group">
                    <label for="ob-integration-notes">Integration Notes</label>
                    <textarea id="ob-integration-notes" name="integrationNotes" 
                              placeholder="Any additional notes about your integration..." 
                              class="form-input" rows="3">${project.integrationNotes || ''}</textarea>
                </div>
            </div>
        `;
    }

    getComplianceContent(project) {
        return `
            <div class="compliance-section">
                <h4>Legal & Compliance</h4>
                <p>Complete the required legal and compliance requirements.</p>
                
                <div class="compliance-checklist">
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-legal-requirements" name="legalRequirementsCompleted" ${project.legalRequirementsCompleted ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Legal Requirements Completed *
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-privacy-policy" name="privacyPolicyProvided" ${project.privacyPolicyProvided ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Privacy Policy Provided *
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-terms-accepted" name="termsAccepted" ${project.termsAccepted ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Terms of Service Accepted *
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-content-guidelines" name="contentGuidelinesAccepted" ${project.contentGuidelinesAccepted ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Content Guidelines Accepted *
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="ob-distribution-rights" name="distributionRightsConfirmed" ${project.distributionRightsConfirmed ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Distribution Rights Confirmed
                        </label>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="ob-rating-board">Rating Board</label>
                        <select id="ob-rating-board" name="ratingBoard" class="form-input">
                            <option value="">Select rating board</option>
                            <option value="ESRB" ${project.ratingBoard === 'ESRB' ? 'selected' : ''}>ESRB</option>
                            <option value="PEGI" ${project.ratingBoard === 'PEGI' ? 'selected' : ''}>PEGI</option>
                            <option value="CERO" ${project.ratingBoard === 'CERO' ? 'selected' : ''}>CERO</option>
                            <option value="Other" ${project.ratingBoard === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="ob-support-email">Support Email</label>
                        <input type="email" id="ob-support-email" name="supportEmail" 
                               placeholder="support@yourgame.com" 
                               class="form-input" value="${project.supportEmail || ''}">
                    </div>
                </div>
            </div>
        `;
    }

    getReviewContent(project) {
        return `
            <div class="review-section">
                <h4>Review & Submit</h4>
                <p>Review all the information you've provided and submit your project for approval.</p>
                
                <div class="review-summary">
                    <div class="summary-section">
                        <h5>Project Information</h5>
                        <div class="summary-item">
                            <strong>Name:</strong> ${project.name}
                        </div>
                        <div class="summary-item">
                            <strong>Description:</strong> ${project.shortDescription || 'Not provided'}
                        </div>
                        <div class="summary-item">
                            <strong>Genre:</strong> ${project.genre || 'Not selected'}
                        </div>
                        <div class="summary-item">
                            <strong>Publishing Track:</strong> ${project.publishingTrack || 'Not selected'}
                        </div>
                        <div class="summary-item">
                            <strong>Build Status:</strong> ${project.buildStatus || 'Not selected'}
                        </div>
                    </div>
                    
                    <div class="summary-section">
                        <h5>Integration Status</h5>
                        <div class="summary-item">
                            <strong>Pass SSO:</strong> ${project.passSsoIntegrationStatus || 'Not started'}
                        </div>
                        <div class="summary-item">
                            <strong>Readyverse SDK:</strong> ${project.readyverseSdkIntegrationStatus || 'Not started'}
                        </div>
                        <div class="summary-item">
                            <strong>Game URL:</strong> ${project.gameUrl || 'Not provided'}
                        </div>
                    </div>
                    
                    <div class="summary-section">
                        <h5>Compliance</h5>
                        <div class="summary-item">
                            <strong>Legal Requirements:</strong> ${project.legalRequirementsCompleted ? '✓ Complete' : '✗ Incomplete'}
                        </div>
                        <div class="summary-item">
                            <strong>Privacy Policy:</strong> ${project.privacyPolicyProvided ? '✓ Provided' : '✗ Missing'}
                        </div>
                        <div class="summary-item">
                            <strong>Terms Accepted:</strong> ${project.termsAccepted ? '✓ Accepted' : '✗ Not accepted'}
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="ob-review-notes">Additional Notes</label>
                    <textarea id="ob-review-notes" name="reviewNotes" 
                              placeholder="Any additional information for the review team..." 
                              class="form-input" rows="3">${project.reviewNotes || ''}</textarea>
                </div>
                
                <div class="submission-warning">
                    <p><strong>Important:</strong> Once submitted, your project will be reviewed by the Readyverse team. This process typically takes 2-3 business days. You will be notified via email once the review is complete.</p>
                </div>
            </div>
        `;
    }

    getStepPreview(step, project) {
        switch (step) {
            case 'basics':
                return this.getBasicsPreview(project);
            case 'assets':
                return this.getAssetsPreview(project);
            case 'integration':
                return this.getIntegrationPreview(project);
            case 'compliance':
                return this.getCompliancePreview(project);
            case 'review':
                return this.getReviewPreview(project);
            default:
                return '<div class="preview-card"><p>Preview not available</p></div>';
        }
    }

    getBasicsPreview(project) {
        return `
            <div class="preview-card enhanced">
                <div class="preview-card-header">
                    <h4>Project Preview</h4>
                    <div class="preview-badge">Live Preview</div>
                    <div class="preview-actions"><a class="btn-primary" href="rvshowroom://open?projectId=${project.id}">Open in Unreal</a></div>
                </div>
                <div class="preview-project-card">
                    <div class="preview-project-title" id="preview-project-name">${project.name}</div>
                    <div class="preview-project-description" id="preview-project-desc">${project.shortDescription || 'Your project description will appear here'}</div>
                    <div class="preview-project-meta">
                        <span class="preview-genre" id="preview-genre">${project.genre || 'Genre'}</span>
                        <span class="preview-track" id="preview-track">${project.publishingTrack || 'Track'}</span>
                    </div>
                    <div class="preview-project-status">
                        <span class="status-badge" id="preview-status">${project.buildStatus || 'Development'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getAssetsPreview(project) {
        return `
            <div class="preview-card enhanced">
                <div class="preview-card-header">
                    <h4>Asset Gallery</h4>
                    <div class="preview-badge">Upload Preview</div>
                    <div class="preview-actions"><a class="btn-primary" href="rvshowroom://open?projectId=${project.id}">Open in Unreal</a></div>
                </div>
                <div class="asset-gallery-preview">
                    <div class="asset-slot logo-slot">
                        <div class="asset-placeholder" id="logo-placeholder">
                            <div class="asset-icon">🎮</div>
                            <div class="asset-label">Game Logo</div>
                        </div>
                    </div>
                    <div class="asset-slot cover-slot">
                        <div class="asset-placeholder" id="cover-placeholder">
                            <div class="asset-icon">🖼️</div>
                            <div class="asset-label">Cover Art</div>
                        </div>
                    </div>
                    <div class="asset-slot screenshot-slot">
                        <div class="asset-placeholder" id="screenshot-placeholder">
                            <div class="asset-icon">📸</div>
                            <div class="asset-label">Screenshots</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getIntegrationPreview(project) {
        return `
            <div class="preview-card enhanced">
                <div class="preview-card-header">
                    <h4>Integration Dashboard</h4>
                    <div class="preview-badge">Status Overview</div>
                    <div class="preview-actions"><a class="btn-primary" href="rvshowroom://open?projectId=${project.id}">Open in Unreal</a></div>
                </div>
                <div class="integration-status-grid">
                    <div class="status-card">
                        <div class="status-icon">🔐</div>
                        <div class="status-info">
                            <div class="status-title">Pass SSO</div>
                            <div class="status-value" id="preview-pass-sso">${project.passSsoIntegrationStatus || 'Not started'}</div>
                        </div>
                    </div>
                    <div class="status-card">
                        <div class="status-icon">⚡</div>
                        <div class="status-info">
                            <div class="status-title">Readyverse SDK</div>
                            <div class="status-value" id="preview-sdk-status">${project.readyverseSdkIntegrationStatus || 'Not started'}</div>
                        </div>
                    </div>
                    <div class="status-card">
                        <div class="status-icon">🌐</div>
                        <div class="status-info">
                            <div class="status-title">Game URL</div>
                            <div class="status-value" id="preview-game-url">${project.gameUrl ? 'Configured' : 'Not set'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCompliancePreview(project) {
        return `
            <div class="preview-card enhanced">
                <div class="preview-card-header">
                    <h4>Compliance Checklist</h4>
                    <div class="preview-badge">Legal Review</div>
                    <div class="preview-actions"><a class="btn-primary" href="rvshowroom://open?projectId=${project.id}">Open in Unreal</a></div>
                </div>
                <div class="compliance-checklist">
                    <div class="checklist-item" id="preview-legal-req">
                        <span class="check-icon">${project.legalRequirementsCompleted ? '✅' : '⏳'}</span>
                        <span>Legal Requirements</span>
                    </div>
                    <div class="checklist-item" id="preview-privacy">
                        <span class="check-icon">${project.privacyPolicyProvided ? '✅' : '⏳'}</span>
                        <span>Privacy Policy</span>
                    </div>
                    <div class="checklist-item" id="preview-terms">
                        <span class="check-icon">${project.termsAccepted ? '✅' : '⏳'}</span>
                        <span>Terms Accepted</span>
                    </div>
                    <div class="checklist-item" id="preview-content">
                        <span class="check-icon">${project.contentGuidelinesAccepted ? '✅' : '⏳'}</span>
                        <span>Content Guidelines</span>
                    </div>
                </div>
            </div>
        `;
    }

    getReviewPreview(project) {
        return `
            <div class="preview-card enhanced">
                <div class="preview-card-header">
                    <h4>Review</h4>
                    <div class="preview-badge">Final Check</div>
                    <div class="preview-actions"><a class="btn-primary" href="rvshowroom://open?projectId=${project.id}">Open in Unreal</a></div>
                </div>
                <div class="preview-summary">
                    <p>Verify all details before submission.</p>
                </div>
            </div>
        `;
    }
}
