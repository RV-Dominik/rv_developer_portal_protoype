// Onboarding validation functionality
class OnboardingValidation {
    constructor(portalCore) {
        this.core = portalCore;
    }

    validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Only clear validation on form submission, not during typing
        // This prevents DOM manipulation issues that cause fields to disappear
        // this.clearFieldValidation(field);

        switch (fieldId) {
            case 'ob-short-description':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Short description is required';
                } else if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'Description must be at least 10 characters';
                } else if (value.length > 500) {
                    isValid = false;
                    errorMessage = 'Description must be less than 500 characters';
                }
                break;

            case 'ob-full-description':
                if (value && value.length > 2000) {
                    isValid = false;
                    errorMessage = 'Full description must be less than 2000 characters';
                }
                break;

            case 'ob-genre':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a genre';
                }
                break;

            case 'ob-publishing-track':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a publishing track';
                }
                break;

            case 'ob-build-status':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a build status';
                }
                break;

            case 'ob-game-url':
                if (value && !this.isValidUrl(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid URL';
                }
                break;

            case 'ob-launcher-url':
                if (value && !this.isValidUrl(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid URL';
                }
                break;

            case 'ob-support-email':
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;

            case 'ob-pass-sso':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select Pass SSO integration status';
                }
                break;

            case 'ob-sdk-status':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select Readyverse SDK integration status';
                }
                break;

            case 'ob-legal-requirements':
                if (!field.checked) {
                    isValid = false;
                    errorMessage = 'Legal requirements must be completed';
                }
                break;

            case 'ob-privacy-policy':
                if (!field.checked) {
                    isValid = false;
                    errorMessage = 'Privacy policy must be provided';
                }
                break;

            case 'ob-terms-accepted':
                if (!field.checked) {
                    isValid = false;
                    errorMessage = 'Terms must be accepted';
                }
                break;

            case 'ob-content-guidelines':
                if (!field.checked) {
                    isValid = false;
                    errorMessage = 'Content guidelines must be accepted';
                }
                break;
        }

        // Only show validation errors on form submission, not during typing
        // This prevents DOM manipulation issues that cause fields to disappear
        // if (!isValid) {
        //     this.showFieldError(field, errorMessage);
        // } else {
        //     this.showFieldSuccess(field);
        // }

        return isValid;
    }

    validateStep(step) {
        // Special handling for showroom step
        if (step === 'showroom') {
            return this.validateShowroomStep();
        }

        const requiredFields = this.getRequiredFieldsForStep(step);
        let isValid = true;

        // Clear all validation first
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                this.clearFieldValidation(field);
            }
        });

        // Validate each field and show errors
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const fieldValid = this.validateField(field);
                if (!fieldValid) {
                    isValid = false;
                    // Show error for this field
                    this.showFieldError(field, this.getFieldErrorMessage(field));
                } else {
                    // Show success for this field
                    this.showFieldSuccess(field);
                }
            }
        });

        return isValid;
    }

    // Silent validation for auto-save (no visual feedback)
    validateStepSilent(step) {
        const requiredFields = this.getRequiredFieldsForStep(step);
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const fieldValid = this.validateField(field);
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    getFieldErrorMessage(field) {
        const fieldId = field.id;
        const value = field.value.trim();

        switch (fieldId) {
            case 'ob-short-description':
                if (!value) return 'Short description is required';
                if (value.length < 10) return 'Description must be at least 10 characters';
                if (value.length > 500) return 'Description must be less than 500 characters';
                break;
            case 'ob-genre':
                if (!value) return 'Please select a genre';
                break;
            case 'ob-publishing-track':
                if (!value) return 'Please select a publishing track';
                break;
            case 'ob-build-status':
                if (!value) return 'Please select a build status';
                break;
            case 'ob-pass-sso':
                if (!value) return 'Please select Pass SSO integration status';
                break;
            case 'ob-sdk-status':
                if (!value) return 'Please select Readyverse SDK integration status';
                break;
            case 'ob-legal-requirements':
                if (!field.checked) return 'Legal requirements must be completed';
                break;
            case 'ob-privacy-policy':
                if (!field.checked) return 'Privacy policy must be provided';
                break;
            case 'ob-terms-accepted':
                if (!field.checked) return 'Terms must be accepted';
                break;
            case 'ob-content-guidelines':
                if (!field.checked) return 'Content guidelines must be accepted';
                break;
        }
        return 'This field is required';
    }

    getRequiredFieldsForStep(step) {
        switch (step) {
            case 'basics':
                return ['ob-short-description', 'ob-genre', 'ob-publishing-track', 'ob-build-status'];
            case 'showroom':
                return ['tier-standard', 'tier-bespoke']; // Radio button validation
            case 'integration':
                return ['ob-pass-sso', 'ob-sdk-status'];
            case 'compliance':
                return ['ob-legal-requirements', 'ob-privacy-policy', 'ob-terms-accepted', 'ob-content-guidelines'];
            default:
                return [];
        }
    }

    getValidationErrors() {
        const errors = [];
        const requiredFields = this.getRequiredFieldsForStep(this.core.currentOnboardingStep);
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                const errorEl = field.parentNode.querySelector('.field-error');
                if (errorEl) {
                    errors.push({
                        field: fieldId,
                        message: errorEl.textContent
                    });
                }
            }
        });
        
        return errors;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    clearFieldValidation(field) {
        // If field is no longer in DOM, skip
        if (!field || !document.body.contains(field)) {
            return;
        }

        // Prefer a stable container to append/remove validation UI
        const container = field.closest('.form-group') || field.parentElement;
        if (!container || !document.body.contains(container)) {
            return;
        }

        // Use a more defensive approach - check if elements exist before trying to remove them
        const errorEl = container.querySelector('.field-error');
        const successEl = container.querySelector('.field-success');
        
        // Remove error element if it exists and is still in the DOM
        if (errorEl && errorEl.parentNode === container && document.body.contains(errorEl)) {
            try {
                // Double-check the element is still a child before removing
                if (container.contains(errorEl)) {
                    container.removeChild(errorEl);
                }
            } catch (e) {
                // Element was already removed or moved, ignore silently
                console.warn('Failed to remove error element:', e);
            }
        }
        
        // Remove success element if it exists and is still in the DOM
        if (successEl && successEl.parentNode === container && document.body.contains(successEl)) {
            try {
                // Double-check the element is still a child before removing
                if (container.contains(successEl)) {
                    container.removeChild(successEl);
                }
            } catch (e) {
                // Element was already removed or moved, ignore silently
                console.warn('Failed to remove success element:', e);
            }
        }
        
        // Only remove classes if the field is still in the DOM
        if (document.body.contains(field)) {
            field.classList.remove('field-error', 'field-success');
        }
    }

    showFieldError(field, message) {
        if (!field || !document.body.contains(field)) return;
        const container = field.closest('.form-group') || field.parentElement;
        if (!container || !document.body.contains(container)) return;

        // Clear any existing validation first
        this.clearFieldValidation(field);

        // Double-check field is still in DOM before modifying
        if (!document.body.contains(field)) return;

        field.classList.add('field-error');
        field.classList.remove('field-success');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        
        // Double-check container is still in DOM before appending
        if (document.body.contains(container)) {
            container.appendChild(errorEl);
        }
    }

    showFieldSuccess(field) {
        if (!field || !document.body.contains(field)) return;
        const container = field.closest('.form-group') || field.parentElement;
        if (!container || !document.body.contains(container)) return;

        // Clear any existing validation first
        this.clearFieldValidation(field);

        // Double-check field is still in DOM before modifying
        if (!document.body.contains(field)) return;

        field.classList.add('field-success');
        field.classList.remove('field-error');
        
        const successEl = document.createElement('div');
        successEl.className = 'field-success';
        successEl.textContent = '✓';
        
        // Double-check container is still in DOM before appending
        if (document.body.contains(container)) {
            container.appendChild(successEl);
        }
    }

    validateShowroomStep() {
        const standardTier = document.getElementById('tier-standard');
        const bespokeTier = document.getElementById('tier-bespoke');
        
        // Check if at least one tier is selected
        const isTierSelected = (standardTier && standardTier.checked) || (bespokeTier && bespokeTier.checked);
        
        if (!isTierSelected) {
            // Show error message
            const tierSelection = document.querySelector('.tier-selection');
            if (tierSelection) {
                this.showTierSelectionError(tierSelection, 'Please select a showroom tier');
            }
            return false;
        }
        
        // Clear any existing errors
        this.clearTierSelectionError();
        
        // If standard tier is selected, validate color picker
        if (standardTier && standardTier.checked) {
            const colorPicker = document.getElementById('showroom-lighting-color');
            if (colorPicker && (!colorPicker.value || colorPicker.value.trim() === '')) {
                this.showColorPickerError(colorPicker, 'Please select a lighting color');
                return false;
            }
        }
        
        return true;
    }

    showTierSelectionError(container, message) {
        this.clearTierSelectionError();
        
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error tier-error';
        errorEl.textContent = message;
        
        if (document.body.contains(container)) {
            container.appendChild(errorEl);
        }
    }

    clearTierSelectionError() {
        const errorEl = document.querySelector('.tier-error');
        if (errorEl && errorEl.parentNode) {
            errorEl.parentNode.removeChild(errorEl);
        }
    }

    showColorPickerError(field, message) {
        this.clearFieldValidation(field);
        
        const container = field.closest('.form-group') || field.parentElement;
        if (!container || !document.body.contains(container)) {
            return;
        }

        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        
        if (document.body.contains(container)) {
            container.appendChild(errorEl);
        }
        
        field.classList.add('field-error');
        field.classList.remove('field-success');
    }
}
