using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookBazar.Model;

[Table("Books")]
public class Books
{
    [Key]
    public Guid BookId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(13)]
    public string ISBN { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Language { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Format { get; set; } = string.Empty;

    [Required]
    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Required]
    public DateTime PublicationDate
    {
        get => _publicationDate;
        set => _publicationDate = DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }
    private DateTime _publicationDate;

    public bool IsAvailable { get; set; } = true;

    public bool IsAvailableInLibrary { get; set; } = true;

    [Required]
    [StringLength(100)]
    public string Author { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Categories { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Genre { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Publisher { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public byte[]? ImageData { get; set; }
    public string? ImageContentType { get; set; }

    public int SalesCount { get; set; }
    public bool IsAwardWinner { get; set; } = false;
    public decimal DiscountPercentage { get; set; }
    public decimal? DiscountedPrice { get; set; }
    public bool IsOnSale { get; set; }
    public DateTime? DiscountStart { get; set; }
    public DateTime? DiscountEnd { get; set; }

    public double? Rating { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}