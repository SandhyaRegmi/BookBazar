using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response; 
using BookBazar.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourseworkAD.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BookController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Book
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookResponseDTO>>> GetBooks()
    {
        var books = await _context.Books.ToListAsync();
        return books.Select(b => new BookResponseDTO
        {
            BookId = b.BookId,
            Title = b.Title,
            ISBN = b.ISBN,
            Description = b.Description,
            Language = b.Language,
            Format = b.Format,
            Price = b.Price,
            Stock = b.Stock,
            PublicationDate = b.PublicationDate,
            IsAvailable = b.IsAvailable,
            Author = b.Author,
            Categories = b.Categories,
            Genre = b.Genre
        }).ToList();
    }

    // GET: api/Book/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Books>> GetBook(Guid id)
    {
        var book = await _context.Books.FindAsync(id);

        if (book == null)
        {
            return NotFound();
        }

        return book;
    }

    // POST: api/Book
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BookResponseDTO>> CreateBook(BooksDTO bookDto)
    {
        var book = new Books
        {
            Title = bookDto.Title,
            ISBN = bookDto.ISBN,
            Description = bookDto.Description,
            Language = bookDto.Language,
            Format = bookDto.Format,
            Price = bookDto.Price,
            Stock = bookDto.Stock,
            PublicationDate = DateTime.SpecifyKind(bookDto.PublicationDate, DateTimeKind.Utc),
            IsAvailable = bookDto.Stock > 0,
            Author = bookDto.Author,
            Categories = bookDto.Categories,
            Genre = bookDto.Genre
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var response = new BookResponseDTO
        {
            BookId = book.BookId,
            Title = book.Title,
            ISBN = book.ISBN,
            Description = book.Description,
            Language = book.Language,
            Format = book.Format,
            Price = book.Price,
            Stock = book.Stock,
            PublicationDate = book.PublicationDate,
            IsAvailable = book.IsAvailable,
            Author = book.Author,
            Categories = book.Categories,
            Genre = book.Genre
        };

        return CreatedAtAction(nameof(GetBook), new { id = book.BookId }, response);
    }

    // PUT: api/Book/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateBook(Guid id, BooksDTO bookDto)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
        {
            return NotFound();
        }

        book.Title = bookDto.Title;
        book.ISBN = bookDto.ISBN;
        book.Description = bookDto.Description;
        book.Language = bookDto.Language;
        book.Format = bookDto.Format;
        book.Price = bookDto.Price;
        book.Stock = bookDto.Stock;
        book.PublicationDate = DateTime.SpecifyKind(bookDto.PublicationDate, DateTimeKind.Utc);
        book.IsAvailable = bookDto.Stock > 0;
        book.Author = bookDto.Author;
        book.Categories = bookDto.Categories;
        book.Genre = bookDto.Genre;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Book/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBook(Guid id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
        {
            return NotFound();
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}