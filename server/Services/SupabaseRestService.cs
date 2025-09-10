using System.Text;
using System.Text.Json;
using ShowroomBackend.Models;
using ShowroomBackend.Models.DTOs;
using ShowroomBackend.Constants;

namespace ShowroomBackend.Services
{
    public class SupabaseRestService : ISupabaseService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SupabaseRestService> _logger;
        private readonly string _supabaseUrl;
        private readonly string _supabaseAnonKey;
        private readonly string _supabaseServiceKey;

        public SupabaseRestService(HttpClient httpClient, IConfiguration configuration, ILogger<SupabaseRestService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            
            _supabaseUrl = _configuration["SUPABASE_URL"] ?? throw new InvalidOperationException("SUPABASE_URL not configured");
            _supabaseAnonKey = _configuration["SUPABASE_ANON_KEY"] ?? throw new InvalidOperationException("SUPABASE_ANON_KEY not configured");
            _supabaseServiceKey = _configuration["SUPABASE_SERVICE_ROLE_KEY"] ?? throw new InvalidOperationException("SUPABASE_SERVICE_ROLE_KEY not configured");
            
            // Configure HttpClient for Supabase
            _httpClient.BaseAddress = new Uri($"{_supabaseUrl}/rest/v1/");
            _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);
            // Use service role key for database operations (server-side only)
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_supabaseServiceKey}");
        }

        private static readonly HashSet<string> AllowedProjectColumns = new HashSet<string>(StringComparer.Ordinal)
        {
            // Core descriptive fields
            "name","slug","company_name","company_logo_url","primary_contact_name","primary_contact_email","primary_contact_phone",
            "company_website","company_socials","short_description","full_description","genre","publishing_track",
            // Distribution/tech
            "platform_type","distribution_method","game_url","build_status",
            "pass_sso_integration_status","readyverse_sdk_integration_status","requires_launcher",
            // Readiness flags present in setup guide
            "is_listed_on_platform","platform_listing_url","has_stable_url","has_https_support","has_uptime_monitoring","has_support_commitment",
            "has_distribution_rights","build_format","meets_performance_guidelines","has_install_instructions","has_patch_commitment",
            // Compliance & assets per setup guide
            "age_rating",
            // Storage keys for primary assets
            AssetConstants.DatabaseFields.GameLogoKey,
            AssetConstants.DatabaseFields.CoverArtKey,
            AssetConstants.DatabaseFields.TrailerKey,
            // Optional add-ons and system
            "showroom_interest","wants_surreal_estate","submission_status","intake_submitted_at","technical_integration_submitted_at",
            "compliance_review_submitted_at","game_submission_submitted_at","approved_at","rejection_reason","readyverse_tech_team_notes",
            "readyverse_ops_notes","is_public","user_id","updated_at","onboarding_step","onboarding_completed_at"
        };

        private static string ToSnakeCase(string key)
        {
            if (string.IsNullOrEmpty(key)) return key;
            var sb = new StringBuilder();
            for (int i = 0; i < key.Length; i++)
            {
                char c = key[i];
                if (char.IsUpper(c))
                {
                    if (i > 0 && key[i - 1] != '_') sb.Append('_');
                    sb.Append(char.ToLowerInvariant(c));
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        public async Task<object?> GetSessionAsync()
        {
            try
            {
                // For now, return null to indicate no session
                // In a real implementation, you'd check the JWT token from the request
                _logger.LogInformation("REST: Getting session - no active session");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get session");
                return null;
            }
        }

        public async Task<object?> SignInWithOtpAsync(string email, string redirectTo)
        {
            try
            {
                var authUrl = $"{_supabaseUrl}/auth/v1/otp";
                var payload = new
                {
                    email = email,
                    options = new
                    {
                        email_redirect_to = redirectTo
                    }
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(authUrl, content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("REST: Magic link sent to {Email}", email);
                    return new { User = new { Id = "user-id", Email = email } };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to send magic link: {Error}", errorContent);
                    throw new Exception($"Failed to send magic link: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send magic link to {Email}", email);
                throw;
            }
        }

        public async Task SignOutAsync()
        {
            try
            {
                _logger.LogInformation("REST: Signing out");
                // In a real implementation, you'd invalidate the JWT token
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sign out");
                throw;
            }
        }

        public async Task<Project?> GetProjectBySlugAsync(string slug)
        {
            try
            {
                var response = await _httpClient.GetAsync($"projects?slug=eq.{slug}&is_public=eq.true&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });
                    
                    return projects?.FirstOrDefault();
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get project by slug {Slug}", slug);
                return null;
            }
        }

        public async Task<List<Project>> GetUserProjectsAsync(string userId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"projects?user_id=eq.{userId}&select=*&order=created_at.desc");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });
                    
                    _logger.LogInformation("Retrieved {Count} projects for user {UserId}: {Projects}", 
                        projects?.Length ?? 0, userId, content);
                    
                    return projects?.ToList() ?? new List<Project>();
                }
                
                return new List<Project>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get projects for user {UserId}", userId);
                return new List<Project>();
            }
        }

        public async Task<Project?> CreateProjectAsync(Project project)
        {
            try
            {
                // Only send columns that are guaranteed to exist in the current schema
                // and use snake_case as required by PostgREST
                var payload = new Dictionary<string, object?>
                {
                    ["id"] = project.Id,
                    ["name"] = project.Name,
                    ["slug"] = project.Slug,
                    ["user_id"] = project.UserId,
                    ["onboarding_step"] = project.OnboardingStep,
                    ["company_name"] = project.CompanyName,
                    ["is_public"] = project.IsPublic,
                    ["created_at"] = project.CreatedAt,
                    ["updated_at"] = project.UpdatedAt
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "projects")
                {
                    Content = content
                };
                request.Headers.Add("Prefer", "return=representation");

                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });
                    return projects?.FirstOrDefault();
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to create project: {StatusCode} - {Content}", 
                        response.StatusCode, errorContent);
                    throw new Exception($"Failed to create project: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create project {ProjectName}", project.Name);
                throw;
            }
        }

        public async Task<Project?> UpdateProjectAsync(Guid id, Project project)
        {
            try
            {
                var json = JsonSerializer.Serialize(project, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Create a new request with proper headers for authenticated operations
                var request = new HttpRequestMessage(HttpMethod.Patch, $"projects?id=eq.{id}")
                {
                    Content = content
                };
                // Avoid duplicating default auth headers set on HttpClient; only add Prefer here
                request.Headers.Add("Prefer", "return=representation");

                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    
                    // Supabase PATCH operations may return empty response or the updated record
                    if (string.IsNullOrWhiteSpace(responseContent))
                    {
                        // If empty response, fetch the updated project
                        return await GetProjectByIdAsync(id);
                    }
                    
                    try
                    {
                        var projects = JsonSerializer.Deserialize<Project[]>(responseContent, new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                            PropertyNameCaseInsensitive = true
                        });
                        
                        return projects?.FirstOrDefault();
                    }
                    catch (JsonException)
                    {
                        // If JSON parsing fails, fetch the updated project
                        return await GetProjectByIdAsync(id);
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to update project {ProjectId}. Url=projects?id=eq.{ProjectId} Status: {StatusCode}, Error: {Error}", 
                        id, response.StatusCode, errorContent);
                    throw new Exception($"Supabase update failed: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update project {ProjectId}", id);
                throw;
            }
        }

        public async Task<Project?> UpdateProjectFieldsAsync(Guid id, Dictionary<string, object?> fields)
        {
            try
            {
                // Remove nulls to avoid overwriting and to minimize payload
                var filtered = new Dictionary<string, object?>();
                foreach (var kv in fields)
                {
                    if (kv.Value == null) continue;
                    var snake = ToSnakeCase(kv.Key);
                    if (AllowedProjectColumns.Contains(snake))
                    {
                        filtered[snake] = kv.Value;
                    }
                }

                if (filtered.Count == 0)
                {
                    _logger.LogInformation("No valid columns to update for project {ProjectId}; skipping PATCH", id);
                    return await GetProjectByIdAsync(id);
                }

                var json = JsonSerializer.Serialize(filtered, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Patch, $"projects?id=eq.{id}")
                {
                    Content = content
                };
                request.Headers.Add("Prefer", "return=representation");

                _logger.LogInformation("Supabase PATCH fields projects id={Id} Payload={Payload}", id, json);
                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    if (string.IsNullOrWhiteSpace(responseContent))
                    {
                        return await GetProjectByIdAsync(id);
                    }
                    var projects = JsonSerializer.Deserialize<Project[]>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });
                    return projects?.FirstOrDefault();
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to update project fields {ProjectId}. Status: {StatusCode}, Error: {Error}",
                    id, response.StatusCode, errorContent);
                throw new Exception($"Supabase update failed: {response.StatusCode} - {errorContent}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update project fields {ProjectId}", id);
                throw;
            }
        }

        public async Task<bool> DeleteProjectAsync(Guid id)
        {
            try
            {
                var response = await _httpClient.DeleteAsync($"projects?id=eq.{id}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete project {ProjectId}", id);
                return false;
            }
        }

        public async Task<Project?> GetProjectByIdAsync(Guid id)
        {
            try
            {
                var response = await _httpClient.GetAsync($"projects?id=eq.{id}&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });
                    
                    return projects?.FirstOrDefault();
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get project by ID {ProjectId}", id);
                return null;
            }
        }

        public async Task<bool> ProjectNameExistsAsync(string name, string userId)
        {
            try
            {
                var encodedName = Uri.EscapeDataString(name);
                var response = await _httpClient.GetAsync($"projects?name=eq.{encodedName}&user_id=eq.{userId}&select=id");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });
                    
                    return projects?.Length > 0;
                }
                
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check if project name exists: {ProjectName}", name);
                return false;
            }
        }

        public async Task<List<Asset>> GetProjectAssetsAsync(Guid projectId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"assets?project_id=eq.{projectId}&select=*&order=created_at.desc");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var assets = JsonSerializer.Deserialize<Asset[]>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    return assets?.ToList() ?? new List<Asset>();
                }
                
                return new List<Asset>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get assets for project {ProjectId}", projectId);
                return new List<Asset>();
            }
        }

        public async Task<Asset?> CreateAssetAsync(Asset asset)
        {
            try
            {
                // PostgREST expects snake_case column names
                var payload = new Dictionary<string, object?>
                {
                    { "id", asset.Id },
                    { "project_id", asset.ProjectId },
                    { "file_name", asset.FileName },
                    { "file_key", asset.FileKey },
                    { "mime_type", asset.MimeType },
                    { "file_size", asset.FileSize },
                    { "kind", asset.Kind },
                    { "duration_seconds", asset.DurationSeconds },
                    { "width", asset.Width },
                    { "height", asset.Height },
                    { "created_at", asset.CreatedAt }
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "assets")
                {
                    Content = content
                };
                request.Headers.Add("Prefer", "return=representation");

                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    
                    // Supabase POST operations may return empty response or the created record
                    if (string.IsNullOrWhiteSpace(responseContent))
                    {
                        // If empty response, return the asset we created (it should have the ID from the request)
                        return asset;
                    }
                    
                    try
                    {
                        var assets = JsonSerializer.Deserialize<Asset[]>(responseContent, new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                            PropertyNameCaseInsensitive = true
                        });
                        
                        return assets?.FirstOrDefault();
                    }
                    catch (JsonException)
                    {
                        // If JSON parsing fails, return the asset we created
                        return asset;
                    }
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to create asset. Status: {StatusCode}, Error: {Error}", response.StatusCode, errorContent);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create asset {FileName}", asset.FileName);
                throw;
            }
        }

        public async Task<bool> DeleteAssetAsync(Guid id)
        {
            try
            {
                var response = await _httpClient.DeleteAsync($"assets?id=eq.{id}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete asset {AssetId}", id);
                return false;
            }
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string bucketName, string folder = "")
        {
            try
            {
                var fileKey = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
                
                var storageUrl = $"{_supabaseUrl}/storage/v1/object/{bucketName}/{fileKey}";
                
                using var content = new StreamContent(fileStream);
                
                // Set proper content type based on file extension
                var contentType = GetContentType(fileName);
                content.Headers.Add("Content-Type", contentType);
                
                // Create request message and add authorization header
                var request = new HttpRequestMessage(HttpMethod.Post, storageUrl)
                {
                    Content = content
                };
                request.Headers.Add("Authorization", $"Bearer {_supabaseServiceKey}");
                request.Headers.Add("x-upsert", "true");
                
                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    return fileKey;
                }
                
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to upload file {FileName}: {StatusCode} - {Error}", 
                    fileName, response.StatusCode, errorContent);
                throw new Exception($"Failed to upload file: {response.StatusCode} - {errorContent}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file {FileName}", fileName);
                throw;
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".mp4" => "video/mp4",
                ".webm" => "video/webm",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };
        }

        public async Task<string> GetSignedUrlAsync(string bucketName, string fileKey, int expiresIn = 3600)
        {
            try
            {
                // URL-encode each segment of the file key
                var encodedKey = string.Join("/", fileKey.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));
                var signedUrlEndpoint = $"{_supabaseUrl}/storage/v1/object/sign/{bucketName}/{encodedKey}";
                var queryParams = $"?expiresIn={expiresIn}";

                var response = await _httpClient.PostAsync($"{signedUrlEndpoint}{queryParams}", null);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<JsonElement>(content);
                    
                    if (result.TryGetProperty("signedURL", out var signedUrl))
                    {
                        return signedUrl.GetString() ?? "";
                    }
                }

                // Fallback: return public URL if bucket is public
                var publicUrl = $"{_supabaseUrl}/storage/v1/object/public/{bucketName}/{encodedKey}";
                if (response.StatusCode == System.Net.HttpStatusCode.BadRequest || response.StatusCode == System.Net.HttpStatusCode.Forbidden)
                {
                    _logger.LogWarning("Signed URL failed with {Status}, returning public URL for {Key}", response.StatusCode, fileKey);
                    return publicUrl;
                }

                throw new Exception($"Failed to get signed URL: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get signed URL for {FileKey}", fileKey);
                // Final fallback to public URL to avoid blocking UI
                var encodedKey = string.Join("/", fileKey.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));
                return $"{_supabaseUrl}/storage/v1/object/public/{bucketName}/{encodedKey}";
            }
        }

        public async Task<Organization?> GetUserOrganizationAsync(string userId)
        {
            try
            {
                var url = $"user_organizations?user_id=eq.{userId}&select=*,organizations(*)";
                var response = await _httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var userOrgs = JsonSerializer.Deserialize<JsonElement[]>(content);
                    
                    if (userOrgs?.Length > 0)
                    {
                        var userOrg = userOrgs[0];
                        if (userOrg.TryGetProperty("organizations", out var orgData))
                        {
                            return JsonSerializer.Deserialize<Organization>(orgData.GetRawText(), new JsonSerializerOptions
                            {
                                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                                PropertyNameCaseInsensitive = true
                            });
                        }
                    }
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user organization for {UserId}", userId);
                return null;
            }
        }

        public async Task<Organization?> CreateOrUpdateUserOrganizationAsync(string userId, Organization organization)
        {
            try
            {
                // First, check if user already has an organization
                var existingOrg = await GetUserOrganizationAsync(userId);
                
                if (existingOrg != null)
                {
                    // Update existing organization
                    organization.Id = existingOrg.Id;
                    organization.CreatedAt = existingOrg.CreatedAt;
                    organization.UpdatedAt = DateTime.UtcNow;
                    
                    var updateUrl = $"organizations?id=eq.{organization.Id}";
                    var updatePayload = new Dictionary<string, object?>
                    {
                        ["name"] = organization.Name,
                        ["website"] = organization.Website,
                        ["primary_contact_name"] = organization.PrimaryContactName,
                        ["primary_contact_email"] = organization.PrimaryContactEmail,
                        ["primary_contact_phone"] = organization.PrimaryContactPhone,
                        ["description"] = organization.Description,
                        ["industry"] = organization.Industry,
                        ["company_size"] = organization.CompanySize,
                        ["country"] = organization.Country,
                        ["is_verified"] = organization.IsVerified,
                        ["updated_at"] = organization.UpdatedAt
                    };
                    var json = JsonSerializer.Serialize(updatePayload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");
                    
                    var response = await _httpClient.PatchAsync(updateUrl, content);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        return organization;
                    }
                }
                else
                {
                    // Create new organization
                    organization.Id = Guid.NewGuid();
                    organization.CreatedAt = DateTime.UtcNow;
                    organization.UpdatedAt = DateTime.UtcNow;
                    
                    var createUrl = "organizations";
                    var createPayload = new Dictionary<string, object?>
                    {
                        ["id"] = organization.Id,
                        ["name"] = organization.Name,
                        ["website"] = organization.Website,
                        ["primary_contact_name"] = organization.PrimaryContactName,
                        ["primary_contact_email"] = organization.PrimaryContactEmail,
                        ["primary_contact_phone"] = organization.PrimaryContactPhone,
                        ["description"] = organization.Description,
                        ["industry"] = organization.Industry,
                        ["company_size"] = organization.CompanySize,
                        ["country"] = organization.Country,
                        ["is_verified"] = organization.IsVerified,
                        ["created_at"] = organization.CreatedAt,
                        ["updated_at"] = organization.UpdatedAt
                    };
                    var json = JsonSerializer.Serialize(createPayload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");
                    
                    var response = await _httpClient.PostAsync(createUrl, content);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        // Create user_organizations relationship
                        var userOrg = new
                        {
                            user_id = userId,
                            organization_id = organization.Id,
                            role = "owner",
                            created_at = DateTime.UtcNow
                        };
                        
                        var userOrgJson = JsonSerializer.Serialize(userOrg);
                        var userOrgContent = new StringContent(userOrgJson, Encoding.UTF8, "application/json");
                        
                        var userOrgResponse = await _httpClient.PostAsync("user_organizations", userOrgContent);
                        
                        if (userOrgResponse.IsSuccessStatusCode)
                        {
                            return organization;
                        }
                        else
                        {
                            var errorContent = await userOrgResponse.Content.ReadAsStringAsync();
                            _logger.LogError("Failed to create user_organizations relationship: {StatusCode} - {Content}", 
                                userOrgResponse.StatusCode, errorContent);
                            throw new Exception($"Failed to create user_organizations relationship: {userOrgResponse.StatusCode} - {errorContent}");
                        }
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Failed to create organization: {StatusCode} - {Content}", 
                            response.StatusCode, errorContent);
                        throw new Exception($"Failed to create organization: {response.StatusCode} - {errorContent}");
                    }
                }
                
                throw new Exception("Failed to create or update organization");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create/update user organization for {UserId}", userId);
                throw;
            }
        }

        public async Task<Organization?> UpdateOrganizationAsync(Organization organization)
        {
            try
            {
                organization.UpdatedAt = DateTime.UtcNow;
                
                var url = $"organizations?id=eq.{organization.Id}";
                var json = JsonSerializer.Serialize(organization);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PatchAsync(url, content);
                
                if (response.IsSuccessStatusCode)
                {
                    return organization;
                }
                
                throw new Exception($"Failed to update organization: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update organization {OrganizationId}", organization.Id);
                throw;
            }
        }

        // Showroom methods (public, no authentication required)
        public async Task<List<ShowroomGameDto>> GetPublishedGamesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("projects?is_public=eq.true&onboarding_step=eq.done&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });

                    return projects?.Select(MapToShowroomGameDto).ToList() ?? new List<ShowroomGameDto>();
                }

                return new List<ShowroomGameDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get published games");
                throw;
            }
        }

        public async Task<ShowroomGameDto?> GetPublishedGameByIdAsync(Guid id)
        {
            try
            {
                var response = await _httpClient.GetAsync($"projects?id=eq.{id}&is_public=eq.true&onboarding_step=eq.done&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });

                    var project = projects?.FirstOrDefault();
                    return project != null ? MapToShowroomGameDto(project) : null;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get published game {GameId}", id);
                throw;
            }
        }

        public async Task<List<ShowroomGameDto>> GetPublishedGamesByGenreAsync(string genre)
        {
            try
            {
                var encodedGenre = Uri.EscapeDataString(genre);
                var response = await _httpClient.GetAsync($"projects?is_public=eq.true&onboarding_step=eq.done&genre=eq.{encodedGenre}&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });

                    return projects?.Select(MapToShowroomGameDto).ToList() ?? new List<ShowroomGameDto>();
                }

                return new List<ShowroomGameDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get games by genre {Genre}", genre);
                throw;
            }
        }

        public async Task<List<ShowroomGameDto>> GetPublishedGamesByTrackAsync(string track)
        {
            try
            {
                var encodedTrack = Uri.EscapeDataString(track);
                var response = await _httpClient.GetAsync($"projects?is_public=eq.true&onboarding_step=eq.done&publishing_track=eq.{encodedTrack}&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });

                    return projects?.Select(MapToShowroomGameDto).ToList() ?? new List<ShowroomGameDto>();
                }

                return new List<ShowroomGameDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get games by track {Track}", track);
                throw;
            }
        }

        public async Task<List<ShowroomGameDto>> SearchPublishedGamesAsync(string query)
        {
            try
            {
                var encodedQuery = Uri.EscapeDataString(query);
                var response = await _httpClient.GetAsync($"projects?is_public=eq.true&onboarding_step=eq.done&or=(name.ilike.*{encodedQuery}*,short_description.ilike.*{encodedQuery}*,full_description.ilike.*{encodedQuery}*)&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });

                    return projects?.Select(MapToShowroomGameDto).ToList() ?? new List<ShowroomGameDto>();
                }

                return new List<ShowroomGameDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to search games with query {Query}", query);
                throw;
            }
        }

        public async Task<List<ShowroomGameDto>> GetFeaturedGamesAsync()
        {
            try
            {
                // For now, return the most recently completed games as "featured"
                // In the future, this could be based on a "featured" flag or algorithm
                var response = await _httpClient.GetAsync("projects?is_public=eq.true&onboarding_step=eq.done&order=onboarding_completed_at.desc&limit=10&select=*");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(content, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                        PropertyNameCaseInsensitive = true
                    });

                    return projects?.Select(MapToShowroomGameDto).ToList() ?? new List<ShowroomGameDto>();
                }

                return new List<ShowroomGameDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get featured games");
                throw;
            }
        }

        private ShowroomGameDto MapToShowroomGameDto(Project project)
        {
            var targetPlatforms = new string[0];
            if (!string.IsNullOrEmpty(project.TargetPlatforms))
            {
                try
                {
                    targetPlatforms = JsonSerializer.Deserialize<string[]>(project.TargetPlatforms) ?? new string[0];
                }
                catch
                {
                    targetPlatforms = new string[0];
                }
            }

            return new ShowroomGameDto
            {
                Id = project.Id,
                Name = project.Name,
                Slug = project.Slug,
                CompanyName = project.CompanyName ?? "",
                CompanyLogoUrl = project.CompanyLogoUrl,
                ShortDescription = project.ShortDescription,
                FullDescription = project.FullDescription,
                Genre = project.Genre,
                PublishingTrack = project.PublishingTrack,
                BuildStatus = project.BuildStatus,
                TargetPlatforms = targetPlatforms,
                GameLogoUrl = project.GameLogoKey, // Using key instead of URL
                CoverArtUrl = project.CoverArtKey, // Using key instead of URL
                TrailerUrl = project.TrailerKey, // Using key instead of URL
                ScreenshotUrls = new string[0], // TODO: Get from assets table
                GameUrl = project.GameUrl,
                LauncherUrl = project.LauncherUrl,
                AgeRating = project.AgeRating,
                RatingBoard = project.RatingBoard,
                SupportEmail = project.SupportEmail,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                OnboardingCompletedAt = project.OnboardingCompletedAt,
                IsFeatured = false, // TODO: Add featured flag to Project model
                ViewCount = 0, // TODO: Add view tracking
                LikeCount = 0 // TODO: Add like tracking
            };
        }
    }
}
