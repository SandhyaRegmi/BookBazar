using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookBazar.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BookController(ApplicationDbContext context)
    {
        _context = context;
    }

    // get all books
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
            Publisher = b.Publisher,
            Genre = b.Genre,
            ImageData = b.ImageData ?? Array.Empty<byte>(),
            ImageContentType = b.ImageContentType ?? "image/jpeg"
        }).ToList();
    }

    // get single book by id
    [HttpGet("{id}")]
    public async Task<ActionResult<Books>> GetBook(Guid id)
    {
        var book = await _context.Books.FindAsync(id);
    
        if (book == null)
        {
            return NotFound();
        }
    
        // Add this line for debugging
        Console.WriteLine($"Book format: {book.Format}");
    
        return book;
    }

    // add new book (admin only)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BookResponseDTO>> CreateBook([FromForm] BooksDTO bookDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // check image requirements
        if (bookDto.Image == null || bookDto.Image.Length == 0)
        {
            ModelState.AddModelError("Image", "Please upload an image");
            return BadRequest(ModelState);
        }

        // max image size 5MB
        if (bookDto.Image.Length > 5 * 1024 * 1024)
        {
            ModelState.AddModelError("Image", "Image size must be less than 5MB");
            return BadRequest(ModelState);
        }

        // only allow these image types
        var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif" };
        if (!allowedContentTypes.Contains(bookDto.Image.ContentType.ToLower()))
        {
            ModelState.AddModelError("Image", "Only JPEG, PNG, and GIF images are allowed");
            return BadRequest(ModelState);
        }

        // save image data
        byte[] imageBytes = null;
        string imageContentType = null;

        if (bookDto.Image != null && bookDto.Image.Length > 0)
        {
            using var memoryStream = new MemoryStream();
            await bookDto.Image.CopyToAsync(memoryStream);
            imageBytes = memoryStream.ToArray();
            imageContentType = bookDto.Image.ContentType;
        }

        // create new book
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
            Publisher = bookDto.Publisher,
            Genre = bookDto.Genre,
            ImageData = imageBytes ?? Array.Empty<byte>(),
            ImageContentType = imageContentType ?? "image/jpeg"
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        // prepare response
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
            Genre = book.Genre,
            ImageData = book.ImageData,
            ImageContentType = book.ImageContentType
        };

        return CreatedAtAction(nameof(GetBook), new { id = book.BookId }, response);
    }

    // get book image
    [HttpGet("{id}/image")]
    public async Task<IActionResult> GetBookImage(Guid id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null || book.ImageData == null)
        {
            return NotFound();
        }

        return File(book.ImageData, book.ImageContentType);
    }
    [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBook(Guid id, [FromForm] BooksDTO bookDto)
        {
            try
            {
                var book = await _context.Books.FindAsync(id);
                if (book == null)
                {
                    return NotFound(new { message = "Book not found" });
                }

                // Handle image update if new image is provided
                // Check if the image in the request is valid (not empty or null)
                if (bookDto.Image != null)
                {
                    // Check if it's a real file with content
                    if (bookDto.Image.Length > 0)
                    {
                        using var memoryStream = new MemoryStream();
                        await bookDto.Image.CopyToAsync(memoryStream);
                        book.ImageData = memoryStream.ToArray();
                        book.ImageContentType = bookDto.Image.ContentType;
                    }
                    // If it's an empty file, do nothing (keep existing image)
                    // This works around the issue with empty files in form data
                }

                // Update other book properties
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
                book.Publisher = bookDto.Publisher;
                book.Genre = bookDto.Genre;
                book.IsAvailableInLibrary = bookDto.IsAvailableInLibrary;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while updating the book: {ex.Message}" });
            }
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

    //for pagination
    [HttpGet("paged")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetPagedBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? genre = null,
        [FromQuery] string? format = null,
        [FromQuery] string? availability = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? category = null,  
        [FromQuery] string? publisher = null,  // Add publisher parameter
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        try
        {
            var query = _context.Books.AsQueryable();
    
            // Apply filters
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(b => 
                    b.Title.Contains(searchTerm) || 
                    b.Author.Contains(searchTerm) || 
                    b.Description.Contains(searchTerm) ||
                    b.ISBN.Contains(searchTerm));
            }
    
            if (!string.IsNullOrWhiteSpace(genre))
            {
                query = query.Where(b => b.Genre == genre);
            }
    
            if (!string.IsNullOrWhiteSpace(format))
            {
                query = query.Where(b => b.Format == format);
            }
                
            // Add publisher filter inside the method
            if (!string.IsNullOrWhiteSpace(publisher))
            {
                query = query.Where(b => b.Publisher == publisher);
            }
    
            if (!string.IsNullOrWhiteSpace(author))
            {
                query = query.Where(b => b.Author == author);
            }
    
            if (!string.IsNullOrWhiteSpace(language))
            {
                query = query.Where(b => b.Language == language);
            }

            // Update availability filter handling
            if (availability == "library")
            {
                query = query.Where(b => b.IsAvailableInLibrary);
            }
            else if (availability == "inStock")
            {
                query = query.Where(b => b.IsAvailable && b.Stock > 0);
            }

            if (minPrice.HasValue)
            {
                query = query.Where(b => b.Price >= minPrice.Value);
            }
    
            if (maxPrice.HasValue)
            {
                query = query.Where(b => b.Price <= maxPrice.Value);
            }
    
            // Update the sorting section in GetPaged method
            query = sortBy?.ToLower() switch
            {
                "title_desc" => query.OrderByDescending(b => b.Title),
                "title" => query.OrderBy(b => b.Title),
                "price_desc" => query.OrderByDescending(b => b.Price),
                "price" => query.OrderBy(b => b.Price),
                "date_desc" => query.OrderByDescending(b => b.PublicationDate),
                "date" => query.OrderBy(b => b.PublicationDate),
                _ => query.OrderBy(b => b.Title) // default sorting
            };
    
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
    
            var books = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BookResponseDTO
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Author = b.Author,
                    Description = b.Description,
                    ISBN = b.ISBN,
                    Price = b.Price,
                    Stock = b.Stock,
                    Genre = b.Genre,
                    Format = b.Format,
                    Language = b.Language,
                    Categories = b.Categories,
                    PublicationDate = b.PublicationDate,
                    IsAvailable = b.Stock > 0,
                    ImageData = b.ImageData ?? Array.Empty<byte>(),
                    ImageContentType = b.ImageContentType ?? "image/jpeg",
                    IsAvailableInLibrary = b.IsAvailableInLibrary,
                })
                .ToListAsync();
    
            var response = new PagedResponse<BookResponseDTO>
            {
                Items = books,
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                TotalCount = totalCount
            };
    
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // Add these new endpoints to BookController.cs
    
    [HttpGet("new-releases")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetNewReleases(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            // Get books published in the last 3 months
            var threeMonthsAgo = DateTime.UtcNow.Date.AddMonths(-3);

            var query = _context.Books
                .Where(b => b.PublicationDate.Date >= threeMonthsAgo)
                .OrderByDescending(b => b.PublicationDate);
    
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
    
            var books = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BookResponseDTO
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Author = b.Author,
                    ISBN = b.ISBN,
                    Description = b.Description,
                    Language = b.Language,
                    Format = b.Format,
                    Price = b.Price,
                    Stock = b.Stock,
                    PublicationDate = b.PublicationDate,
                    Genre = b.Genre,
                    Publisher = b.Publisher,
                    ImageData = b.ImageData,
                    ImageContentType = b.ImageContentType,
                    IsAvailable = b.Stock > 0,
                    IsAvailableInLibrary = b.IsAvailableInLibrary
                })
                .ToListAsync();
    
            return Ok(new PagedResponse<BookResponseDTO>
            {
                Items = books,
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                TotalCount = totalItems
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
    
    [HttpGet("new-arrivals")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetNewArrivals(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var oneMonthAgo = DateTime.UtcNow.Date.AddMonths(-1);

            var query = _context.Books
                .Where(b => b.CreatedAt.Date >= oneMonthAgo) 
                .OrderByDescending(b => b.CreatedAt);
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
    
            var books = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BookResponseDTO
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Author = b.Author,
                    ISBN = b.ISBN,
                    Description = b.Description,
                    Language = b.Language,
                    Format = b.Format,
                    Price = b.Price,
                    Stock = b.Stock,
                    PublicationDate = b.PublicationDate,
                    Genre = b.Genre,
                    Publisher = b.Publisher,
                    ImageData = b.ImageData,
                    ImageContentType = b.ImageContentType,
                    IsAvailable = b.Stock > 0,
                    IsAvailableInLibrary = b.IsAvailableInLibrary
                })
                .ToListAsync();
    
            return Ok(new PagedResponse<BookResponseDTO>
            {
                Items = books,
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                TotalCount = totalItems
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
    
    [HttpGet("genres")]
    public async Task<ActionResult<IEnumerable<string>>> GetGenres()
    {
        try
        {
            var genres = await _context.Books
                .Where(b => !string.IsNullOrEmpty(b.Genre))
                .Select(b => b.Genre)
                .Distinct()
                .ToListAsync();

            return Ok(genres ?? new List<string>());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetGenres: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("formats")]
    public async Task<ActionResult<IEnumerable<string>>> GetFormats()
    {
        try
        {
            var formats = await _context.Books
                .Where(b => !string.IsNullOrEmpty(b.Format))
                .Select(b => b.Format)
                .Distinct()
                .ToListAsync();

            return Ok(formats ?? new List<string>());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetFormats: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        try
        {
            var categories = await _context.Books
                .Where(b => !string.IsNullOrEmpty(b.Categories))
                .Select(b => b.Categories)
                .Distinct()
                .ToListAsync();

            return Ok(categories ?? new List<string>());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetCategories: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    // Add new endpoints to get available authors and languages
    [HttpGet("authors")]
    public async Task<ActionResult<IEnumerable<string>>> GetAuthors()
    {
        try
        {
            var authors = await _context.Books
                .Where(b => !string.IsNullOrEmpty(b.Author))
                .Select(b => b.Author)
                .Distinct()
                .ToListAsync();

            return Ok(authors ?? new List<string>());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAuthors: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("languages")]
    public async Task<ActionResult<IEnumerable<string>>> GetLanguages()
    {
        var languages = await _context.Books
            .Select(b => b.Language)
            .Distinct()
            .Where(l => !string.IsNullOrEmpty(l))
            .ToListAsync();
        return Ok(languages);
    }

    [HttpGet("publishers")]
    public async Task<ActionResult<IEnumerable<string>>> GetPublishers()
    {
        var publishers = await _context.Books
            .Select(b => b.Publisher)
            .Distinct()
            .Where(p => !string.IsNullOrEmpty(p))
            .ToListAsync();
        return Ok(publishers);
    }
}
