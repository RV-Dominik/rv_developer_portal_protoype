using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Supabase.Postgrest.Models;
using Supabase.Postgrest.Attributes;

namespace ShowroomBackend.Models
{
    [Table("projects")]
    public class Project : BaseModel
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        
        [Required]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("slug")]
        public string Slug { get; set; } = string.Empty;
        
        // Company Information
        [JsonPropertyName("company_name")]
        public string? CompanyName { get; set; }
        [JsonPropertyName("company_logo_url")]
        public string? CompanyLogoUrl { get; set; }
        [JsonPropertyName("primary_contact_name")]
        public string? PrimaryContactName { get; set; }
        [JsonPropertyName("primary_contact_email")]
        public string? PrimaryContactEmail { get; set; }
        [JsonPropertyName("primary_contact_phone")]
        public string? PrimaryContactPhone { get; set; }
        [JsonPropertyName("company_website")]
        public string? CompanyWebsite { get; set; }
        [JsonPropertyName("company_socials")]
        public string? CompanySocials { get; set; } // JSON string for multiple social links
        
        // Game Information
        [JsonPropertyName("short_description")]
        public string? ShortDescription { get; set; }
        [JsonPropertyName("full_description")]
        public string? FullDescription { get; set; }
        [JsonPropertyName("genre")]
        public string? Genre { get; set; } // Action, RPG, Strategy, Simulation, Other
        [JsonPropertyName("publishing_track")]
        public string? PublishingTrack { get; set; } // Platform Games, Self Hosted, Readyverse Hosted
        [JsonPropertyName("platform_type")]
        public string? PlatformType { get; set; } // PC Client, Web-Based
        [JsonPropertyName("distribution_method")]
        public string? DistributionMethod { get; set; } // Epic Games Store, Steam, Self-Hosted, Readyverse Hosted
        [JsonPropertyName("game_url")]
        public string? GameUrl { get; set; }
        [JsonPropertyName("build_status")]
        public string? BuildStatus { get; set; } // In Development, Beta, Production-Ready
        
        // Technical Integration
        public string? PassSsoIntegrationStatus { get; set; } // Not Started, In Progress, Complete
        public string? ReadyverseSdkIntegrationStatus { get; set; } // Not Started, In Progress, Complete
        public bool RequiresLauncher { get; set; } = false;
        
        // Publishing Track Requirements
        // Platform Games Requirements
        public bool IsListedOnPlatform { get; set; } = false; // Epic Games Store, Steam, etc.
        public string? PlatformListingUrl { get; set; }
        
        // Self Hosted Requirements
        public bool HasStableUrl { get; set; } = false;
        public bool HasHttpsSupport { get; set; } = false;
        public bool HasUptimeMonitoring { get; set; } = false;
        public bool HasSupportCommitment { get; set; } = false;
        
        // Readyverse Hosted Requirements
        public bool HasDistributionRights { get; set; } = false;
        public string? BuildFormat { get; set; } // Unreal/Unity build, .exe installer, WebGL bundle
        public bool MeetsPerformanceGuidelines { get; set; } = false;
        public bool HasInstallInstructions { get; set; } = false;
        public bool HasPatchCommitment { get; set; } = false;
        
        // Compliance & Security
        public string? AgeRating { get; set; } // ESRB, PEGI, etc.
        public bool HasSslTls { get; set; } = false;
        public bool HasNoTestEndpoints { get; set; } = false;
        public bool HasDigicert { get; set; } = false;
        
        // Assets
        public string? GameLogoUrl { get; set; }
        public string? CoverArtUrl { get; set; }
        public string? TrailerUrl { get; set; }
        
        // Optional Add-Ons
        public string? ShowroomInterest { get; set; } // Yes with assistance, Yes in-house, No
        public bool WantsSurrealEstate { get; set; } = false;
        
        // Submission Process Tracking
        public string? SubmissionStatus { get; set; } // Intake, Technical Integration, Compliance Review, Game Submission, Approved, Rejected
        public DateTime? IntakeSubmittedAt { get; set; }
        public DateTime? TechnicalIntegrationSubmittedAt { get; set; }
        public DateTime? ComplianceReviewSubmittedAt { get; set; }
        public DateTime? GameSubmissionSubmittedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? RejectionReason { get; set; }
        public string? ReadyverseTechTeamNotes { get; set; }
        public string? ReadyverseOpsNotes { get; set; }
        
        // System fields
        [JsonPropertyName("is_public")]
        public bool IsPublic { get; set; } = false;
        [JsonPropertyName("user_id")]
        public string UserId { get; set; } = string.Empty;
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Onboarding progress
        [JsonPropertyName("onboarding_step")]
        public string? OnboardingStep { get; set; } // basics, assets, integration, compliance, review, done
        [JsonPropertyName("onboarding_completed_at")]
        public DateTime? OnboardingCompletedAt { get; set; }
        
        public List<Asset> Assets { get; set; } = new();
    }
}
