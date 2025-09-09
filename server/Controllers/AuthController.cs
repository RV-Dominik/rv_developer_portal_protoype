using Microsoft.AspNetCore.Mvc;
using ShowroomBackend.Services;
using ShowroomBackend.Models.DTOs;

namespace ShowroomBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly MockSupabaseService _supabaseService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            MockSupabaseService supabaseService, 
            IConfiguration configuration, 
            ILogger<AuthController> logger)
        {
            _supabaseService = supabaseService;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Send a magic link to the user's email for authentication
        /// </summary>
        /// <param name="request">The magic link request containing the email</param>
        /// <returns>Success message or error</returns>
        [HttpPost("magic-link")]
        public async Task<IActionResult> RequestMagicLink([FromBody] MagicLinkRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { error = "Email is required" });
                }

                var publicBaseUrl = _configuration["PUBLIC_BASE_URL"] ?? "http://localhost:8080";
                var redirectTo = $"{publicBaseUrl}/web?auth=success";

                var session = await _supabaseService.SignInWithOtpAsync(request.Email, redirectTo);

                if (session == null)
                {
                    return BadRequest(new { error = "Failed to send magic link" });
                }

                return Ok(new { message = "Magic link sent to your email" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending magic link to {Email}", request.Email);
                return StatusCode(500, new { error = "Failed to send magic link" });
            }
        }

        [HttpGet("session")]
        public async Task<IActionResult> GetSession()
        {
            try
            {
                var session = await _supabaseService.GetSessionAsync();

                if (session == null)
                {
                    return Unauthorized(new { error = "Not authenticated" });
                }

                return Ok(new
                {
                    user = new
                    {
                        id = "mock-user-id",
                        email = "test@example.com",
                        created_at = DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session");
                return StatusCode(500, new { error = "Failed to get session" });
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                await _supabaseService.SignOutAsync();
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new { error = "Failed to logout" });
            }
        }
    }

    public class MagicLinkRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}
