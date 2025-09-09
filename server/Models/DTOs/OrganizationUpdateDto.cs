using System.ComponentModel.DataAnnotations;

namespace ShowroomBackend.Models.DTOs
{
    public class OrganizationUpdateDto
    {
        [MaxLength(255)]
        public string? Name { get; set; }

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
    }
}
