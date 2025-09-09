using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using ShowroomBackend.Models;

namespace ShowroomBackend.Services
{
    public class AuthenticationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthenticationService> _logger;
        private readonly string _supabaseUrl;
        private readonly string _supabaseAnonKey;
        private readonly string _jwtSecret;

        public AuthenticationService(HttpClient httpClient, IConfiguration configuration, ILogger<AuthenticationService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            
            _supabaseUrl = _configuration["SUPABASE_URL"] ?? throw new InvalidOperationException("SUPABASE_URL not configured");
            _supabaseAnonKey = _configuration["SUPABASE_ANON_KEY"] ?? throw new InvalidOperationException("SUPABASE_ANON_KEY not configured");
            _jwtSecret = _configuration["JWT_SECRET"] ?? "your-super-secret-jwt-key-change-this-in-production";
            
            // Configure HttpClient for Supabase Auth
            _httpClient.BaseAddress = new Uri($"{_supabaseUrl}/auth/v1/");
            _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_supabaseAnonKey}");
        }

        public async Task<object?> SendMagicLinkAsync(string email, string redirectTo)
        {
            try
            {
                var payload = new
                {
                    email = email,
                    options = new
                    {
                        email_redirect_to = redirectTo
                    }
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("otp", content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Magic link sent to {Email}", email);
                    return new { message = "Magic link sent to your email" };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to send magic link: {Error}", errorContent);
                    throw new Exception($"Failed to send magic link: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send magic link to {Email}", email);
                throw;
            }
        }

        public async Task<object?> VerifyMagicLinkAsync(string accessToken, string refreshToken)
        {
            try
            {
                // Verify the token with Supabase
                var verifyPayload = new
                {
                    access_token = accessToken,
                    refresh_token = refreshToken
                };

                var json = JsonSerializer.Serialize(verifyPayload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("token?grant_type=refresh_token", content);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                    
                    if (tokenResponse.TryGetProperty("user", out var user) && 
                        tokenResponse.TryGetProperty("access_token", out var newAccessToken))
                    {
                        var userId = user.GetProperty("id").GetString();
                        var email = user.GetProperty("email").GetString();
                        
                        _logger.LogInformation("User authenticated: {Email} ({UserId})", email, userId);
                        
                        return new
                        {
                            user = new
                            {
                                id = userId,
                                email = email,
                                created_at = user.TryGetProperty("created_at", out var createdAt) ? createdAt.GetString() : DateTime.UtcNow.ToString("o")
                            },
                            access_token = newAccessToken.GetString(),
                            refresh_token = tokenResponse.TryGetProperty("refresh_token", out var newRefreshToken) ? newRefreshToken.GetString() : refreshToken
                        };
                    }
                }
                
                _logger.LogWarning("Failed to verify magic link token");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to verify magic link");
                return null;
            }
        }

        public string GenerateJwtToken(string userId, string email)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSecret);
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Email, email),
                    new Claim("user_id", userId)
                }),
                Expires = DateTime.UtcNow.AddDays(7), // Token valid for 7 days
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public ClaimsPrincipal? ValidateJwtToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtSecret);
                
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);
                
                var jwtToken = (JwtSecurityToken)validatedToken;
                var userId = jwtToken.Claims.First(x => x.Type == "user_id").Value;
                var email = jwtToken.Claims.First(x => x.Type == ClaimTypes.Email).Value;
                
                return new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Email, email),
                    new Claim("user_id", userId)
                }, "jwt"));
            }
            catch
            {
                return null;
            }
        }
    }
}
