/*
 * Handles all order-related operations including creation, retrieval, and management of orders.
 * Provides functionality for users to place orders, view their order history, and manage their purchases.
 * Includes features for order tracking, claim code generation, and cart integration.
 */

using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BookBazar.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrderController> _logger;

    public OrderController(ApplicationDbContext context, ILogger<OrderController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Creates a new order from cart items and generates a claim code
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDTO request)
    {
        try
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var bookIds = request.Items.Select(i => i.BookId).ToList();
            var books = await _context.Books
                .Where(b => bookIds.Contains(b.BookId))
                .ToListAsync();

            if (books.Count != bookIds.Count)
                return BadRequest(new { message = "One or more books not found" });

            var order = new Order
            {
                OrderId = Guid.NewGuid(),
                UserId = userId.Value,
                CreatedAt = DateTime.UtcNow,
                Status = "Pending",
                ClaimCode = GenerateClaimCode()
            };

            decimal totalPrice = 0;
            foreach (var item in request.Items)
            {
                var book = books.First(b => b.BookId == item.BookId);
                var effectivePrice = GetEffectivePrice(book);
                var orderItem = new OrderItem
                {
                    OrderItemId = Guid.NewGuid(),
                    OrderId = order.OrderId,
                    BookId = item.BookId,
                    Quantity = item.Quantity,
                    PriceAtTime = effectivePrice
                };
                
                totalPrice += effectivePrice * item.Quantity;
                order.OrderItems.Add(orderItem);
            }

            order.TotalAmount = totalPrice;

            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();

            var cartItems = await _context.CartItems
                .Where(c => c.UserId == userId)
                .ToListAsync();
            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync();

            return Ok(new { orderId = order.OrderId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(500, new { message = "Failed to create order" });
        }
    }

    // Retrieves detailed information about a specific order
    [HttpGet("{orderId}")]
    [Authorize]
    public async Task<IActionResult> GetOrder(Guid orderId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

        if (order == null)
            return NotFound(new { message = "Order not found" });

        var response = new
        {
            order.OrderId,
            UserName = order.User?.Name,
            order.ClaimCode,
            Items = order.OrderItems.Select(oi => new
            {
                oi.Book?.Title,
                Price = oi.PriceAtTime,
                oi.Quantity,
                Total = oi.PriceAtTime * oi.Quantity
            }),
            TotalPrice = order.TotalAmount,
            order.CreatedAt
        };

        return Ok(response);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId) 
            ? userId 
            : null;
    }

    private decimal GetEffectivePrice(Books book)
    {
        if (book.IsOnSale &&
            book.DiscountStart.HasValue &&
            book.DiscountEnd.HasValue &&
            book.DiscountedPrice.HasValue &&
            book.DiscountStart.Value <= DateTime.UtcNow &&
            book.DiscountEnd.Value >= DateTime.UtcNow)
        {
            return book.DiscountedPrice.Value;
        }

        return book.Price;
    }

    private string GenerateClaimCode(int length = 6)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    // Retrieves order history for the authenticated user
    [HttpGet("my-orders")]
    [Authorize]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not found or not authenticated." });

        try
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId.Value)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new 
                {
                    o.OrderId,
                    o.CreatedAt,
                    o.Status,
                    o.TotalAmount,
                    o.ClaimCode,
                    IsCompleted = o.IsCompleted,
                    Items = o.OrderItems.Select(oi => new
                    {
                        BookTitle = oi.Book != null ? oi.Book.Title : "Book name not available",
                        oi.Quantity,
                        oi.PriceAtTime,
                        ItemTotal = oi.Quantity * oi.PriceAtTime
                    }).ToList()
                })
                .ToListAsync();

            if (orders == null || !orders.Any())
            {
                return Ok(new List<object>());
            }

            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while retrieving your orders." });
        }
    }
}