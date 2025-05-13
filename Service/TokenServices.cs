using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BookBazar.Model;
using Microsoft.IdentityModel.Tokens;

namespace BookBazar.Service;

public class TokenServices
{
    private readonly IConfiguration _configuration;

    public TokenServices(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "YourKeyHere";
        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secret));

        var claims = new[]
        {
            new Claim("id", user.UserId.ToString()),  // Changed back to "id" to match frontend
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
                  claims: claims,
                  expires: DateTime.UtcNow.AddDays(1),
                  signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateJwtToken(User user)
    {
        return GenerateToken(user); 
    }
}
