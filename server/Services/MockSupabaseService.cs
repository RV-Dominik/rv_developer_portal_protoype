using ShowroomBackend.Models;

namespace ShowroomBackend.Services
{
    public class MockSupabaseService : ISupabaseService
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
                ShortDescription = "A mock project for testing",
                FullDescription = "This is a mock project used for testing the Readyverse Developer Portal functionality.",
                Genre = "Action",
                PlatformType = "PC Client",
                DistributionMethod = "Steam",
                BuildStatus = "Production-Ready",
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
                    Name = "Epic Fantasy RPG",
                    Slug = "epic-fantasy-rpg",
                    ShortDescription = "An epic fantasy RPG adventure",
                    FullDescription = "A comprehensive role-playing game featuring deep character customization, engaging storylines, and immersive world-building.",
                    Genre = "RPG",
                    PublishingTrack = "Platform Games",
                    PlatformType = "PC Client",
                    DistributionMethod = "Steam",
                    BuildStatus = "Production-Ready",
                    IsListedOnPlatform = true,
                    PlatformListingUrl = "https://store.steampowered.com/app/example",
                    PassSsoIntegrationStatus = "Complete",
                    ReadyverseSdkIntegrationStatus = "Complete",
                    RequiresLauncher = true,
                    AgeRating = "ESRB T",
                    SubmissionStatus = "Approved",
                    ApprovedAt = DateTime.UtcNow.AddDays(-5),
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    UserId = userId
                },
                new Project
                {
                    Id = Guid.NewGuid(),
                    Name = "Web Strategy Simulator",
                    Slug = "web-strategy-simulator",
                    ShortDescription = "Build and manage your empire",
                    FullDescription = "A complex strategy simulation game where players build and manage their own civilization from the ground up.",
                    Genre = "Strategy",
                    PublishingTrack = "Self Hosted",
                    PlatformType = "Web-Based",
                    DistributionMethod = "Self-Hosted",
                    BuildStatus = "Production-Ready",
                    HasStableUrl = true,
                    HasHttpsSupport = true,
                    HasUptimeMonitoring = true,
                    HasSupportCommitment = true,
                    PassSsoIntegrationStatus = "In Progress",
                    ReadyverseSdkIntegrationStatus = "Not Started",
                    RequiresLauncher = true,
                    AgeRating = "PEGI 12",
                    SubmissionStatus = "Technical Integration",
                    TechnicalIntegrationSubmittedAt = DateTime.UtcNow.AddDays(-2),
                    IsPublic = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow,
                    UserId = userId
                },
                new Project
                {
                    Id = Guid.NewGuid(),
                    Name = "Readyverse Action Game",
                    Slug = "readyverse-action-game",
                    ShortDescription = "Fast-paced action adventure",
                    FullDescription = "An action-packed adventure game designed specifically for the Readyverse ecosystem with integrated collectibles and social features.",
                    Genre = "Action",
                    PublishingTrack = "Readyverse Hosted",
                    PlatformType = "PC Client",
                    DistributionMethod = "Readyverse Hosted",
                    BuildStatus = "Production-Ready",
                    HasDistributionRights = true,
                    BuildFormat = "Unity build",
                    MeetsPerformanceGuidelines = true,
                    HasInstallInstructions = true,
                    HasPatchCommitment = true,
                    PassSsoIntegrationStatus = "Complete",
                    ReadyverseSdkIntegrationStatus = "Complete",
                    RequiresLauncher = true,
                    AgeRating = "ESRB E",
                    SubmissionStatus = "Game Submission",
                    GameSubmissionSubmittedAt = DateTime.UtcNow.AddDays(-1),
                    IsPublic = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
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
                ShortDescription = "A mock project for testing",
                FullDescription = "This is a mock project used for testing the Readyverse Developer Portal functionality.",
                Genre = "Action",
                PublishingTrack = "Platform Games",
                PlatformType = "PC Client",
                DistributionMethod = "Steam",
                BuildStatus = "Production-Ready",
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

        public async Task<Organization?> GetUserOrganizationAsync(string userId)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting user organization for {UserId}", userId);
            
            // Return null to simulate no organization set up yet
            return null;
        }

        public async Task<Organization?> CreateOrUpdateUserOrganizationAsync(string userId, Organization organization)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Creating/updating user organization for {UserId}", userId);
            
            organization.Id = Guid.NewGuid();
            organization.CreatedAt = DateTime.UtcNow;
            organization.UpdatedAt = DateTime.UtcNow;
            
            return organization;
        }

        public async Task<Organization?> UpdateOrganizationAsync(Organization organization)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Updating organization {OrganizationId}", organization.Id);
            
            organization.UpdatedAt = DateTime.UtcNow;
            return organization;
        }
    }
}
