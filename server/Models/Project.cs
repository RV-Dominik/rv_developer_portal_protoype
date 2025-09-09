using System.ComponentModel.DataAnnotations;
using Supabase.Postgrest.Models;
using Supabase.Postgrest.Attributes;

namespace ShowroomBackend.Models
{
    [Table("projects")]
    public class Project : BaseModel
    {
        public Guid Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Slug { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? DeveloperName { get; set; }
        
        public string? DeveloperEmail { get; set; }
        
        public string? DeveloperWebsite { get; set; }
        
        public string? Version { get; set; }
        
        public string? UnityVersion { get; set; }
        
        public string? UnrealVersion { get; set; }
        
        public bool IsPublic { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        public string UserId { get; set; } = string.Empty;
        
        public List<Asset> Assets { get; set; } = new();
    }
}
