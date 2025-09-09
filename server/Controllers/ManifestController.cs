using Microsoft.AspNetCore.Mvc;
using ShowroomBackend.Services;
using ShowroomBackend.Models;
using ShowroomBackend.Models.DTOs;

namespace ShowroomBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManifestController : ControllerBase
    {
        private readonly MockSupabaseService _supabaseService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ManifestController> _logger;

        public ManifestController(
            MockSupabaseService supabaseService, 
            IConfiguration configuration, 
            ILogger<ManifestController> logger)
        {
            _supabaseService = supabaseService;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("{slug}")]
        public async Task<IActionResult> GetManifest(string slug)
        {
            try
            {
                var project = await _supabaseService.GetProjectBySlugAsync(slug);
                if (project == null)
                {
                    return NotFound(new { error = "Project not found" });
                }

                var assets = await _supabaseService.GetProjectAssetsAsync(project.Id);
                var assetUrls = new Dictionary<string, object>();
                var screenshots = new List<string>();

                var ttl = int.Parse(_configuration["ASSET_URL_TTL"] ?? "3600");

                foreach (var asset in assets)
                {
                    try
                    {
                        var signedUrl = await _supabaseService.GetSignedUrlAsync(asset.FileKey, ttl);
                        if (signedUrl != null)
                        {
                            if (asset.Kind == "screenshot")
                            {
                                screenshots.Add(signedUrl);
                            }
                            else if (asset.Kind == "trailer")
                            {
                                assetUrls["trailer"] = new
                                {
                                    type = asset.MimeType.StartsWith("video/") ? "file" : "url",
                                    src = signedUrl,
                                    duration = asset.DurationSeconds
                                };
                            }
                            else
                            {
                                assetUrls[asset.Kind] = signedUrl;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to generate signed URL for asset {AssetId}", asset.Id);
                        // Continue with other assets
                    }
                }

                var manifest = new ManifestDto
                {
                    Slug = project.Slug,
                    Name = project.Name,
                    Description = project.Description,
                    DeveloperName = project.DeveloperName,
                    DeveloperWebsite = project.DeveloperWebsite,
                    Version = project.Version,
                    UnityVersion = project.UnityVersion,
                    UnrealVersion = project.UnrealVersion,
                    Screenshots = screenshots,
                    Assets = assetUrls,
                    CreatedAt = project.CreatedAt,
                    UpdatedAt = project.UpdatedAt
                };

                return Ok(manifest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting manifest for slug {Slug}", slug);
                return StatusCode(500, new { error = "Failed to get manifest" });
            }
        }
    }
}
