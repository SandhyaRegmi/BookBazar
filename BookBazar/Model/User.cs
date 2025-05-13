using System;
using System.ComponentModel.DataAnnotations;

namespace BookBazar.Model;

public class User
{

    [Key]
    public Guid UserId { get; set; }

    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;
    [Required]
    public string Role { get; set; } = "Member";

    [Required]
    public Guid MembershipId { get; set; }

    public DateTime MembershipDate { get; set; } = DateTime.UtcNow;

    public int SuccessfulOrders { get; set; } = 0;

    public bool HasActiveDiscount { get; set; } = false;

    public decimal DiscountPercentage { get; set; } = 0;

    public string? ResetCode { get; set; }
    public DateTime? ResetCodeExpiry { get; set; }
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}
