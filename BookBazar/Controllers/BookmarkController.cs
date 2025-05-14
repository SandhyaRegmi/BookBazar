using System;
using BookBazar.Data;
using BookBazar.DTO.Response;
using BookBazar.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

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

    [HttpGet]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> GetBookmarkedBooks()
    {
        try
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { error = "User not authenticated" });

            var bookmarkedBooks = await _context.Bookmarks
                .Where(b => b.UserId == userId.Value)
                .Join(_context.Books,
                    bookmark => bookmark.BookId,
                    book => book.BookId,
                    (bookmark, book) => book)
                .ToListAsync();

            return Ok(bookmarkedBooks);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error in GetBookmarkedBooks: {ex.Message}");
            return StatusCode(500, new { error = "Failed to fetch bookmarked books" });
        }
    }

    [HttpPost("{bookId}")]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> ToggleBookmark(Guid bookId)
    {
        try
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { error = "User not authenticated" });

            // Verify book exists
            var book = await _context.Books.FindAsync(bookId);
            if (book == null)
                return NotFound(new { error = "Book not found" });

            // Check if bookmark exists using tracking query
            var bookmark = await _context.Bookmarks
                .FirstOrDefaultAsync(b => b.UserId == userId.Value && b.BookId == bookId);

            if (bookmark != null)
            {
                // Remove existing bookmark
                _context.Bookmarks.Remove(bookmark);
                await _context.SaveChangesAsync();
                return Ok(new { isBookmarked = false });
            }

            // Create new bookmark with only required fields
            var newBookmark = new Bookmark
            {
                BookmarkId = Guid.NewGuid(),
                UserId = userId.Value,
                BookId = bookId
            };

            await _context.Bookmarks.AddAsync(newBookmark);
            await _context.SaveChangesAsync();

            return Ok(new { isBookmarked = true });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error in ToggleBookmark: {ex.Message}");
            return StatusCode(500, new { error = "Failed to toggle bookmark" });
        }
    }

    [HttpGet("ids")]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> GetBookmarkIds()
    {
        try
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { error = "User not authenticated" });

            var bookmarkIds = await _context.Bookmarks
                .Where(b => b.UserId == userId.Value)
                .Select(b => b.BookId)
                .ToListAsync();

            return Ok(bookmarkIds);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error in GetBookmarkIds: {ex.Message}");
            return StatusCode(500, new { error = "Failed to fetch bookmark IDs" });
        }
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId)
            ? userId
            : null;
    }
}