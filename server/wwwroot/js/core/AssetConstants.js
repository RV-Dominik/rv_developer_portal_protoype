// Asset upload constants to avoid hardcoded strings
class AssetConstants {
    // Asset types - these are used for both upload area IDs and data-kind attributes
    static ASSET_TYPES = {
        APP_ICON: 'app_icon',
        HERO_IMAGE: 'hero_image',
        SCREENSHOTS: 'screenshot',
        TRAILER: 'trailer'
    };

    // Project asset key field names
    static ASSET_KEYS = {
        GAME_LOGO: 'gameLogoKey',
        COVER_ART: 'coverArtKey',
        TRAILER: 'trailerKey',
        SCREENSHOTS: 'screenshotsKeys'
    };

    // Asset type to project key mapping
    static ASSET_TYPE_TO_KEY = {
        [this.ASSET_TYPES.APP_ICON]: this.ASSET_KEYS.GAME_LOGO,
        [this.ASSET_TYPES.HERO_IMAGE]: this.ASSET_KEYS.COVER_ART,
        [this.ASSET_TYPES.TRAILER]: this.ASSET_KEYS.TRAILER,
        [this.ASSET_TYPES.SCREENSHOTS]: this.ASSET_KEYS.SCREENSHOTS
    };

    // Helper method to get project key for an upload area
    static getProjectKeyForUploadArea(uploadArea) {
        const areaId = uploadArea.id;
        const dataKind = uploadArea.getAttribute('data-kind');
        
        // First try data-kind mapping
        if (dataKind && this.ASSET_TYPE_TO_KEY[dataKind]) {
            return this.ASSET_TYPE_TO_KEY[dataKind];
        }
        
        // Fallback to upload area ID mapping (extract type from ID)
        const areaType = this.extractAssetTypeFromId(areaId);
        if (areaType && this.ASSET_TYPE_TO_KEY[areaType]) {
            return this.ASSET_TYPE_TO_KEY[areaType];
        }
        
        return null;
    }

    // Helper method to extract asset type from upload area ID
    static extractAssetTypeFromId(areaId) {
        if (areaId.includes('appicon') || areaId.includes('app_icon')) {
            return this.ASSET_TYPES.APP_ICON;
        } else if (areaId.includes('hero') || areaId.includes('hero_image')) {
            return this.ASSET_TYPES.HERO_IMAGE;
        } else if (areaId.includes('screenshots') || areaId.includes('screenshot')) {
            return this.ASSET_TYPES.SCREENSHOTS;
        } else if (areaId.includes('trailer')) {
            return this.ASSET_TYPES.TRAILER;
        }
        return null;
    }

    // Helper method to check if an upload area is for a primary asset
    static isPrimaryAsset(uploadArea) {
        return this.getProjectKeyForUploadArea(uploadArea) !== null;
    }

    // Helper method to get upload area ID for an asset type
    static getUploadAreaId(assetType) {
        switch (assetType) {
            case this.ASSET_TYPES.APP_ICON:
                return 'appicon-upload';
            case this.ASSET_TYPES.HERO_IMAGE:
                return 'hero-upload';
            case this.ASSET_TYPES.SCREENSHOTS:
                return 'screenshots-upload';
            case this.ASSET_TYPES.TRAILER:
                return 'trailer-upload';
            default:
                return null;
        }
    }
}

// Make it available globally
window.AssetConstants = AssetConstants;
