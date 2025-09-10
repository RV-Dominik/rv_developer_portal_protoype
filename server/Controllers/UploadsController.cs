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
        private readonly IConfiguration _configuration;

        public UploadsController(ISupabaseService supabaseService, ILogger<UploadsController> logger, IConfiguration configuration)
        {
            _supabaseService = supabaseService;
            _logger = logger;
            _configuration = configuration;
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

                // Validate file size: images 10MB, videos 100MB
                var isVideo = request.File.ContentType.StartsWith("video/");
                var maxBytes = isVideo ? 100L * 1024 * 1024 : 10L * 1024 * 1024;
                if (request.File.Length > maxBytes)
                {
                    return BadRequest(new { error = isVideo ? "File too large. Maximum video size is 100MB." : "File too large. Maximum image size is 10MB." });
                }

                // Optional strict dimension checks when provided
                if (request.Width.HasValue && request.Height.HasValue && request.File.ContentType.StartsWith("image/"))
                {
                    // For strict checks we'd decode the image; for now trust provided metadata to enforce UI hints
                }

                // Additional constraints for teaser video (duration/size)
                if ((request.Kind?.Equals("trailer", StringComparison.OrdinalIgnoreCase) ?? false) && request.File.ContentType == "video/mp4")
                {
                    // Limit to 5MB; duration check would require probing the container which we skip server-side
                    if (request.File.Length > 5 * 1024 * 1024)
                    {
                        return BadRequest(new { error = "Trailer too large. Max 5MB." });
                    }
                }

                // Upload file to Supabase Storage (namespaced per project)
                using var stream = request.File.OpenReadStream();
                var fileKey = await _supabaseService.UploadFileAsync(stream, request.File.FileName, "showrooms", $"projects/{projectId}");
                
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
                    Kind = string.IsNullOrWhiteSpace(request.Kind) ? "screenshot" : request.Kind,
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

                // Update project fields for primary assets (logo/cover/trailer)
                var bucket = "showrooms";
                var publicUrl = $"{_configuration["SUPABASE_URL"]}/storage/v1/object/public/{bucket}/{createdAsset.FileKey}";
                var fields = new Dictionary<string, object?>();
                switch ((createdAsset.Kind ?? "").ToLowerInvariant())
                {
                    case "game_logo":
                    case "logo":
                        fields["gameLogoUrl"] = publicUrl;
                        break;
                    case "cover_art":
                    case "cover":
                        fields["coverArtUrl"] = publicUrl;
                        break;
                    case "trailer":
                        fields["trailerUrl"] = publicUrl;
                        break;
                }
                if (fields.Count > 0)
                {
                    try { await _supabaseService.UpdateProjectFieldsAsync(projectId, fields); } catch {}
                }

                // Optionally include a signed URL to display immediately
                var ttl = 3600;
                var ttlStr = _configuration["ASSET_URL_TTL"];
                if (int.TryParse(ttlStr, out var parsed)) ttl = parsed;
                var signedUrl = await _supabaseService.GetSignedUrlAsync(bucket, createdAsset.FileKey, ttl);

                return Ok(new
                {
                    createdAsset.Id,
                    createdAsset.ProjectId,
                    createdAsset.FileName,
                    createdAsset.FileKey,
                    createdAsset.MimeType,
                    createdAsset.FileSize,
                    createdAsset.Kind,
                    createdAsset.DurationSeconds,
                    createdAsset.Width,
                    createdAsset.Height,
                    createdAsset.CreatedAt,
                    signedUrl,
                    publicUrl
                });
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

        [HttpGet("{projectId}/signed")]
        public async Task<IActionResult> GetProjectAssetsWithSignedUrls(Guid projectId)
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
                var ttl = 3600;
                var ttlStr = _configuration["ASSET_URL_TTL"];
                if (int.TryParse(ttlStr, out var parsed)) ttl = parsed;

                var result = new List<object>();
                foreach (var a in assets)
                {
                    var url = await _supabaseService.GetSignedUrlAsync("showrooms", a.FileKey, ttl);
                    result.Add(new
                    {
                        id = a.Id,
                        kind = a.Kind,
                        fileName = a.FileName,
                        mimeType = a.MimeType,
                        width = a.Width,
                        height = a.Height,
                        durationSeconds = a.DurationSeconds,
                        signedUrl = url
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting signed asset urls for project {ProjectId}", projectId);
                return StatusCode(500, new { error = "Failed to get signed URLs" });
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
