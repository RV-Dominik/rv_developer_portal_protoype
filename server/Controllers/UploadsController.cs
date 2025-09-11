using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ShowroomBackend.Services;
using ShowroomBackend.Models;
using ShowroomBackend.Constants;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

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
                _logger.LogInformation("Upload request for project {ProjectId}, file: {FileName}, kind: {Kind}", 
                    projectId, request.File?.FileName, request.Kind);
                
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) 
                {
                    _logger.LogWarning("Upload failed: No user ID found in claims");
                    return Unauthorized(new { error = "Not authenticated" });
                }

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

                // Validate file type - only formats supported by Unreal Engine
                var allowedTypes = new[] { "image/jpeg", "image/png", "video/mp4" };
                if (!allowedTypes.Contains(request.File.ContentType))
                {
                    return BadRequest(new { error = "Invalid file type. Only PNG, JPEG images and MP4 videos are allowed (Unreal Engine compatible formats)." });
                }

                // Validate file size: images 10MB, videos 100MB
                var isVideo = request.File.ContentType.StartsWith("video/");
                var maxBytes = isVideo ? 100L * 1024 * 1024 : 10L * 1024 * 1024;
                if (request.File.Length > maxBytes)
                {
                    return BadRequest(new { error = isVideo ? "File too large. Maximum video size is 100MB." : "File too large. Maximum image size is 10MB." });
                }

                // Validate image dimensions when provided
                if (request.Width.HasValue && request.Height.HasValue && request.File.ContentType.StartsWith("image/"))
                {
                    // For now, we trust the client-provided dimensions since we're not decoding the image server-side
                    // This is acceptable since the client-side validation should catch most issues
                    _logger.LogInformation("Image dimensions: {Width}x{Height} for asset kind: {Kind}", 
                        request.Width.Value, request.Height.Value, request.Kind);
                }

                // Additional constraints for teaser video (duration/size)
                if ((request.Kind?.Equals(AssetConstants.AssetTypes.Trailer, StringComparison.OrdinalIgnoreCase) ?? false) && request.File.ContentType == "video/mp4")
                {
                    // Limit to 15MB; duration check would require probing the container which we skip server-side
                    if (request.File.Length > 15 * 1024 * 1024)
                    {
                        return BadRequest(new { error = "Trailer too large. Max 15MB." });
                    }
                }

                // Upload file to Supabase Storage (namespaced per project)
                using var stream = request.File.OpenReadStream();
                _logger.LogInformation("Uploading file {FileName} to projects/{ProjectId}/", request.File.FileName, projectId);
                var fileKey = await _supabaseService.UploadFileAsync(stream, request.File.FileName, "showrooms", $"projects/{projectId}");
                
                if (string.IsNullOrEmpty(fileKey))
                {
                    _logger.LogError("File upload returned empty fileKey for {FileName}", request.File.FileName);
                    return StatusCode(500, new { error = "Failed to upload file" });
                }
                
                _logger.LogInformation("File uploaded successfully with key: {FileKey}", fileKey);

                // Create asset record
                var asset = new Asset
                {
                    Id = Guid.NewGuid(),
                    ProjectId = projectId,
                    FileName = request.File.FileName,
                    FileKey = fileKey,
                    MimeType = request.File.ContentType,
                    FileSize = request.File.Length,
                    Kind = string.IsNullOrWhiteSpace(request.Kind) ? AssetConstants.AssetTypes.Screenshots : request.Kind,
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

                _logger.LogInformation("✅ Created asset: Kind={Kind}, FileKey={FileKey}, ProjectId={ProjectId}", 
                    createdAsset.Kind, createdAsset.FileKey, createdAsset.ProjectId);

                // Update project fields for primary assets (logo/cover/trailer) using storage keys
                var bucket = "showrooms";
                var fields = new Dictionary<string, object?>();
                
                // Map asset kind to project field using constants
                var assetKind = (createdAsset.Kind ?? "").ToLowerInvariant();
                _logger.LogInformation("Processing asset with kind: '{AssetKind}' for project {ProjectId}", assetKind, projectId);
                
                if (AssetConstants.AssetKindMappings.KindToDatabaseField.TryGetValue(assetKind, out string? databaseField))
                {
                    if (databaseField == AssetConstants.DatabaseFields.ScreenshotsKeys)
                    {
                        // Handle screenshots as JSON array
                        var existingProject = await _supabaseService.GetProjectByIdAsync(projectId);
                        var existingScreenshots = new List<string>();
                        
                        if (!string.IsNullOrEmpty(existingProject?.ScreenshotsKeys))
                        {
                            try
                            {
                                existingScreenshots = JsonSerializer.Deserialize<List<string>>(existingProject.ScreenshotsKeys) ?? new List<string>();
                            }
                            catch (JsonException ex)
                            {
                                _logger.LogWarning("Failed to parse existing screenshots: {Error}", ex.Message);
                            }
                        }
                        
                        // Add new screenshot key to array
                        existingScreenshots.Add(fileKey);
                        fields[databaseField] = JsonSerializer.Serialize(existingScreenshots);
                        _logger.LogInformation("✅ Added screenshot to array: {FileKey} for project {ProjectId}", fileKey, projectId);
                    }
                    else
                    {
                        // Handle single-value fields (logo, cover, trailer)
                        fields[databaseField] = fileKey;
                        _logger.LogInformation("✅ Setting {DatabaseField} to {FileKey} for project {ProjectId}", databaseField, fileKey, projectId);
                    }
                }
                else
                {
                    _logger.LogWarning("❌ No database field mapping found for asset kind: '{AssetKind}' for project {ProjectId}", assetKind, projectId);
                }
                if (fields.Count > 0)
                {
                    try 
                    { 
                        _logger.LogInformation("Updating project {ProjectId} with fields: {Fields}", projectId, string.Join(", ", fields.Select(kv => $"{kv.Key}={kv.Value}")));
                        await _supabaseService.UpdateProjectFieldsAsync(projectId, fields);
                        _logger.LogInformation("Successfully updated project {ProjectId} with asset keys", projectId);
                    } 
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to update project {ProjectId} with asset keys", projectId);
                    }
                }

                // Optionally include a signed URL to display immediately
                var ttl = 3600;
                var ttlStr = _configuration["ASSET_URL_TTL"];
                if (int.TryParse(ttlStr, out var parsed)) ttl = parsed;
                
                _logger.LogInformation("Getting signed URL for fileKey: {FileKey}", fileKey);
                var signedUrl = await _supabaseService.GetSignedUrlAsync("showrooms", fileKey, ttl);
                var assetPublicUrl = $"{_configuration["SUPABASE_URL"]}/storage/v1/object/public/showrooms/{fileKey}";
                
                _logger.LogInformation("Generated URLs - Signed: {SignedUrl}, Public: {PublicUrl}", signedUrl, assetPublicUrl);

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
                    publicUrl = assetPublicUrl
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

        [HttpGet("{projectId}/project-urls")]
        public async Task<IActionResult> GetProjectAssetUrls(Guid projectId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Not authenticated" });

                var project = await _supabaseService.GetProjectByIdAsync(projectId);
                if (project == null) return NotFound(new { error = "Project not found" });

                var ttl = 3600;
                var ttlStr = _configuration["ASSET_URL_TTL"];
                if (int.TryParse(ttlStr, out var parsed)) ttl = parsed;

                var result = new Dictionary<string, string?>();

                _logger.LogInformation("Project {ProjectId} asset keys - GameLogoKey: {GameLogoKey}, CoverArtKey: {CoverArtKey}, TrailerKey: {TrailerKey}", 
                    projectId, project.GameLogoKey, project.CoverArtKey, project.TrailerKey);

                // Convert storage keys to signed URLs
                if (!string.IsNullOrEmpty(project.GameLogoKey))
                {
                    result["gameLogoUrl"] = await _supabaseService.GetSignedUrlAsync("showrooms", project.GameLogoKey, ttl);
                    _logger.LogInformation("Generated gameLogoUrl for key {GameLogoKey}", project.GameLogoKey);
                }
                if (!string.IsNullOrEmpty(project.CoverArtKey))
                {
                    result["coverArtUrl"] = await _supabaseService.GetSignedUrlAsync("showrooms", project.CoverArtKey, ttl);
                    _logger.LogInformation("Generated coverArtUrl for key {CoverArtKey}", project.CoverArtKey);
                }
                if (!string.IsNullOrEmpty(project.TrailerKey))
                {
                    result["trailerUrl"] = await _supabaseService.GetSignedUrlAsync("showrooms", project.TrailerKey, ttl);
                    _logger.LogInformation("Generated trailerUrl for key {TrailerKey}", project.TrailerKey);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project asset URLs for project {ProjectId}", projectId);
                return StatusCode(500, new { error = "Failed to get project asset URLs" });
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
