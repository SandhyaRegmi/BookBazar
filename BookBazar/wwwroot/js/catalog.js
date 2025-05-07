let currentPage = 1;
const itemsPerPage = 12;
let books = [];

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    setupEventListeners();
    updateUserNav();
});

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterBooks);
    document.getElementById('sortBy').addEventListener('change', filterBooks);
    document.getElementById('filterGenre').addEventListener('change', filterBooks);
    document.getElementById('filterFormat').addEventListener('change', filterBooks);
    document.getElementById('filterAvailability').addEventListener('change', filterBooks);
    document.getElementById('minPrice').addEventListener('input', filterBooks);
    document.getElementById('maxPrice').addEventListener('input', filterBooks);

    // Close modal when clicking the close button
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('bookModal').style.display = 'none';
    });
}

async function loadBooks() {
    try {
        const response = await fetch('http://localhost:5000/api/Book', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to load books');
        
        books = await response.json();
        populateGenreFilter(books);
        populateFormatFilter(books);
        displayBooks(books);
        updatePagination();
    } catch (error) {
        console.error('Error loading books:', error);
        alert('Failed to load books. Please try again later.');
    }
}

function populateGenreFilter(books) {
    const genres = [...new Set(books.map(book => book.genre))];
    const genreSelect = document.getElementById('filterGenre');
    genreSelect.innerHTML = '<option value="">All Genres</option>' +
        genres.map(genre => `<option value="${genre}">${genre}</option>`).join('');
}

function populateFormatFilter(books) {
    const formats = [...new Set(books.map(book => book.format))];
    const formatSelect = document.getElementById('filterFormat');
    formatSelect.innerHTML = '<option value="">All Formats</option>' +
        formats.map(format => `<option value="${format}">${format}</option>`).join('');
}

function displayBooks(booksToShow) {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedBooks = booksToShow.slice(start, end);

    const grid = document.getElementById('bookGrid');
    grid.innerHTML = paginatedBooks.map(book => `
        <div class="book-card" onclick="showBookDetails('${book.bookId}')">
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Genre:</strong> ${book.genre}</p>
            <p><strong>Price:</strong> $${book.price.toFixed(2)}</p>
            <p><strong>Status:</strong> ${book.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
        </div>
    `).join('');
}

function showBookDetails(bookId) {
    const book = books.find(b => b.bookId === bookId);
    if (!book) return;

    const modal = document.getElementById('bookModal');
    const details = document.getElementById('bookDetails');
    
    details.innerHTML = `
        <h2>${book.title}</h2>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>Genre:</strong> ${book.genre}</p>
        <p><strong>Format:</strong> ${book.format}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>Language:</strong> ${book.language}</p>
        <p><strong>Price:</strong> $${book.price.toFixed(2)}</p>
        <p><strong>Stock:</strong> ${book.stock}</p>
        <p><strong>Status:</strong> ${book.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
        <p><strong>Description:</strong> ${book.description}</p>
        ${book.stock > 0 ? '<button onclick="addToCart(\'' + book.bookId + '\')">Add to Cart</button>' : ''}
    `;

    modal.style.display = 'block';
}

function updatePagination() {
    const totalPages = Math.ceil(books.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">${i}</button>`;
    }
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    displayBooks(books);
    updatePagination();
}

function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;
    const genre = document.getElementById('filterGenre').value;
    const format = document.getElementById('filterFormat').value;
    const availability = document.getElementById('filterAvailability').value;
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;

    let filtered = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                            book.author.toLowerCase().includes(searchTerm) ||
                            book.description.toLowerCase().includes(searchTerm);
        const matchesGenre = !genre || book.genre === genre;
        const matchesFormat = !format || book.format === format;
        const matchesAvailability = !availability || 
                                  (availability === 'inStock' && book.availability) ||
                                  (availability === 'library' && book.libraryAccess);
        const matchesPrice = book.price >= minPrice && book.price <= maxPrice;

        return matchesSearch && matchesGenre && matchesFormat && 
               matchesAvailability && matchesPrice;
    });

    // Sort books
    filtered.sort((a, b) => {
        switch(sortBy) {
            case 'title': return a.title.localeCompare(b.title);
            case 'price': return a.price - b.price;
            case 'date': return new Date(b.publicationDate) - new Date(a.publicationDate);
            case 'popularity': return b.salesCount - a.salesCount;
            default: return 0;
        }
    });

    currentPage = 1;
    displayBooks(filtered);
    updatePagination();
}

function updateUserNav() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userNav = document.getElementById('userNav');
    
    if (user) {
        userNav.innerHTML = `
            <span>Welcome, ${user.username}</span>
            <a href="cart.html">Cart</a>
            <a href="wishlist.html">Wishlist</a>
            <a href="#" onclick="logout()">Logout</a>
        `;
    } else {
        userNav.innerHTML = `
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    }
}