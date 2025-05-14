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

        /* Validates new user registration data and returns a list of validation errors */
        public async Task<List<string>> ValidateRegistrationAsync(RegisterDTO registerDto)
        {
            var errors = new List<string>();

            /* Check if username meets requirements and is unique */
            if (string.IsNullOrWhiteSpace(registerDto.Username))
            {
                errors.Add("Username is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Name == registerDto.Username))
            {
                errors.Add("Username is already taken");
            }

            /* Ensure email is provided and not already registered */
            if (string.IsNullOrWhiteSpace(registerDto.Email))
            {
                errors.Add("Email is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                errors.Add("Email is already registered");
            }

            /* Verify password meets minimum security requirements */
            if (string.IsNullOrWhiteSpace(registerDto.Password))
            {
                errors.Add("Password is required");
            }
            else if (registerDto.Password.Length < 6)
            {
                errors.Add("Password must be at least 6 characters long");
            }

            /* Ensure password confirmation matches */
            if (registerDto.Password != registerDto.ConfirmPassword)
            {
                errors.Add("Passwords do not match");
            }

            /* Validate phone number uniqueness */
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

        /* Validates user profile update data and returns a list of validation errors */
        public async Task<List<string>> ValidateUpdateAsync(Guid userId, UpdateUserDTO updateDto)
        {
            var errors = new List<string>();

            /* Verify username uniqueness excluding current user */
            if (string.IsNullOrWhiteSpace(updateDto.Username))
            {
                errors.Add("Username is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Name == updateDto.Username && u.UserId != userId))
            {
                errors.Add("Username is already taken");
            }

            /* Check email uniqueness excluding current user */
            if (string.IsNullOrWhiteSpace(updateDto.Email))
            {
                errors.Add("Email is required");
            }
            else if (await _context.Users.AnyAsync(u => u.Email == updateDto.Email && u.UserId != userId))
            {
                errors.Add("Email is already registered");
            }

            /* Validate phone number uniqueness excluding current user */
            if (string.IsNullOrWhiteSpace(updateDto.PhoneNumber))
            {
                errors.Add("Phone number is required");
            }
            else if (await _context.Users.AnyAsync(u => u.PhoneNumber == updateDto.PhoneNumber && u.UserId != userId))
            {
                errors.Add("Phone number is already registered");
            }

            /* Ensure role assignment is valid */
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