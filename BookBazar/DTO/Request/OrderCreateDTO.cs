namespace BookBazar.DTO.Request;

public class OrderCreateDTO
{
    public List<OrderItemDTO> Items { get; set; } = new();
}

public class OrderItemDTO
{
    public Guid BookId { get; set; }
    public int Quantity { get; set; }
}