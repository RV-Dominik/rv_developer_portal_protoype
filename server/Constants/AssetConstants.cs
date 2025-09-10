namespace ShowroomBackend.Constants
{
    /// <summary>
    /// Asset-related constants to avoid hardcoded strings
    /// </summary>
    public static class AssetConstants
    {
        // Asset types - these match the frontend constants
        public static class AssetTypes
        {
            public const string AppIcon = "app_icon";
            public const string HeroImage = "hero_image";
            public const string Screenshots = "screenshot";
            public const string Trailer = "trailer";
        }

        // Database field names (snake_case for Supabase)
        public static class DatabaseFields
        {
            public const string GameLogoKey = "game_logo_key";
            public const string CoverArtKey = "cover_art_key";
            public const string TrailerKey = "trailer_key";
        }

        // Project model property names (camelCase for C#)
        public static class ProjectProperties
        {
            public const string GameLogoKey = "GameLogoKey";
            public const string CoverArtKey = "CoverArtKey";
            public const string TrailerKey = "TrailerKey";
        }

        // Asset kind mappings for upload processing
        public static class AssetKindMappings
        {
            public static readonly Dictionary<string, string> KindToDatabaseField = new()
            {
                { "app_icon", DatabaseFields.GameLogoKey },
                { "logo", DatabaseFields.GameLogoKey },
                { "hero_image", DatabaseFields.CoverArtKey },
                { "cover_art", DatabaseFields.CoverArtKey },
                { "cover", DatabaseFields.CoverArtKey },
                { "trailer", DatabaseFields.TrailerKey }
            };
        }
    }
}
