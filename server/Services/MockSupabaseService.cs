using ShowroomBackend.Models;

namespace ShowroomBackend.Services
{
    public class MockSupabaseService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<MockSupabaseService> _logger;

        public MockSupabaseService(IConfiguration configuration, ILogger<MockSupabaseService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<object?> GetSessionAsync()
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting session");
            return new { User = new { Id = "mock-user-id", Email = "test@example.com" } };
        }

        public async Task<object?> SignInWithOtpAsync(string email, string redirectTo)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Sending magic link to {Email}", email);
            return new { User = new { Id = "mock-user-id", Email = email } };
        }

        public async Task SignOutAsync()
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Signing out");
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
                UserId = "mock-user-id",
                Assets = new List<Asset>()
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
                    Name = "Mock Project 1",
                    Slug = "mock-project-1",
                    Description = "First mock project",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UserId = userId,
                    Assets = new List<Asset>()
                }
            };
        }

        public async Task<Project?> GetProjectByIdAsync(Guid id, string userId)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting project {Id} for user {UserId}", id, userId);
            
            return new Project
            {
                Id = id,
                Name = "Mock Project",
                Slug = "mock-project",
                Description = "A mock project for testing",
                IsPublic = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserId = userId,
                Assets = new List<Asset>()
            };
        }

        public async Task<Project?> CreateProjectAsync(Project project)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Creating project {ProjectName}", project.Name);
            
            project.Id = Guid.NewGuid();
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;
            
            return project;
        }

        public async Task<Project?> UpdateProjectAsync(Project project)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Updating project {ProjectId}", project.Id);
            
            project.UpdatedAt = DateTime.UtcNow;
            return project;
        }

        public async Task<bool> DeleteProjectAsync(Guid id, string userId)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Deleting project {Id} for user {UserId}", id, userId);
            return true;
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
                    FileName = "mock-asset.jpg",
                    FileKey = "mock-file-key",
                    MimeType = "image/jpeg",
                    FileSize = 1024,
                    Kind = "screenshot",
                    CreatedAt = DateTime.UtcNow
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

        public async Task<bool> DeleteAssetAsync(Guid id, Guid projectId, string userId)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Deleting asset {Id} from project {ProjectId}", id, projectId);
            return true;
        }

        public async Task<string?> GetSignedUrlAsync(string fileKey, int ttlSeconds = 3600)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Creating signed URL for {FileKey}", fileKey);
            return $"https://mock-signed-url.com/{fileKey}";
        }

        public async Task<string?> UploadFileAsync(Stream fileStream, string fileName, string contentType)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Uploading file {FileName}", fileName);
            return $"mock-file-key-{Guid.NewGuid()}";
        }
    }
}
