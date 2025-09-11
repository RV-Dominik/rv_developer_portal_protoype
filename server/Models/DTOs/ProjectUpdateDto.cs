using System.ComponentModel.DataAnnotations;

namespace ShowroomBackend.Models.DTOs
{
    public class ProjectUpdateDto
    {
        [StringLength(100, MinimumLength = 1)]
        public string? Name { get; set; }
        
        [StringLength(100)]
        public string? Slug { get; set; }
        
        // Company Information
        [StringLength(200)]
        public string? CompanyName { get; set; }
        
        [StringLength(100)]
        public string? PrimaryContactName { get; set; }
        
        [EmailAddress]
        [StringLength(255)]
        public string? PrimaryContactEmail { get; set; }
        
        [StringLength(20)]
        public string? PrimaryContactPhone { get; set; }
        
        [Url]
        [StringLength(500)]
        public string? CompanyWebsite { get; set; }
        
        [StringLength(1000)]
        public string? CompanySocials { get; set; }
        
        // Game Information
        [StringLength(200)]
        public string? ShortDescription { get; set; }
        
        [StringLength(2000)]
        public string? FullDescription { get; set; }
        
        [StringLength(50)]
        public string? Genre { get; set; }
        
        [StringLength(50)]
        public string? PlatformType { get; set; }
        
        [StringLength(100)]
        public string? DistributionMethod { get; set; }
        
        [Url]
        [StringLength(500)]
        public string? GameUrl { get; set; }
        
        [StringLength(50)]
        public string? BuildStatus { get; set; }
        
        // Technical Integration
        [StringLength(50)]
        public string? PassSsoIntegrationStatus { get; set; }
        
        [StringLength(50)]
        public string? ReadyverseSdkIntegrationStatus { get; set; }
        
        public bool? RequiresLauncher { get; set; }
        
        // Compliance & Security
        [StringLength(20)]
        public string? AgeRating { get; set; }
        
        public bool? HasDistributionRights { get; set; }
        public bool? HasSslTls { get; set; }
        public bool? HasNoTestEndpoints { get; set; }
        public bool? HasDigicert { get; set; }
        
        // Assets - Storage keys (not public URLs)
        [StringLength(500)]
        public string? GameLogoKey { get; set; }
        
        [StringLength(500)]
        public string? CoverArtKey { get; set; }
        
        [StringLength(500)]
        public string? TrailerKey { get; set; }
        
        [StringLength(2000)] // JSON array can be longer
        public string? ScreenshotsKeys { get; set; }
        
        // Optional Add-Ons
        [StringLength(50)]
        public string? ShowroomInterest { get; set; }
        
        [StringLength(20)]
        public string? ShowroomTier { get; set; }
        
        [StringLength(7)] // Hex color code
        public string? ShowroomLightingColor { get; set; }
        
        public bool? WantsSurrealEstate { get; set; }
        
        public bool? IsPublic { get; set; }
    }
}
