using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ShowroomBackend.Services;
using ShowroomBackend.Models;
using System.ComponentModel.DataAnnotations;

namespace ShowroomBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UploadsController : ControllerBase
    {
        private readonly ISupabaseService _supabaseService;
        private readonly ILogger<UploadsController> _logger;

        public UploadsController(ISupabaseService supabaseService, ILogger<UploadsController> logger)
        {
            _supabaseService = supabaseService;
            _logger = logger;
        }

        [HttpPost("{projectId}")]
        public async Task<IActionResult> UploadAsset(Guid projectId, [FromForm] AssetUploadRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                // Verify project belongs to user
                var project = await _supabaseService.GetProjectByIdAsync(projectId);
                if (project == null)
                {
                    return NotFound(new { error = "Project not found" });
                }

                if (request.File == null || request.File.Length == 0)
                {
                    return BadRequest(new { error = "No file provided" });
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm" };
                if (!allowedTypes.Contains(request.File.ContentType))
                {
                    return BadRequest(new { error = "Invalid file type. Only images and videos are allowed." });
                }

                // Validate file size (10MB max)
                if (request.File.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { error = "File too large. Maximum size is 10MB." });
                }

                // Upload file to Supabase Storage
                using var stream = request.File.OpenReadStream();
                var fileKey = await _supabaseService.UploadFileAsync(stream, request.File.FileName, "showrooms");
                
                if (string.IsNullOrEmpty(fileKey))
                {
                    return StatusCode(500, new { error = "Failed to upload file" });
                }

                // Create asset record
                var asset = new Asset
                {
                    Id = Guid.NewGuid(),
                    ProjectId = projectId,
                    FileName = request.File.FileName,
                    FileKey = fileKey,
                    MimeType = request.File.ContentType,
                    FileSize = request.File.Length,
                    Kind = request.Kind ?? "screenshot",
                    DurationSeconds = request.DurationSeconds,
                    Width = request.Width,
                    Height = request.Height,
                    CreatedAt = DateTime.UtcNow
                };

                var createdAsset = await _supabaseService.CreateAssetAsync(asset);
                if (createdAsset == null)
                {
                    return StatusCode(500, new { error = "Failed to create asset record" });
                }

                return Ok(createdAsset);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading asset for project {ProjectId}", projectId);
                return StatusCode(500, new { error = "Failed to upload asset" });
            }
        }

        [HttpGet("{projectId}")]
        public async Task<IActionResult> GetProjectAssets(Guid projectId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                // Verify project belongs to user
                var project = await _supabaseService.GetProjectByIdAsync(projectId);
                if (project == null)
                {
                    return NotFound(new { error = "Project not found" });
                }

                var assets = await _supabaseService.GetProjectAssetsAsync(projectId);
                return Ok(assets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assets for project {ProjectId}", projectId);
                return StatusCode(500, new { error = "Failed to get assets" });
            }
        }

        [HttpDelete("{projectId}/{assetId}")]
        public async Task<IActionResult> DeleteAsset(Guid projectId, Guid assetId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                var success = await _supabaseService.DeleteAssetAsync(assetId);
                if (!success)
                {
                    return NotFound(new { error = "Asset not found" });
                }

                return Ok(new { message = "Asset deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting asset {AssetId} from project {ProjectId}", assetId, projectId);
                return StatusCode(500, new { error = "Failed to delete asset" });
            }
        }
    }

    public class AssetUploadRequest
    {
        [Required]
        public IFormFile File { get; set; } = null!;
        
        public string? Kind { get; set; }
        
        public int? DurationSeconds { get; set; }
        
        public int? Width { get; set; }
        
        public int? Height { get; set; }
    }
}
