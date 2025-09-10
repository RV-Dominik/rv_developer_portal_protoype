using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ShowroomBackend.Services;
using ShowroomBackend.Models;
using ShowroomBackend.Models.DTOs;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Routing;

namespace ShowroomBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly ISupabaseService _supabaseService;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(ISupabaseService supabaseService, ILogger<ProjectsController> logger)
        {
            _supabaseService = supabaseService;
            _logger = logger;
        }

        /// <summary>
        /// Save onboarding step data and update project progress
        /// </summary>
        [HttpPost("{id}/onboarding/step")]
        public async Task<IActionResult> SaveOnboardingStep(Guid id, [FromBody] ProjectOnboardingStepDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("SaveOnboardingStep called for project {ProjectId}, UserId: {UserId}, IsAuthenticated: {IsAuthenticated}", 
                    id, userId, User.Identity?.IsAuthenticated);
                
                if (string.IsNullOrEmpty(userId)) 
                {
                    _logger.LogWarning("No userId found in token for project {ProjectId}", id);
                    return Unauthorized(new { error = "Not authenticated" });
                }

                var project = await _supabaseService.GetProjectByIdAsync(id);
                if (project == null) return NotFound(new { error = "Project not found" });
                if (project.UserId != userId) return Forbid();

                // Validate the DTO
                var validationResult = ValidateOnboardingStep(dto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { error = "Validation failed", details = validationResult.Errors });
                }

                // Debug logging
                _logger.LogInformation("Saving onboarding step {Step} for project {ProjectId}. DTO: {Dto}", 
                    dto.Step, id, System.Text.Json.JsonSerializer.Serialize(dto));
                
                _logger.LogInformation("Project before update: {Project}", 
                    System.Text.Json.JsonSerializer.Serialize(project));

                // Apply partial updates depending on step
                if (!string.IsNullOrEmpty(dto.CompanyName)) project.CompanyName = dto.CompanyName;
                if (!string.IsNullOrEmpty(dto.ShortDescription)) project.ShortDescription = dto.ShortDescription;
                if (!string.IsNullOrEmpty(dto.FullDescription)) project.FullDescription = dto.FullDescription;
                if (!string.IsNullOrEmpty(dto.Genre)) project.Genre = dto.Genre;
                if (!string.IsNullOrEmpty(dto.PublishingTrack)) project.PublishingTrack = dto.PublishingTrack;
                if (!string.IsNullOrEmpty(dto.BuildStatus)) project.BuildStatus = dto.BuildStatus;
                if (!string.IsNullOrEmpty(dto.TargetPlatforms)) project.TargetPlatforms = dto.TargetPlatforms;
                if (dto.IsPublic.HasValue) project.IsPublic = dto.IsPublic.Value;

                // Integration fields
                if (!string.IsNullOrEmpty(dto.PassSsoIntegrationStatus)) project.PassSsoIntegrationStatus = dto.PassSsoIntegrationStatus;
                if (!string.IsNullOrEmpty(dto.ReadyverseSdkIntegrationStatus)) project.ReadyverseSdkIntegrationStatus = dto.ReadyverseSdkIntegrationStatus;
                if (!string.IsNullOrEmpty(dto.GameUrl)) project.GameUrl = dto.GameUrl;
                if (!string.IsNullOrEmpty(dto.LauncherUrl)) project.LauncherUrl = dto.LauncherUrl;
                if (!string.IsNullOrEmpty(dto.IntegrationNotes)) project.IntegrationNotes = dto.IntegrationNotes;

                // Compliance fields
                if (!string.IsNullOrEmpty(dto.RatingBoard)) project.RatingBoard = dto.RatingBoard;
                if (dto.LegalRequirementsCompleted.HasValue) project.LegalRequirementsCompleted = dto.LegalRequirementsCompleted.Value;
                if (dto.PrivacyPolicyProvided.HasValue) project.PrivacyPolicyProvided = dto.PrivacyPolicyProvided.Value;
                if (dto.TermsAccepted.HasValue) project.TermsAccepted = dto.TermsAccepted.Value;
                if (dto.ContentGuidelinesAccepted.HasValue) project.ContentGuidelinesAccepted = dto.ContentGuidelinesAccepted.Value;
                if (dto.DistributionRightsConfirmed.HasValue) project.DistributionRightsConfirmed = dto.DistributionRightsConfirmed.Value;
                if (!string.IsNullOrEmpty(dto.SupportEmail)) project.SupportEmail = dto.SupportEmail;

                // Review fields
                if (dto.ReviewCompleted.HasValue) project.ReviewCompleted = dto.ReviewCompleted.Value;
                if (!string.IsNullOrEmpty(dto.ReviewNotes)) project.ReviewNotes = dto.ReviewNotes;

                // Assets completion
                if (dto.AssetsCompleted.HasValue) project.AssetsCompleted = dto.AssetsCompleted.Value;

                // Advance step
                project.OnboardingStep = dto.Step;
                if (dto.Step == "done" || dto.Step == "completed") 
                {
                    project.OnboardingCompletedAt = DateTime.UtcNow;
                }

                _logger.LogInformation("Project after updates: {Project}", 
                    System.Text.Json.JsonSerializer.Serialize(project));

                var updated = await _supabaseService.UpdateProjectAsync(id, project);
                if (updated == null) return StatusCode(500, new { error = "Failed to save step" });

                // Debug logging
                _logger.LogInformation("Project updated successfully. Updated project: {Project}", 
                    System.Text.Json.JsonSerializer.Serialize(updated));

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving onboarding step for project {Id}", id);
                return StatusCode(500, new { error = "Failed to save onboarding step" });
            }
        }

        /// <summary>
        /// Create a new project
        /// </summary>
        /// <param name="dto">Project creation data</param>
        /// <returns>Created project or error</returns>
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectCreateDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                // Get user's organization to populate company name
                var organization = await _supabaseService.GetUserOrganizationAsync(userId);
                if (organization == null)
                {
                    return BadRequest(new { error = "No organization found. Please set up your organization first." });
                }

                var project = new Project
                {
                    Id = Guid.NewGuid(),
                    Name = dto.Name,
                    Slug = GenerateSlug(dto.Name),
                    OnboardingStep = "basics",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    // Set company name from organization
                    CompanyName = organization.Name
                };

                // Only set properties that are provided in the DTO
                if (!string.IsNullOrEmpty(dto.CompanyName)) project.CompanyName = dto.CompanyName;
                if (!string.IsNullOrEmpty(dto.PrimaryContactName)) project.PrimaryContactName = dto.PrimaryContactName;
                if (!string.IsNullOrEmpty(dto.PrimaryContactEmail)) project.PrimaryContactEmail = dto.PrimaryContactEmail;
                if (!string.IsNullOrEmpty(dto.PrimaryContactPhone)) project.PrimaryContactPhone = dto.PrimaryContactPhone;
                if (!string.IsNullOrEmpty(dto.CompanyWebsite)) project.CompanyWebsite = dto.CompanyWebsite;
                if (!string.IsNullOrEmpty(dto.CompanySocials)) project.CompanySocials = dto.CompanySocials;
                if (!string.IsNullOrEmpty(dto.ShortDescription)) project.ShortDescription = dto.ShortDescription;
                if (!string.IsNullOrEmpty(dto.FullDescription)) project.FullDescription = dto.FullDescription;
                if (!string.IsNullOrEmpty(dto.Genre)) project.Genre = dto.Genre;
                if (!string.IsNullOrEmpty(dto.PublishingTrack)) project.PublishingTrack = dto.PublishingTrack;
                if (!string.IsNullOrEmpty(dto.PlatformType)) project.PlatformType = dto.PlatformType;
                if (!string.IsNullOrEmpty(dto.DistributionMethod)) project.DistributionMethod = dto.DistributionMethod;
                if (!string.IsNullOrEmpty(dto.GameUrl)) project.GameUrl = dto.GameUrl;
                if (!string.IsNullOrEmpty(dto.BuildStatus)) project.BuildStatus = dto.BuildStatus;
                if (!string.IsNullOrEmpty(dto.PassSsoIntegrationStatus)) project.PassSsoIntegrationStatus = dto.PassSsoIntegrationStatus;
                if (!string.IsNullOrEmpty(dto.ReadyverseSdkIntegrationStatus)) project.ReadyverseSdkIntegrationStatus = dto.ReadyverseSdkIntegrationStatus;
                if (dto.RequiresLauncher) project.RequiresLauncher = dto.RequiresLauncher;
                if (!string.IsNullOrEmpty(dto.AgeRating)) project.AgeRating = dto.AgeRating;
                if (dto.HasDistributionRights) project.HasDistributionRights = dto.HasDistributionRights;
                if (dto.HasSslTls) project.HasSslTls = dto.HasSslTls;
                if (dto.HasNoTestEndpoints) project.HasNoTestEndpoints = dto.HasNoTestEndpoints;
                if (dto.HasDigicert) project.HasDigicert = dto.HasDigicert;
                if (!string.IsNullOrEmpty(dto.TrailerUrl)) project.TrailerUrl = dto.TrailerUrl;
                if (!string.IsNullOrEmpty(dto.ShowroomInterest)) project.ShowroomInterest = dto.ShowroomInterest;
                if (dto.WantsSurrealEstate) project.WantsSurrealEstate = dto.WantsSurrealEstate;
                if (dto.IsPublic) project.IsPublic = dto.IsPublic;

                var createdProject = await _supabaseService.CreateProjectAsync(project);
                if (createdProject == null)
                {
                    return StatusCode(500, new { error = "Failed to create project" });
                }

                return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project: {Message}", ex.Message);
                return StatusCode(500, new { error = "Failed to create project", details = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                var projects = await _supabaseService.GetUserProjectsAsync(userId);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                return StatusCode(500, new { error = "Failed to get projects" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(Guid id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                var project = await _supabaseService.GetProjectByIdAsync(id);
                if (project == null)
                {
                    return NotFound(new { error = "Project not found" });
                }

                return Ok(project);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project {Id}", id);
                return StatusCode(500, new { error = "Failed to get project" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(Guid id, [FromBody] ProjectUpdateDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                var project = await _supabaseService.GetProjectByIdAsync(id);
                if (project == null)
                {
                    return NotFound(new { error = "Project not found" });
                }

                // Update only provided fields
                if (dto.Name != null) project.Name = dto.Name;
                if (dto.Slug != null) project.Slug = dto.Slug;
                if (dto.CompanyName != null) project.CompanyName = dto.CompanyName;
                if (dto.PrimaryContactName != null) project.PrimaryContactName = dto.PrimaryContactName;
                if (dto.PrimaryContactEmail != null) project.PrimaryContactEmail = dto.PrimaryContactEmail;
                if (dto.PrimaryContactPhone != null) project.PrimaryContactPhone = dto.PrimaryContactPhone;
                if (dto.CompanyWebsite != null) project.CompanyWebsite = dto.CompanyWebsite;
                if (dto.CompanySocials != null) project.CompanySocials = dto.CompanySocials;
                if (dto.ShortDescription != null) project.ShortDescription = dto.ShortDescription;
                if (dto.FullDescription != null) project.FullDescription = dto.FullDescription;
                if (dto.Genre != null) project.Genre = dto.Genre;
                if (dto.PlatformType != null) project.PlatformType = dto.PlatformType;
                if (dto.DistributionMethod != null) project.DistributionMethod = dto.DistributionMethod;
                if (dto.GameUrl != null) project.GameUrl = dto.GameUrl;
                if (dto.BuildStatus != null) project.BuildStatus = dto.BuildStatus;
                if (dto.PassSsoIntegrationStatus != null) project.PassSsoIntegrationStatus = dto.PassSsoIntegrationStatus;
                if (dto.ReadyverseSdkIntegrationStatus != null) project.ReadyverseSdkIntegrationStatus = dto.ReadyverseSdkIntegrationStatus;
                if (dto.RequiresLauncher.HasValue) project.RequiresLauncher = dto.RequiresLauncher.Value;
                if (dto.AgeRating != null) project.AgeRating = dto.AgeRating;
                if (dto.HasDistributionRights.HasValue) project.HasDistributionRights = dto.HasDistributionRights.Value;
                if (dto.HasSslTls.HasValue) project.HasSslTls = dto.HasSslTls.Value;
                if (dto.HasNoTestEndpoints.HasValue) project.HasNoTestEndpoints = dto.HasNoTestEndpoints.Value;
                if (dto.HasDigicert.HasValue) project.HasDigicert = dto.HasDigicert.Value;
                if (dto.TrailerUrl != null) project.TrailerUrl = dto.TrailerUrl;
                if (dto.ShowroomInterest != null) project.ShowroomInterest = dto.ShowroomInterest;
                if (dto.WantsSurrealEstate.HasValue) project.WantsSurrealEstate = dto.WantsSurrealEstate.Value;
                if (dto.IsPublic.HasValue) project.IsPublic = dto.IsPublic.Value;

                // Regenerate slug if name changed
                if (dto.Name != null)
                {
                    project.Slug = GenerateSlug(dto.Name);
                }

                var updatedProject = await _supabaseService.UpdateProjectAsync(id, project);
                if (updatedProject == null)
                {
                    return StatusCode(500, new { error = "Failed to update project" });
                }

                return Ok(updatedProject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project {Id}", id);
                return StatusCode(500, new { error = "Failed to update project" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(Guid id)
        {
            try
            {
                var session = await _supabaseService.GetSessionAsync();
                if (session == null)
                {
                    return Unauthorized(new { error = "Not authenticated" });
                }

                var success = await _supabaseService.DeleteProjectAsync(id);
                if (!success)
                {
                    return NotFound(new { error = "Project not found" });
                }

                return Ok(new { message = "Project deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project {Id}", id);
                return StatusCode(500, new { error = "Failed to delete project" });
            }
        }

        private string GenerateSlug(string name)
        {
            return name.ToLowerInvariant()
                .Replace(" ", "-")
                .Replace("_", "-")
                .Replace(".", "-")
                .Replace("--", "-")
                .Trim('-') + "-" + Guid.NewGuid().ToString("N")[..8];
        }

        private ValidationResult ValidateOnboardingStep(ProjectOnboardingStepDto dto)
        {
            var errors = new List<string>();

            // Step-specific validation
            switch (dto.Step)
            {
                case "basics":
                    if (string.IsNullOrWhiteSpace(dto.ShortDescription))
                        errors.Add("Short description is required");
                    else if (dto.ShortDescription.Length < 10)
                        errors.Add("Short description must be at least 10 characters");
                    else if (dto.ShortDescription.Length > 500)
                        errors.Add("Short description must be less than 500 characters");

                    if (dto.FullDescription != null && dto.FullDescription.Length > 2000)
                        errors.Add("Full description must be less than 2000 characters");

                    if (string.IsNullOrWhiteSpace(dto.Genre))
                        errors.Add("Genre is required");

                    if (string.IsNullOrWhiteSpace(dto.PublishingTrack))
                        errors.Add("Publishing track is required");

                    if (string.IsNullOrWhiteSpace(dto.BuildStatus))
                        errors.Add("Build status is required");
                    break;

                case "integration":
                    if (string.IsNullOrWhiteSpace(dto.PassSsoIntegrationStatus))
                        errors.Add("Pass SSO integration status is required");

                    if (string.IsNullOrWhiteSpace(dto.ReadyverseSdkIntegrationStatus))
                        errors.Add("Readyverse SDK integration status is required");

                    if (!string.IsNullOrWhiteSpace(dto.GameUrl) && !IsValidUrl(dto.GameUrl))
                        errors.Add("Game URL must be a valid URL");
                    break;

                case "compliance":
                    if (!dto.LegalRequirementsCompleted.HasValue || !dto.LegalRequirementsCompleted.Value)
                        errors.Add("Legal requirements must be completed");

                    if (!dto.PrivacyPolicyProvided.HasValue || !dto.PrivacyPolicyProvided.Value)
                        errors.Add("Privacy policy must be provided");

                    if (!dto.TermsAccepted.HasValue || !dto.TermsAccepted.Value)
                        errors.Add("Terms must be accepted");

                    if (!dto.ContentGuidelinesAccepted.HasValue || !dto.ContentGuidelinesAccepted.Value)
                        errors.Add("Content guidelines must be accepted");

                    if (!string.IsNullOrWhiteSpace(dto.SupportEmail) && !IsValidEmail(dto.SupportEmail))
                        errors.Add("Support email must be a valid email address");
                    break;
            }

            return new ValidationResult { IsValid = errors.Count == 0, Errors = errors };
        }

        private bool IsValidUrl(string url)
        {
            return Uri.TryCreate(url, UriKind.Absolute, out var result) && 
                   (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
