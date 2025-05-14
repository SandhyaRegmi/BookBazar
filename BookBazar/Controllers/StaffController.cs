using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Model;
using BookBazar.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace BookBazar.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Staff")]
public class StaffController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StaffController> _logger;
    private readonly IEmailService _emailService;

    public StaffController(ApplicationDbContext context, ILogger<StaffController> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    [HttpGet("incomplete-orders")]
    public async Task<IActionResult> GetIncompleteOrders()
    {
        try
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .Where(o => !o.IsCompleted)
                .Select(o => new OrderResponseDTO
                {
                    OrderId = o.OrderId,
                    UserName = o.User != null ? o.User.Name : "Unknown",
                    UserEmail = o.User != null ? o.User.Email : "No email",
                    CreatedAt = o.CreatedAt,
                    IsCompleted = o.IsCompleted,
                    ClaimCode = o.ClaimCode,
                    Items = o.OrderItems.Select(oi => new OrderItemResponseDTO
                    {
                        BookTitle = oi.Book != null ? oi.Book.Title : "Unknown Book",
                        Price = oi.PriceAtTime,
                        Quantity = oi.Quantity
                    }).ToList()
                })
                .ToListAsync();

            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting incomplete orders");
            return StatusCode(500, new { message = "Failed to retrieve orders" });
        }
    }

    [HttpPost("confirm-order")]
    public async Task<IActionResult> ConfirmOrder([FromBody] ConfirmOrderDTO request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ClaimCode))
                return BadRequest(new { message = "Claim code is required" });

            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

            if (order == null)
                return NotFound(new { message = "Order not found" });

            if (order.IsCompleted)
                return BadRequest(new { message = "Order is already completed" });

            if (!string.Equals(order.ClaimCode?.Trim(), request.ClaimCode.Trim(),
                StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Incorrect claim code" });

            order.IsCompleted = true;
            await _context.SaveChangesAsync();

            if (order.User != null && !string.IsNullOrEmpty(order.User.Email))
            {
                try
                {
                    string subject = $"Your BookBazar Order {order.OrderId} Confirmed!";
                    string body = BuildOrderConfirmationEmailBody(order);
                    await _emailService.SendEmailAsync(order.User.Email, subject, body);
                    _logger.LogInformation("Confirmation email sent for Order ID: {OrderId} to {UserEmail}", order.OrderId, order.User.Email);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send confirmation email for Order ID: {OrderId}", order.OrderId);
                }
            }
            else
            {
                _logger.LogWarning("Cannot send confirmation email for Order ID: {OrderId} because user or email is missing.", order.OrderId);
            }

            return Ok(new { message = "Order successfully confirmed!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming order");
            return StatusCode(500, new { message = "Failed to confirm order" });
        }
    }

    private string BuildOrderConfirmationEmailBody(Order order)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<html><body>");
        sb.AppendLine($"<h1>Thank you for your order, {order.User?.Name ?? "Customer"}!</h1>");
        sb.AppendLine($"<p>Your order with ID: <strong>{order.OrderId}</strong> has been confirmed and is ready for pickup.</p>");
        sb.AppendLine($"<p>Please present the following claim code: <strong>{order.ClaimCode}</strong></p>");
        sb.AppendLine("<h2>Order Details:</h2>");
        sb.AppendLine("<table border='1' cellpadding='5' style='border-collapse: collapse;'>");
        sb.AppendLine("<tr><th>Book Title</th><th>Quantity</th><th>Price</th><th>Total</th></tr>");
        foreach (var item in order.OrderItems)
        {
            sb.AppendLine($"<tr><td>{item.Book?.Title ?? "N/A"}</td><td>{item.Quantity}</td><td>${item.PriceAtTime:F2}</td><td>${(item.Quantity * item.PriceAtTime):F2}</td></tr>");
        }
        sb.AppendLine("</table>");
        sb.AppendLine($"<h3>Total Amount: ${order.TotalAmount:F2}</h3>");
        sb.AppendLine("<p>Thank you for shopping with BookBazar!</p>");
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }
}