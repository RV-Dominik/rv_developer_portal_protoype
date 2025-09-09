using System.ComponentModel.DataAnnotations;
using Supabase.Postgrest.Models;
using Supabase.Postgrest.Attributes;

namespace ShowroomBackend.Models
{
    [Table("assets")]
    public class Asset : BaseModel
    {
        public Guid Id { get; set; }
        
        public Guid ProjectId { get; set; }
        
        [Required]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        public string FileKey { get; set; } = string.Empty;
        
        [Required]
        public string MimeType { get; set; } = string.Empty;
        
        public long FileSize { get; set; }
        
        [Required]
        public string Kind { get; set; } = string.Empty; // screenshot, trailer, etc.
        
        public int? DurationSeconds { get; set; }
        
        public int? Width { get; set; }
        
        public int? Height { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public Project? Project { get; set; }
    }
}
