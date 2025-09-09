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
        private readonly MockSupabaseService _supabaseService;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(MockSupabaseService supabaseService, ILogger<ProjectsController> logger)
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
                    Description = dto.Description,
                    DeveloperName = dto.DeveloperName,
                    DeveloperEmail = dto.DeveloperEmail,
                    DeveloperWebsite = dto.DeveloperWebsite,
                    Version = dto.Version,
                    UnityVersion = dto.UnityVersion,
                    UnrealVersion = dto.UnrealVersion,
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

                var project = await _supabaseService.GetProjectByIdAsync(id, "mock-user-id");
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

                var project = await _supabaseService.GetProjectByIdAsync(id, "mock-user-id");
                if (project == null)
                {
                    return NotFound(new { error = "Project not found" });
                }

                // Update only provided fields
                if (dto.Name != null) project.Name = dto.Name;
                if (dto.Description != null) project.Description = dto.Description;
                if (dto.DeveloperName != null) project.DeveloperName = dto.DeveloperName;
                if (dto.DeveloperEmail != null) project.DeveloperEmail = dto.DeveloperEmail;
                if (dto.DeveloperWebsite != null) project.DeveloperWebsite = dto.DeveloperWebsite;
                if (dto.Version != null) project.Version = dto.Version;
                if (dto.UnityVersion != null) project.UnityVersion = dto.UnityVersion;
                if (dto.UnrealVersion != null) project.UnrealVersion = dto.UnrealVersion;
                if (dto.IsPublic.HasValue) project.IsPublic = dto.IsPublic.Value;

                // Regenerate slug if name changed
                if (dto.Name != null)
                {
                    project.Slug = GenerateSlug(dto.Name);
                }

                var updatedProject = await _supabaseService.UpdateProjectAsync(project);
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

                var success = await _supabaseService.DeleteProjectAsync(id, "mock-user-id");
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
