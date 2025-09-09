using System.Text;
using System.Text.Json;
using ShowroomBackend.Models;
using ShowroomBackend.Models.DTOs;

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
                        PropertyNameCaseInsensitive = true
                    });
                    
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
                var json = JsonSerializer.Serialize(project);
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
                        PropertyNameCaseInsensitive = true
                    });
                    return projects?.FirstOrDefault();
                }
                
                return null;
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
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                });
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PatchAsync($"projects?id=eq.{id}", content);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var projects = JsonSerializer.Deserialize<Project[]>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    return projects?.FirstOrDefault();
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update project {ProjectId}", id);
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
                var json = JsonSerializer.Serialize(asset, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                });
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("assets", content);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var assets = JsonSerializer.Deserialize<Asset[]>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    return assets?.FirstOrDefault();
                }
                
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
                content.Headers.Add("Content-Type", "application/octet-stream");
                
                var response = await _httpClient.PostAsync(storageUrl, content);
                
                if (response.IsSuccessStatusCode)
                {
                    return fileKey;
                }
                
                throw new Exception($"Failed to upload file: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file {FileName}", fileName);
                throw;
            }
        }

        public async Task<string> GetSignedUrlAsync(string bucketName, string fileKey, int expiresIn = 3600)
        {
            try
            {
                var signedUrlEndpoint = $"{_supabaseUrl}/storage/v1/object/sign/{bucketName}/{fileKey}";
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
                
                throw new Exception($"Failed to get signed URL: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get signed URL for {FileKey}", fileKey);
                throw;
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
                            return JsonSerializer.Deserialize<Organization>(orgData.GetRawText());
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
                    var json = JsonSerializer.Serialize(organization);
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
                    var json = JsonSerializer.Serialize(organization);
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
    }
}
