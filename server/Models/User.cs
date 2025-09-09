namespace ShowroomBackend.Models
{
    public class User
    {
        public string Id { get; set; } = string.Empty;
        
        public string Email { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? LastSignInAt { get; set; }
    }
}
