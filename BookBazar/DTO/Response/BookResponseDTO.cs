namespace BookBazar.DTO.Response;

public class BookResponseDTO
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ISBN { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public DateTime PublicationDate { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsAvailableInLibrary { get; set; }
    public string Author { get; set; } = string.Empty;
    public string Categories { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public byte[] ImageData { get; set; } = Array.Empty<byte>();
    public string ImageContentType { get; set; } = string.Empty;
    public bool IsAwardWinner { get; set; }
}