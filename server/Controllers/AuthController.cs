using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShowroomBackend.Services;
using ShowroomBackend.Models.DTOs;
using System.Security.Claims;

namespace ShowroomBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthenticationService _authService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            AuthenticationService authService, 
            IConfiguration configuration, 
            ILogger<AuthController> logger)
        {
            _authService = authService;
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
                var redirectTo = $"{publicBaseUrl}/?auth=callback";

                var result = await _authService.SendMagicLinkAsync(request.Email, redirectTo);

                if (result == null)
                {
                    return BadRequest(new { error = "Failed to send magic link" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending magic link to {Email}", request.Email);
                return StatusCode(500, new { error = "Failed to send magic link" });
            }
        }

        /// <summary>
        /// Verify magic link callback and create session
        /// </summary>
        /// <param name="request">The magic link verification request</param>
        /// <returns>User session with JWT token</returns>
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyMagicLink([FromBody] MagicLinkVerifyRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.AccessToken))
                {
                    return BadRequest(new { error = "Access token is required" });
                }

                var result = await _authService.VerifyMagicLinkAsync(request.AccessToken, request.RefreshToken ?? "");

                if (result == null)
                {
                    return BadRequest(new { error = "Invalid magic link" });
                }

                // Generate our own JWT token for session management
                var user = result.GetType().GetProperty("user")?.GetValue(result);
                if (user != null)
                {
                    var userId = user.GetType().GetProperty("id")?.GetValue(user)?.ToString();
                    var email = user.GetType().GetProperty("email")?.GetValue(user)?.ToString();
                    
                    if (!string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(email))
                    {
                        var jwtToken = _authService.GenerateJwtToken(userId, email);
                        
                        // Set HTTP-only cookie
                        var cookieOptions = new CookieOptions
                        {
                            HttpOnly = true,
                            // Always secure in production hosting; required for SameSite=None
                            Secure = true,
                            // Ensure cookie is sent on cross-site requests and after redirects
                            SameSite = SameSiteMode.None,
                            Expires = DateTime.UtcNow.AddDays(7),
                            Path = "/"
                        };
                        
                        Response.Cookies.Append("auth_token", jwtToken, cookieOptions);
                        
                        _logger.LogInformation("Set auth_token cookie for user {UserId} with Secure={Secure}", userId, cookieOptions.Secure);
                        
                        return Ok(new
                        {
                            user = new
                            {
                                id = userId,
                                email = email
                            },
                            message = "Authentication successful"
                        });
                    }
                }

                return BadRequest(new { error = "Failed to create session" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying magic link");
                return StatusCode(500, new { error = "Failed to verify magic link" });
            }
        }

        [HttpGet("session")]
        [Authorize]
        public IActionResult GetSession()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = User.FindFirst(ClaimTypes.Email)?.Value;

                _logger.LogInformation("GetSession called - UserId: {UserId}, Email: {Email}, IsAuthenticated: {IsAuthenticated}", 
                    userId, email, User.Identity?.IsAuthenticated);

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
                {
                    _logger.LogWarning("Missing userId or email in session");
                    return Unauthorized(new { error = "Not authenticated" });
                }

                return Ok(new
                {
                    user = new
                    {
                        id = userId,
                        email = email
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session");
                return StatusCode(500, new { error = "Failed to get session" });
            }
        }

        [HttpGet("test-auth")]
        [Authorize]
        public IActionResult TestAuth()
        {
            return Ok(new { 
                message = "Authentication working!",
                userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                email = User.FindFirst(ClaimTypes.Email)?.Value,
                isAuthenticated = User.Identity?.IsAuthenticated
            });
        }


        [HttpPost("logout")]
        public IActionResult Logout()
        {
            try
            {
                // Clear the authentication cookie
                Response.Cookies.Delete("auth_token");
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

    public class MagicLinkVerifyRequest
    {
        public string AccessToken { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
    }
}
