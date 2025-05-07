using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BookBazar.Model;
using Microsoft.IdentityModel.Tokens;

namespace BookBazar.Service;

public class TokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "YourKeyHere";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "BookBazar";
        var audience = _configuration["JwtSettings:Audience"] ?? "BookBazarUsers";
        var expiryInDays = int.Parse(_configuration["JwtSettings:ExpiryInDays"] ?? "1");

        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secret));

        var claims = new[]
        {
                             new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Name),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                    };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
                    issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(expiryInDays),
                signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateJwtToken(User user)
    {
        return GenerateToken(user);
    }
}
