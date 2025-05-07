using BookBazar.Data;
using BookBazar.DTO.Request;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BookBazar.Service
{
    public class UserValidationService
    {
        private readonly ApplicationDbContext _context;

        public UserValidationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<string>> ValidateRegistrationAsync(RegisterDTO registerDto)
        {
            var errors = new List<string>();

            // Validate username
            if (string.IsNullOrWhiteSpace(registerDto.Username))
            {
                errors.Add("Username is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Name == registerDto.Username))
            {
                errors.Add("Username is already taken");
            }

            // Validate email
            if (string.IsNullOrWhiteSpace(registerDto.Email))
            {
                errors.Add("Email is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                errors.Add("Email is already registered");
            }

            // Validate password
            if (string.IsNullOrWhiteSpace(registerDto.Password))
            {
                errors.Add("Password is required");
            }
            else if (registerDto.Password.Length < 6)
            {
                errors.Add("Password must be at least 6 characters long");
            }

            // Validate password confirmation
            if (registerDto.Password != registerDto.ConfirmPassword)
            {
                errors.Add("Passwords do not match");
            }

            // Validate phone number
            if (string.IsNullOrWhiteSpace(registerDto.PhoneNumber))
            {
                errors.Add("Phone number is required");
            }
            else if (await _context.Users.AnyAsync(u => u.PhoneNumber == registerDto.PhoneNumber))
            {
                errors.Add("Phone number is already registered");
            }

            return errors;
        }

        public async Task<List<string>> ValidateUpdateAsync(Guid userId, UpdateUserDTO updateDto)
        {
            var errors = new List<string>();

            // Validate username
            if (string.IsNullOrWhiteSpace(updateDto.Username))
            {
                errors.Add("Username is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Name == updateDto.Username && u.UserId != userId))
            {
                errors.Add("Username is already taken");
            }

            // Validate email
            if (string.IsNullOrWhiteSpace(updateDto.Email))
            {
                errors.Add("Email is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Email == updateDto.Email && u.UserId != userId))
            {
                errors.Add("Email is already registered");
            }

            // Validate phone number
            if (string.IsNullOrWhiteSpace(updateDto.PhoneNumber))
            {
                errors.Add("Phone number is required");
            }
            else if (await _context.Users.AnyAsync(u => u.PhoneNumber == updateDto.PhoneNumber && u.UserId != userId))
            {
                errors.Add("Phone number is already registered");
            }

            // Validate role
            if (string.IsNullOrWhiteSpace(updateDto.Role))
            {
                errors.Add("Role is required");
            }
            else if (updateDto.Role != "Member" && updateDto.Role != "Staff")
            {
                errors.Add("Invalid role specified");
            }

            return errors;
        }
    }
}