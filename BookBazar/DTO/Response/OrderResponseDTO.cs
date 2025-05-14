namespace BookBazar.DTO.Response;

public class OrderResponseDTO
{
    public Guid OrderId { get; set; }
    public string UserName { get; set; }
    public string UserEmail { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsCompleted { get; set; }
    public string ClaimCode { get; set; }
    public List<OrderItemResponseDTO> Items { get; set; }
}

public class OrderItemResponseDTO
{
    public string BookTitle { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}