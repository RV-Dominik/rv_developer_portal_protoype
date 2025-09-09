using System.ComponentModel.DataAnnotations;

namespace ShowroomBackend.Models.DTOs
{
    public class ProjectUpdateDto
    {
        [StringLength(100, MinimumLength = 1)]
        public string? Name { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [StringLength(100)]
        public string? DeveloperName { get; set; }
        
        [EmailAddress]
        [StringLength(255)]
        public string? DeveloperEmail { get; set; }
        
        [Url]
        [StringLength(500)]
        public string? DeveloperWebsite { get; set; }
        
        [StringLength(20)]
        public string? Version { get; set; }
        
        [StringLength(20)]
        public string? UnityVersion { get; set; }
        
        [StringLength(20)]
        public string? UnrealVersion { get; set; }
        
        public bool? IsPublic { get; set; }
    }
}
