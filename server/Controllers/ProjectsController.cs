using Microsoft.AspNetCore.Mvc;
using ShowroomBackend.Services;
using ShowroomBackend.Models;
using ShowroomBackend.Models.DTOs;
using System.ComponentModel.DataAnnotations;

namespace ShowroomBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
        /// Create a new project
        /// </summary>
        /// <param name="dto">Project creation data</param>
        /// <returns>Created project or error</returns>
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectCreateDto dto)
        {
            try
            {
                var session = await _supabaseService.GetSessionAsync();
                if (session == null)
                {
                    return Unauthorized(new { error = "Not authenticated" });
                }

                var project = new Project
                {
                    Id = Guid.NewGuid(),
                    Name = dto.Name,
                    Slug = GenerateSlug(dto.Name),
                    CompanyName = dto.CompanyName,
                    PrimaryContactName = dto.PrimaryContactName,
                    PrimaryContactEmail = dto.PrimaryContactEmail,
                    PrimaryContactPhone = dto.PrimaryContactPhone,
                    CompanyWebsite = dto.CompanyWebsite,
                    CompanySocials = dto.CompanySocials,
                    ShortDescription = dto.ShortDescription,
                    FullDescription = dto.FullDescription,
                    Genre = dto.Genre,
                    PlatformType = dto.PlatformType,
                    DistributionMethod = dto.DistributionMethod,
                    GameUrl = dto.GameUrl,
                    BuildStatus = dto.BuildStatus,
                    PassSsoIntegrationStatus = dto.PassSsoIntegrationStatus,
                    ReadyverseSdkIntegrationStatus = dto.ReadyverseSdkIntegrationStatus,
                    RequiresLauncher = dto.RequiresLauncher,
                    AgeRating = dto.AgeRating,
                    HasDistributionRights = dto.HasDistributionRights,
                    HasSslTls = dto.HasSslTls,
                    HasNoTestEndpoints = dto.HasNoTestEndpoints,
                    HasDigicert = dto.HasDigicert,
                    TrailerUrl = dto.TrailerUrl,
                    ShowroomInterest = dto.ShowroomInterest,
                    WantsSurrealEstate = dto.WantsSurrealEstate,
                    IsPublic = dto.IsPublic,
                    UserId = "mock-user-id",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createdProject = await _supabaseService.CreateProjectAsync(project);
                if (createdProject == null)
                {
                    return StatusCode(500, new { error = "Failed to create project" });
                }

                return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project");
                return StatusCode(500, new { error = "Failed to create project" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            try
            {
                var session = await _supabaseService.GetSessionAsync();
                if (session == null)
                {
                    return Unauthorized(new { error = "Not authenticated" });
                }

                var projects = await _supabaseService.GetUserProjectsAsync("mock-user-id");
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
                var session = await _supabaseService.GetSessionAsync();
                if (session == null)
                {
                    return Unauthorized(new { error = "Not authenticated" });
                }

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
                var session = await _supabaseService.GetSessionAsync();
                if (session == null)
                {
                    return Unauthorized(new { error = "Not authenticated" });
                }

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
    }
}
