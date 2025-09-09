using System.ComponentModel.DataAnnotations;
using Supabase.Postgrest.Models;
using Supabase.Postgrest.Attributes;

namespace ShowroomBackend.Models
{
    [Table("organizations")]
    public class Organization : BaseModel
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Website { get; set; }

        [MaxLength(255)]
        public string? PrimaryContactName { get; set; }

        [MaxLength(255)]
        public string? PrimaryContactEmail { get; set; }

        [MaxLength(50)]
        public string? PrimaryContactPhone { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? Industry { get; set; }

        [MaxLength(100)]
        public string? CompanySize { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        public bool IsVerified { get; set; } = false;
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
