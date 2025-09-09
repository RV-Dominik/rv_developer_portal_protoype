using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShowroomBackend.Models;
using ShowroomBackend.Models.DTOs;
using ShowroomBackend.Services;
using System.Security.Claims;

namespace ShowroomBackend.Controllers
{
    [ApiController]
    [Route("api/org")]
    [Authorize]
    public class OrganizationController : ControllerBase
    {
        private readonly ISupabaseService _supabaseService;
        private readonly ILogger<OrganizationController> _logger;

        public OrganizationController(ISupabaseService supabaseService, ILogger<OrganizationController> logger)
        {
            _supabaseService = supabaseService;
            _logger = logger;
        }

        [HttpGet("me")]
        public async Task<ActionResult<Organization>> GetMyOrganization()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var organization = await _supabaseService.GetUserOrganizationAsync(userId);
                if (organization == null)
                {
                    return NotFound("No organization found for this user");
                }

                return Ok(organization);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user organization");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Organization>> CreateOrUpdateOrganization([FromBody] OrganizationCreateDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var organization = new Organization
                {
                    Name = dto.Name,
                    Website = dto.Website,
                    PrimaryContactName = dto.PrimaryContactName,
                    PrimaryContactEmail = dto.PrimaryContactEmail,
                    PrimaryContactPhone = dto.PrimaryContactPhone,
                    Description = dto.Description,
                    Industry = dto.Industry,
                    CompanySize = dto.CompanySize,
                    Country = dto.Country,
                    IsVerified = false
                };

                var result = await _supabaseService.CreateOrUpdateUserOrganizationAsync(userId, organization);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating/updating organization");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Organization>> UpdateOrganization(Guid id, [FromBody] OrganizationUpdateDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                // Verify the organization belongs to this user
                var existingOrg = await _supabaseService.GetUserOrganizationAsync(userId);
                if (existingOrg == null || existingOrg.Id != id)
                {
                    return NotFound("Organization not found or access denied");
                }

                // Update only provided fields
                if (dto.Name != null) existingOrg.Name = dto.Name;
                if (dto.Website != null) existingOrg.Website = dto.Website;
                if (dto.PrimaryContactName != null) existingOrg.PrimaryContactName = dto.PrimaryContactName;
                if (dto.PrimaryContactEmail != null) existingOrg.PrimaryContactEmail = dto.PrimaryContactEmail;
                if (dto.PrimaryContactPhone != null) existingOrg.PrimaryContactPhone = dto.PrimaryContactPhone;
                if (dto.Description != null) existingOrg.Description = dto.Description;
                if (dto.Industry != null) existingOrg.Industry = dto.Industry;
                if (dto.CompanySize != null) existingOrg.CompanySize = dto.CompanySize;
                if (dto.Country != null) existingOrg.Country = dto.Country;

                var result = await _supabaseService.UpdateOrganizationAsync(existingOrg);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating organization");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
