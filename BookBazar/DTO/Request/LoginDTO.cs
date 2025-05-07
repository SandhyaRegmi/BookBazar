using System;
using System.ComponentModel.DataAnnotations;

namespace BookBazar.DTO.Request;

public class LoginDTO
{
[Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

}
