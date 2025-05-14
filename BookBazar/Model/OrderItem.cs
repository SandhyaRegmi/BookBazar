using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookBazar.Model;

[Table("OrderItems")]
public class OrderItem
{
    [Key]
    public Guid OrderItemId { get; set; }

    [Required]
    public Guid OrderId { get; set; }

    [Required]
    public Guid BookId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PriceAtTime { get; set; }

    [ForeignKey("OrderId")]
    public Order? Order { get; set; }

    [ForeignKey("BookId")]
    public Books? Book { get; set; }
}