using ShowroomBackend.Models;

namespace ShowroomBackend.Services
{
    public interface ISupabaseService
    {
        Task<object?> GetSessionAsync();
        Task<object?> SignInWithOtpAsync(string email, string redirectTo);
        Task SignOutAsync();
        Task<Project?> GetProjectBySlugAsync(string slug);
        Task<List<Project>> GetUserProjectsAsync(string userId);
        Task<Project?> CreateProjectAsync(Project project);
        Task<Project?> UpdateProjectAsync(Guid id, Project project);
        Task<bool> DeleteProjectAsync(Guid id);
        Task<Project?> GetProjectByIdAsync(Guid id);
        Task<List<Asset>> GetProjectAssetsAsync(Guid projectId);
        Task<Asset?> CreateAssetAsync(Asset asset);
        Task<bool> DeleteAssetAsync(Guid id);
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string bucketName, string folder = "");
        Task<string> GetSignedUrlAsync(string bucketName, string fileKey, int expiresIn = 3600);
    }
}
