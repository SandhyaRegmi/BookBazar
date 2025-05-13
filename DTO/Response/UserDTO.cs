using System;

namespace BookBazar.DTO.Response;

public class UserDTO
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid MembershipId { get; set; }
    public DateTime MembershipDate { get; set; }
    public int SuccessfulOrders { get; set; }
    public bool HasActiveDiscount { get; set; }
    public decimal DiscountPercentage { get; set; }
}
