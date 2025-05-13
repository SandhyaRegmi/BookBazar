using System.ComponentModel.DataAnnotations;

namespace BookBazar.DTO.Request;

public class BooksDTO
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(13)]
    public string ISBN { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Language { get; set; } = string.Empty;

    [Required]
    public string Format { get; set; } = string.Empty;

    [Required]
    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Required]
    public DateTime PublicationDate { get; set; }

    [Required]
    public string Author { get; set; } = string.Empty;

    // Add this property
    [Required]
    public string Publisher { get; set; } = string.Empty;

[Required]
    public string Categories { get; set; } = string.Empty;

    [Required]
    public string Genre { get; set; } = string.Empty;

    // Change the Image property to be optional
    [Required(ErrorMessage = "Image is required for new books")]
    public IFormFile? Image { get; set; } 

    public bool IsAvailableInLibrary { get; set; } = true;
}