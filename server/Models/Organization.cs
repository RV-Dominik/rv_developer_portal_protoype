using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Supabase.Postgrest.Attributes;

namespace ShowroomBackend.Models
{
    [Table("organizations")]
    public class Organization
    {
        [PrimaryKey]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        [JsonPropertyName("website")]
        public string? Website { get; set; }

        [MaxLength(255)]
        [JsonPropertyName("primary_contact_name")]
        public string? PrimaryContactName { get; set; }

        [MaxLength(255)]
        [JsonPropertyName("primary_contact_email")]
        public string? PrimaryContactEmail { get; set; }

        [MaxLength(50)]
        [JsonPropertyName("primary_contact_phone")]
        public string? PrimaryContactPhone { get; set; }

        [MaxLength(1000)]
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [MaxLength(100)]
        [JsonPropertyName("industry")]
        public string? Industry { get; set; }

        [MaxLength(100)]
        [JsonPropertyName("company_size")]
        public string? CompanySize { get; set; }

        [MaxLength(100)]
        [JsonPropertyName("country")]
        public string? Country { get; set; }

        [JsonPropertyName("is_verified")]
        public bool IsVerified { get; set; } = false;
        
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }
        
        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
