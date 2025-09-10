using ShowroomBackend.Models;
using ShowroomBackend.Models.DTOs;

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

        // Showroom methods (public, no authentication required)
        public async Task<List<ShowroomGameDto>> GetPublishedGamesAsync()
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting published games");
            
            return new List<ShowroomGameDto>
            {
                new ShowroomGameDto
                {
                    Id = Guid.NewGuid(),
                    Name = "Epic Adventure Game",
                    Slug = "epic-adventure-game",
                    CompanyName = "Mock Studios",
                    CompanyLogoUrl = "https://example.com/logo.png",
                    ShortDescription = "An epic adventure game with stunning graphics and immersive gameplay.",
                    FullDescription = "Embark on an epic journey through mystical lands, battle fearsome creatures, and uncover ancient secrets in this action-packed adventure game.",
                    Genre = "Action",
                    PublishingTrack = "Platform Games",
                    BuildStatus = "Production-Ready",
                    TargetPlatforms = new[] { "PC", "Mac", "Linux" },
                    GameLogoUrl = "https://example.com/game-logo.png",
                    CoverArtUrl = "https://example.com/cover-art.jpg",
                    TrailerUrl = "https://example.com/trailer.mp4",
                    ScreenshotUrls = new[] { "https://example.com/screenshot1.jpg", "https://example.com/screenshot2.jpg" },
                    GameUrl = "https://example.com/game",
                    LauncherUrl = "https://example.com/launcher",
                    AgeRating = "T",
                    RatingBoard = "ESRB",
                    SupportEmail = "support@mockstudios.com",
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    OnboardingCompletedAt = DateTime.UtcNow.AddDays(-1),
                    IsFeatured = true,
                    ViewCount = 1250,
                    LikeCount = 89
                },
                new ShowroomGameDto
                {
                    Id = Guid.NewGuid(),
                    Name = "Space Strategy Sim",
                    Slug = "space-strategy-sim",
                    CompanyName = "Galactic Games",
                    CompanyLogoUrl = "https://example.com/galactic-logo.png",
                    ShortDescription = "Build and manage your own space empire in this strategic simulation.",
                    FullDescription = "Command fleets, colonize planets, and engage in epic space battles in this deep strategic simulation game.",
                    Genre = "Strategy",
                    PublishingTrack = "Self-Hosted",
                    BuildStatus = "Beta",
                    TargetPlatforms = new[] { "PC", "Web" },
                    GameLogoUrl = "https://example.com/space-logo.png",
                    CoverArtUrl = "https://example.com/space-cover.jpg",
                    TrailerUrl = "https://example.com/space-trailer.mp4",
                    ScreenshotUrls = new[] { "https://example.com/space1.jpg", "https://example.com/space2.jpg" },
                    GameUrl = "https://space-strategy.example.com",
                    LauncherUrl = null,
                    AgeRating = "E",
                    RatingBoard = "ESRB",
                    SupportEmail = "help@galacticgames.com",
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2),
                    OnboardingCompletedAt = DateTime.UtcNow.AddDays(-2),
                    IsFeatured = false,
                    ViewCount = 567,
                    LikeCount = 34
                }
            };
        }

        public async Task<ShowroomGameDto?> GetPublishedGameByIdAsync(Guid id)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting published game {GameId}", id);
            
            var games = await GetPublishedGamesAsync();
            return games.FirstOrDefault(g => g.Id == id);
        }

        public async Task<List<ShowroomGameDto>> GetPublishedGamesByGenreAsync(string genre)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting games by genre {Genre}", genre);
            
            var games = await GetPublishedGamesAsync();
            return games.Where(g => g.Genre?.Equals(genre, StringComparison.OrdinalIgnoreCase) == true).ToList();
        }

        public async Task<List<ShowroomGameDto>> GetPublishedGamesByTrackAsync(string track)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting games by track {Track}", track);
            
            var games = await GetPublishedGamesAsync();
            return games.Where(g => g.PublishingTrack?.Equals(track, StringComparison.OrdinalIgnoreCase) == true).ToList();
        }

        public async Task<List<ShowroomGameDto>> SearchPublishedGamesAsync(string query)
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Searching games with query {Query}", query);
            
            var games = await GetPublishedGamesAsync();
            return games.Where(g => 
                g.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                g.ShortDescription?.Contains(query, StringComparison.OrdinalIgnoreCase) == true ||
                g.FullDescription?.Contains(query, StringComparison.OrdinalIgnoreCase) == true
            ).ToList();
        }

        public async Task<List<ShowroomGameDto>> GetFeaturedGamesAsync()
        {
            await Task.Delay(1);
            _logger.LogInformation("Mock: Getting featured games");
            
            var games = await GetPublishedGamesAsync();
            return games.Where(g => g.IsFeatured).ToList();
        }
    }
}
