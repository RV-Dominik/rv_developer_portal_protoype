namespace ShowroomBackend.Models.DTOs
{
    public class ProjectOnboardingStepDto
    {
        public string Step { get; set; } = string.Empty; // basics, assets, integration, compliance, review

        // Basics
        public string? CompanyName { get; set; }
        public string? ShortDescription { get; set; }
        public bool? IsPublic { get; set; }
    }
}


