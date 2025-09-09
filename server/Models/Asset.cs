using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Supabase.Postgrest.Models;
using Supabase.Postgrest.Attributes;

namespace ShowroomBackend.Models
{
    [Table("assets")]
    public class Asset : BaseModel
    {
        [PrimaryKey]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        
        [JsonPropertyName("project_id")]
        public Guid ProjectId { get; set; }
        
        [Required]
        [JsonPropertyName("file_name")]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("file_key")]
        public string FileKey { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("mime_type")]
        public string MimeType { get; set; } = string.Empty;
        
        [JsonPropertyName("file_size")]
        public long FileSize { get; set; }
        
        [Required]
        [JsonPropertyName("kind")]
        public string Kind { get; set; } = string.Empty; // screenshot, trailer, etc.
        
        [JsonPropertyName("duration_seconds")]
        public int? DurationSeconds { get; set; }
        
        [JsonPropertyName("width")]
        public int? Width { get; set; }
        
        [JsonPropertyName("height")]
        public int? Height { get; set; }
        
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public Project? Project { get; set; }
    }
}
