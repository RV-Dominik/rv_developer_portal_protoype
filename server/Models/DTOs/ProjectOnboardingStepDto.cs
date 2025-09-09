namespace ShowroomBackend.Models.DTOs
{
    public class ProjectOnboardingStepDto
    {
        public string Step { get; set; } = string.Empty; // basics, assets, integration, compliance, review

        // Basics
        public string? CompanyName { get; set; }
        public string? ShortDescription { get; set; }
        public string? FullDescription { get; set; }
        public string? Genre { get; set; }
        public string? PublishingTrack { get; set; }
        public string? BuildStatus { get; set; }
        public string? TargetPlatforms { get; set; } // JSON string
        public bool? IsPublic { get; set; }

        // Assets
        public bool? AssetsCompleted { get; set; }

        // Integration
        public string? PassSsoIntegrationStatus { get; set; }
        public string? ReadyverseSdkIntegrationStatus { get; set; }
        public string? GameUrl { get; set; }
        public string? LauncherUrl { get; set; }
        public string? IntegrationNotes { get; set; }

        // Compliance
        public string? RatingBoard { get; set; }
        public bool? LegalRequirementsCompleted { get; set; }
        public bool? PrivacyPolicyProvided { get; set; }
        public bool? TermsAccepted { get; set; }
        public bool? ContentGuidelinesAccepted { get; set; }
        public bool? DistributionRightsConfirmed { get; set; }
        public string? SupportEmail { get; set; }

        // Review
        public bool? ReviewCompleted { get; set; }
        public string? ReviewNotes { get; set; }

        // Completion
        public string? OnboardingCompletedAt { get; set; }
    }
}


