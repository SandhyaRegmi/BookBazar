using System;

namespace BookBazar.DTO.Request;

public class ResetPasswordDTO
{
    public string Email { get; set; }
    public string ResetToken { get; set; }
    public string NewPassword { get; set; }
}
