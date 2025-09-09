using System.ComponentModel.DataAnnotations;

namespace ShowroomBackend.Models.DTOs
{
    public class ProjectCreateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Name { get; set; } = string.Empty;
        
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
        public string? PublishingTrack { get; set; }
        
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
        
        public bool RequiresLauncher { get; set; } = false;
        
        // Publishing Track Requirements
        // Platform Games Requirements
        public bool IsListedOnPlatform { get; set; } = false;
        public string? PlatformListingUrl { get; set; }
        
        // Self Hosted Requirements
        public bool HasStableUrl { get; set; } = false;
        public bool HasHttpsSupport { get; set; } = false;
        public bool HasUptimeMonitoring { get; set; } = false;
        public bool HasSupportCommitment { get; set; } = false;
        
        // Readyverse Hosted Requirements
        public bool HasDistributionRights { get; set; } = false;
        public string? BuildFormat { get; set; }
        public bool MeetsPerformanceGuidelines { get; set; } = false;
        public bool HasInstallInstructions { get; set; } = false;
        public bool HasPatchCommitment { get; set; } = false;
        
        // Compliance & Security
        [StringLength(20)]
        public string? AgeRating { get; set; }
        
        public bool HasSslTls { get; set; } = false;
        public bool HasNoTestEndpoints { get; set; } = false;
        public bool HasDigicert { get; set; } = false;
        
        // Assets
        [Url]
        [StringLength(500)]
        public string? TrailerUrl { get; set; }
        
        // Optional Add-Ons
        [StringLength(50)]
        public string? ShowroomInterest { get; set; }
        
        public bool WantsSurrealEstate { get; set; } = false;
        
        public bool IsPublic { get; set; } = false;
    }
}
