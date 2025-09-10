using Microsoft.AspNetCore.Mvc;
using ShowroomBackend.Models;
using ShowroomBackend.Services;

namespace ShowroomBackend.Controllers
{
    /// <summary>
    /// Public endpoints for showroom data - no authentication required
    /// </summary>
    [ApiController]
    [Route("api/showroom")]
    public class ShowroomController : ControllerBase
    {
        private readonly ISupabaseService _supabaseService;
        private readonly ILogger<ShowroomController> _logger;

        public ShowroomController(ISupabaseService supabaseService, ILogger<ShowroomController> logger)
        {
            _supabaseService = supabaseService;
            _logger = logger;
        }

        /// <summary>
        /// Get all published games for showroom display
        /// </summary>
        /// <returns>List of published games with public information</returns>
        [HttpGet("games")]
        public async Task<IActionResult> GetPublishedGames()
        {
            try
            {
                var games = await _supabaseService.GetPublishedGamesAsync();
                return Ok(games);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting published games");
                return StatusCode(500, new { error = "Failed to get published games" });
            }
        }

        /// <summary>
        /// Get a specific published game by ID
        /// </summary>
        /// <param name="id">Game ID</param>
        /// <returns>Game details or 404 if not found</returns>
        [HttpGet("games/{id}")]
        public async Task<IActionResult> GetPublishedGame(Guid id)
        {
            try
            {
                var game = await _supabaseService.GetPublishedGameByIdAsync(id);
                if (game == null)
                {
                    return NotFound(new { error = "Game not found" });
                }

                return Ok(game);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting published game {Id}", id);
                return StatusCode(500, new { error = "Failed to get game" });
            }
        }

        /// <summary>
        /// Get games by genre for filtering
        /// </summary>
        /// <param name="genre">Game genre</param>
        /// <returns>List of games in the specified genre</returns>
        [HttpGet("games/genre/{genre}")]
        public async Task<IActionResult> GetGamesByGenre(string genre)
        {
            try
            {
                var games = await _supabaseService.GetPublishedGamesByGenreAsync(genre);
                return Ok(games);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting games by genre {Genre}", genre);
                return StatusCode(500, new { error = "Failed to get games by genre" });
            }
        }

        /// <summary>
        /// Get games by publishing track
        /// </summary>
        /// <param name="track">Publishing track</param>
        /// <returns>List of games in the specified track</returns>
        [HttpGet("games/track/{track}")]
        public async Task<IActionResult> GetGamesByTrack(string track)
        {
            try
            {
                var games = await _supabaseService.GetPublishedGamesByTrackAsync(track);
                return Ok(games);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting games by track {Track}", track);
                return StatusCode(500, new { error = "Failed to get games by track" });
            }
        }

        /// <summary>
        /// Search games by name or description
        /// </summary>
        /// <param name="query">Search query</param>
        /// <returns>List of matching games</returns>
        [HttpGet("games/search")]
        public async Task<IActionResult> SearchGames([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest(new { error = "Search query is required" });
                }

                var games = await _supabaseService.SearchPublishedGamesAsync(query);
                return Ok(games);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching games with query {Query}", query);
                return StatusCode(500, new { error = "Failed to search games" });
            }
        }

        /// <summary>
        /// Get featured games (for homepage/showcase)
        /// </summary>
        /// <returns>List of featured games</returns>
        [HttpGet("games/featured")]
        public async Task<IActionResult> GetFeaturedGames()
        {
            try
            {
                var games = await _supabaseService.GetFeaturedGamesAsync();
                return Ok(games);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting featured games");
                return StatusCode(500, new { error = "Failed to get featured games" });
            }
        }
    }
}
