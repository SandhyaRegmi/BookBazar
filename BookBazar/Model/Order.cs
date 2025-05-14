using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookBazar.Model;

[Table("Orders")]
public class Order
{
    [Key]
    public Guid OrderId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public string Status { get; set; } = "Pending";

    [Required]
    [StringLength(10)]
    public string ClaimCode { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [Required]
    public bool IsCompleted { get; set; } = false;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}