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

        this.clearFieldValidation(field);

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

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.showFieldSuccess(field);
        }

        return isValid;
    }

    validateStep(step) {
        const requiredFields = this.getRequiredFieldsForStep(step);
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getRequiredFieldsForStep(step) {
        switch (step) {
            case 'basics':
                return ['ob-short-description', 'ob-genre', 'ob-publishing-track', 'ob-build-status'];
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
        if (!container) {
            return;
        }

        const errorEl = container.querySelector('.field-error');
        const successEl = container.querySelector('.field-success');
        
        if (errorEl && errorEl.parentNode) errorEl.parentNode.removeChild(errorEl);
        if (successEl && successEl.parentNode) successEl.parentNode.removeChild(successEl);
        
        field.classList.remove('field-error', 'field-success');
    }

    showFieldError(field, message) {
        if (!field || !document.body.contains(field)) return;
        const container = field.closest('.form-group') || field.parentElement;
        if (!container) return;

        field.classList.add('field-error');
        field.classList.remove('field-success');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        
        container.appendChild(errorEl);
    }

    showFieldSuccess(field) {
        if (!field || !document.body.contains(field)) return;
        const container = field.closest('.form-group') || field.parentElement;
        if (!container) return;

        field.classList.add('field-success');
        field.classList.remove('field-error');
        
        const successEl = document.createElement('div');
        successEl.className = 'field-success';
        successEl.textContent = '✓';
        
        container.appendChild(successEl);
    }
}
