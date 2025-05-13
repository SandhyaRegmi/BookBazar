using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Model;
using BookBazar.Service;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourseworkAD.Controllers
{
    [Route("auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly TokenServices _tokenService;

        public AuthController(ApplicationDbContext context, TokenServices tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        // POST: api/Auth/register
        [HttpPost("register")]
        public async Task<ActionResult<UserDTO>> Register(RegisterDTO registerDto)
        {
            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Name == registerDto.Username))
            {
                return BadRequest("Username is already taken");
            }

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                return BadRequest("Email is already registered");
            }

            // Create new user
            var user = new User
            {
                Name = registerDto.Username,
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                MembershipId = Guid.NewGuid(),
                MembershipDate = DateTime.UtcNow,
                Role = await _context.Users.AnyAsync() ? "Member" : "Admin"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Return user DTO with additional information
            return new UserDTO
            {
                Id = user.UserId,
                Username = user.Name,
                Email = user.Email,
                Role = user.Role,
                MembershipId = user.MembershipId,
                MembershipDate = user.MembershipDate,
                SuccessfulOrders = user.SuccessfulOrders,
                HasActiveDiscount = user.HasActiveDiscount,
                DiscountPercentage = user.DiscountPercentage
            };
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(LoginDTO loginDto)
        {
            try 
            {
                var user = await _context.Users.SingleOrDefaultAsync(u => u.Name == loginDto.Username);

                // Check if user exists
                if (user == null)
                {
                    return BadRequest(new { message = "Invalid username or password" });
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                {
                    return BadRequest(new { message = "Invalid username or password" });
                }

                // Generate JWT token
                var token = _tokenService.GenerateJwtToken(user);

                return Ok(new
                {
                    token = token,
                    user = new UserDTO
                    {
                        Id = user.UserId,
                        Username = user.Name,
                        Email = user.Email,
                        Role = user.Role,
                        MembershipId = user.MembershipId,
                        MembershipDate = user.MembershipDate,
                        SuccessfulOrders = user.SuccessfulOrders,
                        HasActiveDiscount = user.HasActiveDiscount,
                        DiscountPercentage = user.DiscountPercentage
                    }
                });
            }
            catch (Exception)
            {
                return BadRequest(new { message = "An error occurred during login" });
            }
        }
    }
}
