using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Supabase.Postgrest.Attributes;

namespace ShowroomBackend.Models
{
    [Table("projects")]
    public class Project
    {
        [PrimaryKey]
        public Guid Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Slug { get; set; } = string.Empty;
        
        // Company Information
        public string? CompanyName { get; set; }
        public string? CompanyLogoUrl { get; set; }
        public string? PrimaryContactName { get; set; }
        public string? PrimaryContactEmail { get; set; }
        public string? PrimaryContactPhone { get; set; }
        public string? CompanyWebsite { get; set; }
        public string? CompanySocials { get; set; } // JSON string for multiple social links
        
        // Game Information
        public string? ShortDescription { get; set; }
        public string? FullDescription { get; set; }
        public string? Genre { get; set; } // Action, RPG, Strategy, Simulation, Other
        public string? PublishingTrack { get; set; } // Platform Games, Self Hosted, Readyverse Hosted
        public string? PlatformType { get; set; } // PC Client, Web-Based
        public string? DistributionMethod { get; set; } // Epic Games Store, Steam, Self-Hosted, Readyverse Hosted
        public string? GameUrl { get; set; }
        public string? BuildStatus { get; set; } // In Development, Beta, Production-Ready
        public string? TargetPlatforms { get; set; } // JSON array of platforms: PC, Mac, Linux, Web
        
        // Technical Integration
        public string? PassSsoIntegrationStatus { get; set; } // Not Started, In Progress, Complete
        public string? ReadyverseSdkIntegrationStatus { get; set; } // Not Started, In Progress, Complete
        public string? LauncherUrl { get; set; }
        public string? IntegrationNotes { get; set; }
        public bool RequiresLauncher { get; set; } = false;
        public bool HttpsEnabled { get; set; } = false;
        public string? BuildFormat { get; set; } // Unreal Engine, Unity, Custom Engine, WebGL, Native
        
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
        public bool MeetsPerformanceGuidelines { get; set; } = false;
        public bool HasInstallInstructions { get; set; } = false;
        public bool HasPatchCommitment { get; set; } = false;
        
        // Compliance & Security
        public string? AgeRating { get; set; } // E, E10+, T, M, AO
        public string? RatingBoard { get; set; } // ESRB, PEGI, CERO, ACB, Other
        public bool LegalRequirementsCompleted { get; set; } = false;
        public bool PrivacyPolicyProvided { get; set; } = false;
        public bool TermsAccepted { get; set; } = false;
        public bool ContentGuidelinesAccepted { get; set; } = false;
        public bool DistributionRightsConfirmed { get; set; } = false;
        public string? SupportEmail { get; set; }
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
        public bool IsPublic { get; set; } = false;
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Onboarding progress
        public string? OnboardingStep { get; set; } // basics, assets, integration, compliance, review, done
        public DateTime? OnboardingCompletedAt { get; set; }
        public bool AssetsCompleted { get; set; } = false;
        public bool ReviewCompleted { get; set; } = false;
        public string? ReviewNotes { get; set; }
        
        [JsonIgnore]
        public List<Asset> Assets { get; set; } = new();
    }
}
