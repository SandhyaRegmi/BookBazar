/*
 * Provides administrative functionality for the BookBazar platform.
 * Restricted to users with Admin role, this controller handles system-wide
 * management operations including user management and system monitoring.
 */

using BookBazar.Data;
using BookBazar.DTO.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookBazar.Controllers
{
    [Route("api/admin")]
    [ApiController]
    // only admin can access these routes
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Retrieves a list of all registered users with their membership details
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetAllUsers()
        {
            // fetch users and convert to DTO
            var users = await _context.Users
                .Select(u => new UserDTO
                {
                    Id = u.UserId,
                    Username = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    MembershipId = u.MembershipId,
                    MembershipDate = u.MembershipDate
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}