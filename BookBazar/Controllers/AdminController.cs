using BookBazar.Data;
using BookBazar.DTO.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookBazar.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetAllUsers()
        {
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