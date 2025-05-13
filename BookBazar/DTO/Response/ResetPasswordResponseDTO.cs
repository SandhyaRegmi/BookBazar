using System;

namespace BookBazar.DTO.Response;

public class ResetPasswordResponseDTO
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public string ResetToken { get; set; }
}
