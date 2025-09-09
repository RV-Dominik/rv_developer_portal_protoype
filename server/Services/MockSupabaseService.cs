using ShowroomBackend.Models;

namespace ShowroomBackend.Services
{
    public class MockSupabaseService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<MockSupabaseService> _logger;
        private static bool _isLoggedIn = false;
        private static string? _currentUserEmail = null;

        public MockSupabaseService(IConfiguration configuration, ILogger<MockSupabaseService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<object?> GetSessionAsync()
        {
            await Task.Delay(1);
            if (_isLoggedIn && !string.IsNullOrEmpty(_currentUserEmail))
            {
                _logger.LogInformation("Mock: Getting session - user logged in as {Email}", _currentUserEmail);
                return new { User = new { Id = "mock-user-id", Email = _currentUserEmail } };
            }
            _logger.LogInformation("Mock: Getting session - no active session");
            return null;
        }

        public async Task<object?> SignInWithOtpAsync(string email, string redirectTo)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Sending magic link to {Email}", email);
            
            // Simulate successful login after magic link
            _isLoggedIn = true;
            _currentUserEmail = email;
            
            return new { User = new { Id = "mock-user-id", Email = email } };
        }

        public async Task SignOutAsync()
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Signing out");
            _isLoggedIn = false;
            _currentUserEmail = null;
        }

        public async Task<Project?> GetProjectBySlugAsync(string slug)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting project by slug {Slug}", slug);
            
            // Return a mock project
            return new Project
            {
                Id = Guid.NewGuid(),
                Name = "Mock Project",
                Slug = slug,
                Description = "A mock project for testing",
                IsPublic = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserId = "mock-user-id"
            };
        }

        public async Task<List<Project>> GetUserProjectsAsync(string userId)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting projects for user {UserId}", userId);
            
            return new List<Project>
            {
                new Project
                {
                    Id = Guid.NewGuid(),
                    Name = "Sample Project 1",
                    Slug = "sample-project-1",
                    Description = "A sample project for testing",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    UserId = userId
                },
                new Project
                {
                    Id = Guid.NewGuid(),
                    Name = "Sample Project 2",
                    Slug = "sample-project-2",
                    Description = "Another sample project",
                    IsPublic = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow,
                    UserId = userId
                }
            };
        }

        public async Task<Project?> CreateProjectAsync(Project project)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Creating project {ProjectName}", project.Name);
            
            project.Id = Guid.NewGuid();
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;
            project.UserId = "mock-user-id";
            
            return project;
        }

        public async Task<Project?> UpdateProjectAsync(Guid id, Project project)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Updating project {ProjectId}", id);
            
            project.Id = id;
            project.UpdatedAt = DateTime.UtcNow;
            project.UserId = "mock-user-id";
            
            return project;
        }

        public async Task<bool> DeleteProjectAsync(Guid id)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Deleting project {ProjectId}", id);
            return true;
        }

        public async Task<Project?> GetProjectByIdAsync(Guid id)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting project by ID {ProjectId}", id);
            
            return new Project
            {
                Id = id,
                Name = "Mock Project",
                Slug = "mock-project",
                Description = "A mock project for testing",
                IsPublic = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserId = "mock-user-id"
            };
        }

        public async Task<List<Asset>> GetProjectAssetsAsync(Guid projectId)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting assets for project {ProjectId}", projectId);
            
            return new List<Asset>
            {
                new Asset
                {
                    Id = Guid.NewGuid(),
                    ProjectId = projectId,
                    FileKey = "screenshots/screenshot1.jpg",
                    FileName = "screenshot1.jpg",
                    MimeType = "image/jpeg",
                    Kind = "screenshot",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                }
            };
        }

        public async Task<Asset?> CreateAssetAsync(Asset asset)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Creating asset {FileName}", asset.FileName);
            
            asset.Id = Guid.NewGuid();
            asset.CreatedAt = DateTime.UtcNow;
            
            return asset;
        }

        public async Task<bool> DeleteAssetAsync(Guid id)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Deleting asset {AssetId}", id);
            return true;
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string bucketName, string folder = "")
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Uploading file {FileName} to bucket {BucketName}", fileName, bucketName);
            
            var fileKey = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
            return fileKey;
        }

        public async Task<string> GetSignedUrlAsync(string bucketName, string fileKey, int expiresIn = 3600)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting signed URL for {FileKey}", fileKey);
            
            return $"https://mock-bucket.supabase.co/storage/v1/object/sign/{bucketName}/{fileKey}?expiresIn={expiresIn}";
        }
    }
}
