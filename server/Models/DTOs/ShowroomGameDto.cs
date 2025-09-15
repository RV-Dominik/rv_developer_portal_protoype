namespace ShowroomBackend.Models.DTOs
{
    /// <summary>
    /// Public game information for showroom display
    /// </summary>
    public class ShowroomGameDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        
        // Company Information
        public string CompanyName { get; set; } = string.Empty;
        public string? CompanyLogoUrl { get; set; }
        
        // Game Information
        public string? ShortDescription { get; set; }
        public string? FullDescription { get; set; }
        public string? Genre { get; set; }
        public string? PublishingTrack { get; set; }
        public string? BuildStatus { get; set; }
        public string[] TargetPlatforms { get; set; } = Array.Empty<string>();
        
        // Media Assets
        public string? GameLogoUrl { get; set; }
        public string? CoverArtUrl { get; set; }
        public string? TrailerUrl { get; set; }
        public string[] ScreenshotUrls { get; set; } = Array.Empty<string>();
        
        // Game URLs
        public string? GameUrl { get; set; }
        public string? LauncherUrl { get; set; }
        
        // Additional Information
        public string? AgeRating { get; set; }
        public string? RatingBoard { get; set; }
        public string? SupportEmail { get; set; }
        
        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? OnboardingCompletedAt { get; set; }
        
        // Showroom specific
        public string? ShowroomTier { get; set; }
        public string? ShowroomLightingColor { get; set; }
        public bool IsPublished { get; set; } = false;
        public DateTime? PublishedAt { get; set; }
        public bool IsFeatured { get; set; } = false;
        public int ViewCount { get; set; } = 0;
        public int LikeCount { get; set; } = 0;
    }
}
