using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookBazar.Model;

public class CartItems
{
    [Key]
    public Guid CartItemId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid BookId { get; set; }

    [Required]
    public int Quantity { get; set; } = 1;

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [ForeignKey("BookId")]
    public Books? Book { get; set; }
}
