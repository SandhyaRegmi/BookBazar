using System;
using BookBazar.Data;
using BookBazar.DTO.Response;
using BookBazar.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BookBazar.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookmarkController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BookmarkController> _logger;

    public BookmarkController(ApplicationDbContext context, ILogger<BookmarkController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            _logger.LogWarning("Invalid or missing user ID claim");
            return null;
        }
        return userId;
    }

    // GET only bookmark IDs
    [HttpGet("ids")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Guid>>> GetBookmarkIds()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { error = "Unauthorized" });

        try
        {
            var bookmarkIds = await _context.Bookmarks
                .Where(b => b.UserId == userId.Value)
                .Select(b => b.BookId)
                .ToListAsync();

            return Ok(bookmarkIds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching bookmark IDs");
            return StatusCode(500, new { error = "Failed to fetch bookmark IDs" });
        }
    }

    // Toggle bookmark on/off
    [HttpPost("{bookId}")]
    [Authorize]
    public async Task<IActionResult> ToggleBookmark(Guid bookId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { error = "Unauthorized" });

        try
        {
            var book = await _context.Books.FindAsync(bookId);
            if (book == null)
                return NotFound(new { error = "Book not found" });

            var existing = await _context.Bookmarks
                .FirstOrDefaultAsync(b => b.UserId == userId.Value && b.BookId == bookId);

            if (existing != null)
            {
                _context.Bookmarks.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Bookmark removed", isBookmarked = false });
            }

            var bookmark = new Bookmark
            {
                BookmarkId = Guid.NewGuid(),
                UserId = userId.Value,
                BookId = bookId
            };

            await _context.Bookmarks.AddAsync(bookmark);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Book bookmarked", isBookmarked = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling bookmark for bookId: {BookId}", bookId);
            return StatusCode(500, new { error = "Failed to toggle bookmark" });
        }
    }

    // Get full bookmarked book details
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BookResponseDTO>>> GetBookmarks()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var bookmarks = await _context.Bookmarks
                .Include(b => b.Book)
                .Where(b => b.UserId == userId.Value && b.Book != null)
                .Select(b => new BookResponseDTO
                {
                    BookId = b.Book!.BookId,
                    Title = b.Book.Title,
                    ISBN = b.Book.ISBN,
                    Description = b.Book.Description,
                    Language = b.Book.Language,
                    Format = b.Book.Format,
                    Price = b.Book.Price,
                    Stock = b.Book.Stock,
                    PublicationDate = b.Book.PublicationDate,
                    IsAvailable = b.Book.IsAvailable,
                    Author = b.Book.Author,
                    Categories = b.Book.Categories,
                    Genre = b.Book.Genre
                })
                .ToListAsync();

            return Ok(bookmarks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching bookmarks");
            return StatusCode(500, new { error = "Failed to fetch bookmarks" });
        }
    }
}