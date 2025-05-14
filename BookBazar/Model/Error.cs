namespace BookBazar.Model;

public class Error
{
    public string? RequestId { get; set; }
    public string? Message { get; set; }
    public int StatusCode { get; set; }
    public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
}