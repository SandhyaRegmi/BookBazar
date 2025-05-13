using System;

namespace BookBazar.DTO.Request;

public class VerifyResetCodeDTO
{
    public string Email { get; set; }
    public string Code { get; set; }
}
