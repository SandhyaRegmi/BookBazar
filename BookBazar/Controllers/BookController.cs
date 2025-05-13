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

        // Debug logging
        Console.WriteLine($"Creating book with IsAwardWinner: {bookDto.IsAwardWinner}");

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
            IsAwardWinner = bookDto.IsAwardWinner,
            Author = bookDto.Author,
            Categories = bookDto.Categories,
            CreatedAt = DateTime.UtcNow,
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
            ImageContentType = book.ImageContentType,
            IsAvailableInLibrary = book.IsAvailableInLibrary,
            IsAwardWinner = book.IsAwardWinner,
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

                // Debug logging
                Console.WriteLine($"Updating book with IsAwardWinner: {bookDto.IsAwardWinner}");

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
                book.IsAwardWinner = bookDto.IsAwardWinner;
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

    //Common method for all tabs
    private async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetBooksForTab(
        string tabType,
        int page = 1,
        int pageSize = 10,
        string? searchTerm = null,
        string? sortBy = null,
        string? genre = null,
        string? format = null,
        string? availability = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        string? category = null,
        string? publisher = null,
        string? author = null,
        string? language = null)
    {
        try
        {
            // Start with the base query
            var query = _context.Books.AsQueryable();
            Console.WriteLine($"Initial query count: {await query.CountAsync()}");

            // STEP 1: Apply tab-specific filtering first
            query = ApplyTabFilter(query, tabType);
            var afterTabFilter = await query.CountAsync();
            Console.WriteLine($"After tab filter ({tabType}) count: {afterTabFilter}");

            // STEP 2: Apply user filters to the tab-scoped subset
            query = ApplyUserFilters(query, searchTerm, genre, format, availability,
                minPrice, maxPrice, category, publisher, author, language);
            var afterUserFilters = await query.CountAsync();
            Console.WriteLine($"After user filters count: {afterUserFilters}");
            Console.WriteLine($"Applied filters - minPrice: {minPrice}, maxPrice: {maxPrice}");

            // STEP 3: Get total count after applying ALL filters
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            Console.WriteLine($"Final count before pagination: {totalCount}");

            // STEP 4: Apply sorting to the filtered results
            query = ApplySorting(query, sortBy);

            // STEP 5: Apply pagination to the filtered and sorted results
            var pagedQuery = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            var books = await pagedQuery
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
                    IsAwardWinner = b.IsAwardWinner,
                })
                .ToListAsync();

            Console.WriteLine($"Returning {books.Count} books for page {page}");

            return Ok(new PagedResponse<BookResponseDTO>
            {
                Items = books,
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                TotalCount = totalCount
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetBooksForTab: {ex.Message}");
            return StatusCode(500, ex.Message);
        }
    }

    //for pagination (All Books tab)
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
        [FromQuery] string? publisher = null,
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        return await GetBooksForTab("all", page, pageSize, searchTerm, sortBy, genre, format, 
            availability, minPrice, maxPrice, category, publisher, author, language);
    }

    [HttpGet("bestsellers")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetBestsellers(
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
        [FromQuery] string? publisher = null,
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        return await GetBooksForTab("bestsellers", page, pageSize, searchTerm, sortBy, genre, format, 
            availability, minPrice, maxPrice, category, publisher, author, language);
    }

    [HttpGet("award-winners")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetAwardWinners(
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
        [FromQuery] string? publisher = null,
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        return await GetBooksForTab("award-winners", page, pageSize, searchTerm, sortBy, genre, format, 
            availability, minPrice, maxPrice, category, publisher, author, language);
    }

    [HttpGet("coming-soon")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetComingSoon(
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
        [FromQuery] string? publisher = null,
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        return await GetBooksForTab("coming-soon", page, pageSize, searchTerm, sortBy, genre, format, 
            availability, minPrice, maxPrice, category, publisher, author, language);
    }

    [HttpGet("deals")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetDeals(
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
        [FromQuery] string? publisher = null,
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        return await GetBooksForTab("deals", page, pageSize, searchTerm, sortBy, genre, format, 
            availability, minPrice, maxPrice, category, publisher, author, language);
    }

    [HttpGet("new-releases")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetNewReleases(
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
        [FromQuery] string? publisher = null,
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        return await GetBooksForTab("new-releases", page, pageSize, searchTerm, sortBy, genre, format, 
            availability, minPrice, maxPrice, category, publisher, author, language);
    }

    [HttpGet("new-arrivals")]
    public async Task<ActionResult<PagedResponse<BookResponseDTO>>> GetNewArrivals(
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
        [FromQuery] string? publisher = null,
        [FromQuery] string? author = null,
        [FromQuery] string? language = null)
    {
        return await GetBooksForTab("new-arrivals", page, pageSize, searchTerm, sortBy, genre, format, 
            availability, minPrice, maxPrice, category, publisher, author, language);
    }

    // Helper method to apply tab-specific filtering
    private IQueryable<Books> ApplyTabFilter(IQueryable<Books> query, string tabType)
    {
        var now = DateTime.UtcNow.Date;
        var threeMonthsAgo = now.AddMonths(-3);
        var oneMonthAgo = now.AddMonths(-1);

        var filteredQuery = tabType switch
        {
            "all" => query,
            "new-releases" => query.Where(b => b.PublicationDate.Date >= threeMonthsAgo && b.PublicationDate.Date <= now),
            "new-arrivals" => query.Where(b => b.CreatedAt.Date >= oneMonthAgo && b.CreatedAt.Date <= now),
            "bestsellers" => query.Where(b => b.SalesCount > 100),
            "award-winners" => query.Where(b => b.IsAwardWinner),
            "coming-soon" => query.Where(b => b.PublicationDate.Date > now),
            "deals" => query.Where(b => b.DiscountPercentage > 0),
            _ => query
        };

        Console.WriteLine($"Applied tab filter for {tabType}");
        return filteredQuery;
    }

    // Helper method to apply user filters
    private IQueryable<Books> ApplyUserFilters(IQueryable<Books> query,
        string? searchTerm,
        string? genre,
        string? format,
        string? availability,
        decimal? minPrice,
        decimal? maxPrice,
        string? category,
        string? publisher,
        string? author,
        string? language)
    {
        // Apply search term filter
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(b => 
                b.Title.Contains(searchTerm) || 
                b.Author.Contains(searchTerm) || 
                b.Description.Contains(searchTerm) ||
                b.ISBN.Contains(searchTerm));
        }

        // Apply genre filter
        if (!string.IsNullOrWhiteSpace(genre))
            query = query.Where(b => b.Genre == genre);

        // Apply format filter
        if (!string.IsNullOrWhiteSpace(format))
            query = query.Where(b => b.Format == format);

        // Apply publisher filter
        if (!string.IsNullOrWhiteSpace(publisher))
            query = query.Where(b => b.Publisher == publisher);

        // Apply author filter
        if (!string.IsNullOrWhiteSpace(author))
            query = query.Where(b => b.Author == author);

        // Apply language filter
        if (!string.IsNullOrWhiteSpace(language))
            query = query.Where(b => b.Language == language);

        // Apply price range filters
        if (minPrice.HasValue)
        {
            query = query.Where(b => b.Price >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(b => b.Price <= maxPrice.Value);
        }

        // Apply availability filter
        if (availability == "library")
            query = query.Where(b => b.IsAvailableInLibrary);
        else if (availability == "inStock")
            query = query.Where(b => b.IsAvailable && b.Stock > 0);

        return query;
    }

    // Add the ApplySorting method if not already present
    private IQueryable<Books> ApplySorting(IQueryable<Books> query, string? sortBy)
    {
        if (string.IsNullOrEmpty(sortBy))
            return query.OrderBy(b => b.Title); // default sorting

        // Handle format like "title:1" or "title:-1"
        var parts = sortBy.Split(':');
        var field = parts[0].ToLower();
        var direction = parts.Length > 1 ? parts[1] : "1";

        return (field, direction) switch
        {
            ("title", "1") => query.OrderBy(b => b.Title),
            ("title", "-1") => query.OrderByDescending(b => b.Title),
            ("price", "1") => query.OrderBy(b => b.Price),
            ("price", "-1") => query.OrderByDescending(b => b.Price),
            ("date", "1") => query.OrderBy(b => b.PublicationDate),
            ("date", "-1") => query.OrderByDescending(b => b.PublicationDate),
            _ => query.OrderBy(b => b.Title) // default sorting
        };
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