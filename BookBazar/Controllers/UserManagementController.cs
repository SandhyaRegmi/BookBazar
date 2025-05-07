using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookBazar.Service;

namespace BookBazar.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "RequireAdminRole")]
    public class UserManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserValidationService _validationService;

        public UserManagementController(ApplicationDbContext context, UserValidationService validationService)
        {
            _context = context;
            _validationService = validationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetUsers()
        {
            var users = await _context.Users
                .Where(u => u.Role != "Admin")
                .Select(u => new UserDTO
                {
                    Id = u.UserId,
                    Username = u.Name,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role,
                    MembershipId = u.MembershipId,
                    MembershipDate = u.MembershipDate,
                    SuccessfulOrders = u.SuccessfulOrders,
                    HasActiveDiscount = u.HasActiveDiscount,
                    DiscountPercentage = u.DiscountPercentage
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDTO>> GetUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            return new UserDTO
            {
                Id = user.UserId,
                Username = user.Name,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                MembershipId = user.MembershipId,
                MembershipDate = user.MembershipDate,
                SuccessfulOrders = user.SuccessfulOrders,
                HasActiveDiscount = user.HasActiveDiscount,
                DiscountPercentage = user.DiscountPercentage
            };
        }

        [HttpPost]
        public async Task<ActionResult<UserDTO>> CreateUser(RegisterDTO registerDto)
        {
            try
            {
                var errors = await _validationService.ValidateRegistrationAsync(registerDto);
                if (errors.Count > 0)
                {
                    return BadRequest(new { message = "Validation failed", errors });
                }

                if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                var user = new User
                {
                    Name = registerDto.Username,
                    Email = registerDto.Email,
                    PhoneNumber = registerDto.PhoneNumber,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    MembershipId = Guid.NewGuid(),
                    MembershipDate = DateTime.UtcNow,
                    Role = "Member", // Default role for new users
                    SuccessfulOrders = 0,
                    HasActiveDiscount = false,
                    DiscountPercentage = 0
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetUser), new { id = user.UserId },
                    new UserDTO
                    {
                        Id = user.UserId,
                        Username = user.Name,
                        Email = user.Email,
                        PhoneNumber = user.PhoneNumber,
                        Role = user.Role,
                        MembershipId = user.MembershipId,
                        MembershipDate = user.MembershipDate,
                        SuccessfulOrders = user.SuccessfulOrders,
                        HasActiveDiscount = user.HasActiveDiscount,
                        DiscountPercentage = user.DiscountPercentage
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the user", error = ex.Message });
            }
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, UpdateUserDTO updateDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (user.Role == "Admin")
            {
                return BadRequest(new { message = "Cannot modify admin user" });
            }

            user.Name = updateDto.Username;
            user.Email = updateDto.Email;
            user.PhoneNumber = updateDto.PhoneNumber;
            user.Role = updateDto.Role;

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
                {
                    return NotFound();
                }
                throw;
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (user.Role == "Admin")
            {
                return BadRequest(new { message = "Cannot delete admin user" });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(Guid id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }
    }
}