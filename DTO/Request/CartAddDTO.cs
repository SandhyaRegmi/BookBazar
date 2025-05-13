using System.ComponentModel.DataAnnotations;

namespace BookBazar.DTO.Request;

public class CartAddDTO
{
    [Required]
    public Guid BookId { get; set; }

    public int Quantity { get; set; } = 1;
}
