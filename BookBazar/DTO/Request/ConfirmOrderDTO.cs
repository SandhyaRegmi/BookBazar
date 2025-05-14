namespace BookBazar.DTO.Request;

public class ConfirmOrderDTO
{
    public Guid OrderId { get; set; }
    public string ClaimCode { get; set; }
}