namespace ShowroomBackend.Models.DTOs
{
    public class ManifestDto
    {
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? DeveloperName { get; set; }
        public string? DeveloperWebsite { get; set; }
        public string? Version { get; set; }
        public string? UnityVersion { get; set; }
        public string? UnrealVersion { get; set; }
        public List<string> Screenshots { get; set; } = new();
        public Dictionary<string, object> Assets { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
