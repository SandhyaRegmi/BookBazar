using System.ComponentModel.DataAnnotations;

namespace BookBazar.DTO.Request;

public class CartUpdateDTO
{
    [Required]
    public Guid CartItemId { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }
}