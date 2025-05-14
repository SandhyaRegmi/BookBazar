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

    // Retrieves all books with their complete details
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

    // Retrieves a specific book by its ID
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

    // Creates a new book with image upload (Admin only)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BookResponseDTO>> CreateBook([FromForm] BooksDTO bookDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

<<<<<<< HEAD
=======
      
        Console.WriteLine($"Creating book with IsAwardWinner: {bookDto.IsAwardWinner}");

       
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        if (bookDto.Image == null || bookDto.Image.Length == 0)
        {
            ModelState.AddModelError("Image", "Please upload an image");
            return BadRequest(ModelState);
        }

        if (bookDto.Image.Length > 5 * 1024 * 1024)
        {
            ModelState.AddModelError("Image", "Image size must be less than 5MB");
            return BadRequest(ModelState);
        }

<<<<<<< HEAD
=======
       
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif" };
        if (!allowedContentTypes.Contains(bookDto.Image.ContentType.ToLower()))
        {
            ModelState.AddModelError("Image", "Only JPEG, PNG, and GIF images are allowed");
            return BadRequest(ModelState);
        }

<<<<<<< HEAD
=======
      
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        byte[] imageBytes = null;
        string imageContentType = null;

        if (bookDto.Image != null && bookDto.Image.Length > 0)
        {
            using var memoryStream = new MemoryStream();
            await bookDto.Image.CopyToAsync(memoryStream);
            imageBytes = memoryStream.ToArray();
            imageContentType = bookDto.Image.ContentType;
        }

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

    // Retrieves the image associated with a specific book
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

    // Updates an existing book's details and image (Admin only)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateBook(Guid id, [FromForm] BooksDTO bookDto)
    {
        try
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
<<<<<<< HEAD
                return NotFound(new { message = "Book not found" });
=======
                var book = await _context.Books.FindAsync(id);
                if (book == null)
                {
                    return NotFound(new { message = "Book not found" });
                }

                
                Console.WriteLine($"Updating book with IsAwardWinner: {bookDto.IsAwardWinner}");

                
                if (bookDto.Image != null)
                {
                    
                    if (bookDto.Image.Length > 0)
                    {
                        using var memoryStream = new MemoryStream();
                        await bookDto.Image.CopyToAsync(memoryStream);
                        book.ImageData = memoryStream.ToArray();
                        book.ImageContentType = bookDto.Image.ContentType;
                    }
                  
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
                book.Publisher = bookDto.Publisher;
                book.Genre = bookDto.Genre;
                book.IsAvailableInLibrary = bookDto.IsAvailableInLibrary;
                book.IsAwardWinner = bookDto.IsAwardWinner;
                await _context.SaveChangesAsync();

                return NoContent();
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
            }

            if (bookDto.Image != null && bookDto.Image.Length > 0)
            {
                using var memoryStream = new MemoryStream();
                await bookDto.Image.CopyToAsync(memoryStream);
                book.ImageData = memoryStream.ToArray();
                book.ImageContentType = bookDto.Image.ContentType;
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

<<<<<<< HEAD
    // Removes a book from the catalog (Admin only)
=======
    
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
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

<<<<<<< HEAD
    // Retrieves a paginated list of books with filtering and sorting options
=======
  
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
           
            var query = _context.Books.AsQueryable();
            Console.WriteLine($"Initial query count: {await query.CountAsync()}");

          
            query = ApplyTabFilter(query, tabType);
            var afterTabFilter = await query.CountAsync();
            Console.WriteLine($"After tab filter ({tabType}) count: {afterTabFilter}");

          
            query = ApplyUserFilters(query, searchTerm, genre, format, availability,
                minPrice, maxPrice, category, publisher, author, language);
            var afterUserFilters = await query.CountAsync();
            Console.WriteLine($"After user filters count: {afterUserFilters}");
            Console.WriteLine($"Applied filters - minPrice: {minPrice}, maxPrice: {maxPrice}");

          
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            Console.WriteLine($"Final count before pagination: {totalCount}");

        
            query = ApplySorting(query, sortBy);

          
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

  
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
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

    // Retrieves bestselling books with filtering options
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

    // Retrieves award-winning books with filtering options
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

    // Retrieves upcoming book releases with filtering options
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

    // Retrieves books currently on sale with filtering options
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

    // Retrieves newly published books with filtering options
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

    // Retrieves recently added books to the catalog with filtering options
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

<<<<<<< HEAD
    // Retrieves a list of all available book genres
    [HttpGet("genres")]
    public async Task<ActionResult<IEnumerable<string>>> GetGenres()
=======
  
    private IQueryable<Books> ApplyTabFilter(IQueryable<Books> query, string tabType)
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
    {
        var genres = await _context.Books
            .Select(b => b.Genre)
            .Distinct()
            .Where(g => !string.IsNullOrEmpty(g))
            .ToListAsync();

        return Ok(genres);
    }

<<<<<<< HEAD
    // Retrieves a list of all available book formats
    [HttpGet("formats")]
    public async Task<ActionResult<IEnumerable<string>>> GetFormats()
    {
        var formats = await _context.Books
            .Select(b => b.Format)
            .Distinct()
            .Where(f => !string.IsNullOrEmpty(f))
            .ToListAsync();

        return Ok(formats);
    }

    // Retrieves a list of all book categories
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _context.Books
            .SelectMany(b => b.Categories)
            .Distinct()
            .Where(c => !string.IsNullOrEmpty(c))
            .ToListAsync();

        return Ok(categories);
    }

    // Retrieves a list of all book authors
    [HttpGet("authors")]
    public async Task<ActionResult<IEnumerable<string>>> GetAuthors()
    {
        var authors = await _context.Books
            .Select(b => b.Author)
            .Distinct()
            .Where(a => !string.IsNullOrEmpty(a))
            .ToListAsync();

        return Ok(authors);
    }

    // Retrieves a list of all available book languages
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

    // Retrieves a list of all book publishers
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
        var query = _context.Books.AsQueryable();

        query = ApplyTabFilter(query, tabType);
        query = ApplyUserFilters(query, searchTerm, genre, format, availability, minPrice, maxPrice,
            category, publisher, author, language);
        query = ApplySorting(query, sortBy);

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var books = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookResponseDTO
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
                ImageData = b.ImageData,
                ImageContentType = b.ImageContentType,
                IsAvailableInLibrary = b.IsAvailableInLibrary,
                IsAwardWinner = b.IsAwardWinner
            })
            .ToListAsync();

        return new PagedResponse<BookResponseDTO>
        {
            Items = books,
            CurrentPage = page,
            TotalPages = totalPages,
            TotalItems = totalItems,
            PageSize = pageSize
        };
    }

    private IQueryable<Books> ApplyTabFilter(IQueryable<Books> query, string tabType)
    {
        return tabType switch
        {
            "bestsellers" => query.Where(b => b.IsBestseller),
            "award-winners" => query.Where(b => b.IsAwardWinner),
            "coming-soon" => query.Where(b => b.PublicationDate > DateTime.UtcNow),
            "deals" => query.Where(b => b.IsOnSale),
            "new-releases" => query.Where(b => b.PublicationDate <= DateTime.UtcNow)
                .OrderByDescending(b => b.PublicationDate),
            "new-arrivals" => query.OrderByDescending(b => b.CreatedAt),
            _ => query
        };
    }

    private IQueryable<Books> ApplyUserFilters(
        IQueryable<Books> query,
=======
  
    private IQueryable<Books> ApplyUserFilters(IQueryable<Books> query,
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
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
<<<<<<< HEAD
=======
      
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(b =>
                b.Title.Contains(searchTerm) ||
                b.Author.Contains(searchTerm) ||
                b.ISBN.Contains(searchTerm) ||
                b.Description.Contains(searchTerm));
        }

<<<<<<< HEAD
=======
       
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        if (!string.IsNullOrWhiteSpace(genre))
        {
            query = query.Where(b => b.Genre == genre);
        }

<<<<<<< HEAD
=======
       
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        if (!string.IsNullOrWhiteSpace(format))
        {
            query = query.Where(b => b.Format == format);
        }

<<<<<<< HEAD
        if (!string.IsNullOrWhiteSpace(availability))
        {
            query = availability.ToLower() switch
            {
                "in stock" => query.Where(b => b.Stock > 0),
                "out of stock" => query.Where(b => b.Stock == 0),
                _ => query
            };
        }

=======
     
        if (!string.IsNullOrWhiteSpace(publisher))
            query = query.Where(b => b.Publisher == publisher);

       
        if (!string.IsNullOrWhiteSpace(author))
            query = query.Where(b => b.Author == author);

      
        if (!string.IsNullOrWhiteSpace(language))
            query = query.Where(b => b.Language == language);

      
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        if (minPrice.HasValue)
        {
            query = query.Where(b => b.Price >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(b => b.Price <= maxPrice.Value);
        }

<<<<<<< HEAD
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(b => b.Categories.Contains(category));
        }

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
=======
        
        if (availability == "library")
            query = query.Where(b => b.IsAvailableInLibrary);
        else if (availability == "inStock")
            query = query.Where(b => b.IsAvailable && b.Stock > 0);
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856

        return query;
    }

<<<<<<< HEAD
    private IQueryable<Books> ApplySorting(IQueryable<Books> query, string? sortBy)
    {
        return sortBy?.ToLower() switch
=======
   
    private IQueryable<Books> ApplySorting(IQueryable<Books> query, string? sortBy)
    {
        if (string.IsNullOrEmpty(sortBy))
            return query.OrderBy(b => b.Title); 

       
        var parts = sortBy.Split(':');
        var field = parts[0].ToLower();
        var direction = parts.Length > 1 ? parts[1] : "1";

        return (field, direction) switch
>>>>>>> e11360869b1fe297583103ccb67da23f012ea856
        {
            "title" => query.OrderBy(b => b.Title),
            "title_desc" => query.OrderByDescending(b => b.Title),
            "price" => query.OrderBy(b => b.Price),
            "price_desc" => query.OrderByDescending(b => b.Price),
            "date" => query.OrderBy(b => b.PublicationDate),
            "date_desc" => query.OrderByDescending(b => b.PublicationDate),
            _ => query.OrderByDescending(b => b.CreatedAt)
        };
    }
}