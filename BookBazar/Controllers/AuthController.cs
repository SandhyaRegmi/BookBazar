using System.Security.Claims;
using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Model;
using BookBazar.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookBazar.Controllers
{
    [Route("auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly TokenService _tokenService;//token generate garna

        private readonly UserValidationService _validationService;

        public AuthController(ApplicationDbContext context, TokenService tokenService,UserValidationService validationService)
        {
            _context = context;
            _tokenService = tokenService;
             _validationService = validationService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDTO>> Register(RegisterDTO registerDto)
        {
             try
            {
                // Use the validation service
                var errors = await _validationService.ValidateRegistrationAsync(registerDto);

                if (errors.Count > 0)
                {
                    return BadRequest(new
                    {
                        message = "Validation failed",
                        errors
                    });
                }

                string role = "Member";
                if (!await _context.Users.AnyAsync())
                {
                    role = "Admin";
                }

                var user = new User
                {
                    Name = registerDto.Username,
                    Email = registerDto.Email,
                    PhoneNumber = registerDto.PhoneNumber,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    MembershipId = Guid.NewGuid(),
                    MembershipDate = DateTime.UtcNow,
                    Role = role,
                    SuccessfulOrders = 0,
                    HasActiveDiscount = false,
                    DiscountPercentage = 0
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();


                var token = _tokenService.GenerateJwtToken(user);

                return Ok(new
                {
                    Token = token,
                    User = new UserDTO
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
                    },
                    Message = "Registration successful"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred during registration",
                    error = ex.Message
                });
            }
        }


        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(LoginDTO loginDto)
        {
            try
            {
                var errors = new Dictionary<string, string>();

                if (string.IsNullOrWhiteSpace(loginDto.Username))
                    errors.Add("username", "Username is required");

                if (string.IsNullOrWhiteSpace(loginDto.Password))
                    errors.Add("password", "Password is required");

                if (errors.Count > 0)
                {
                    return BadRequest(new
                    {
                        message = "Validation failed",
                        errors
                    });
                }



                var user = await _context.Users.SingleOrDefaultAsync(u => u.Name == loginDto.Username);


                if (user == null)
                {
                    return Unauthorized(new
                    {
                        message = "Invalid username or password",
                        errors = new Dictionary<string, string> {
                    { "username", "Invalid credentials" },
                    { "password", "Invalid credentials" }
                }
                    });
                }


                if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                {
                    return Unauthorized(new
                    {
                        message = "Invalid username or password",
                        errors = new Dictionary<string, string> {
                    { "username", "Invalid credentials" },
                    { "password", "Invalid credentials" }
                }
                    });
                }

                var token = _tokenService.GenerateJwtToken(user);

                return Ok(new
                {
                    Token = token,
                    User = new UserDTO
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred during login",
                    error = ex.Message
                });
            }
        }


        [HttpGet("user-info")]
        [Authorize]
        public async Task<ActionResult<UserDTO>> GetUserInfo()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound("User not found");

            return Ok(new UserDTO
            {
                Id = user.UserId,
                Username = user.Name,
                Email = user.Email,
                Role = user.Role,
                MembershipId = user.MembershipId,
                MembershipDate = user.MembershipDate
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Clear the auth cookie
            Response.Cookies.Delete("authToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict
            });

            return Ok(new { message = "Logout successful" });
        }

    }
}
