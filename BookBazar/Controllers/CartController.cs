using System;
using System.Security.Claims;
using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookBazar.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Adds a book to the user's shopping cart or updates quantity if already exists
    [HttpPost("add")]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> AddToCart([FromBody] CartAddDTO request)
    {
        try
        {
            var userId = GetUserId();

            var existing = await _context.CartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.BookId == request.BookId);

            if (existing != null)
            {
                existing.Quantity += request.Quantity;
            }
            else
            {
                _context.CartItems.Add(new CartItems
                {
                    CartItemId = Guid.NewGuid(),
                    UserId = userId,
                    BookId = request.BookId,
                    Quantity = request.Quantity
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Book added to cart" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($" Error adding to cart: {ex.Message}");
            return StatusCode(500, new { message = "Internal Server Error", error = ex.Message });
        }
    }

    // Retrieves all items in the user's shopping cart with book details
    [HttpGet]
    [Authorize(Roles = "Member")]
    public async Task<ActionResult<IEnumerable<CartItems>>> GetCart()
    {
        var userId = GetUserId();
        var items = await _context.CartItems
            .Include(c => c.Book)
            .Where(c => c.UserId == userId)
            .ToListAsync();

        return Ok(items);
    }

    // Updates the quantity of a cart item or removes it if quantity is zero
    [HttpPut("update")]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> UpdateCartItem([FromBody] CartUpdateDTO request)
    {
        try
        {
            var userId = GetUserId();
            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(c => c.CartItemId == request.CartItemId && c.UserId == userId);

            if (cartItem == null)
                return NotFound(new { message = "Cart item not found" });

            if (request.Quantity <= 0)
            {
                _context.CartItems.Remove(cartItem);
            }
            else
            {
                cartItem.Quantity = request.Quantity;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cart updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update cart", error = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var idClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (idClaim == null)
        {
            throw new Exception("JWT is missing user identifier claim");
        }
        return Guid.Parse(idClaim.Value);
    }
}

