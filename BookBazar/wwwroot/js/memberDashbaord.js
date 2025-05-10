let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;
let books = []; // Initialize books array

// Get the API URL from configuration or default to localhost:5000
const API_BASE_URL = 'http://localhost:5000';

async function loadBooks() {
    try {
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || '';
        const genre = document.getElementById('filterGenre')?.value || '';
        const format = document.getElementById('filterFormat')?.value || '';
        const availability = document.getElementById('filterAvailability')?.value || '';
        const minPrice = document.getElementById('minPrice')?.value || '';
        const maxPrice = document.getElementById('maxPrice')?.value || '';
        const category = document.getElementById('filterCategory')?.value || '';
        // Construct query parameters
        const params = new URLSearchParams({
            page: currentPage,
            pageSize: itemsPerPage,
            sortBy: sortBy
        });

        if (searchTerm) params.append('searchTerm', searchTerm);
        if (genre) params.append('genre', genre);
        if (category) params.append('category', category); 
        if (format) params.append('format', format);
        if (availability) params.append('availability', availability);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);

        console.log(`Fetching books from: ${API_BASE_URL}/api/Book/paged?${params}`);

        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch(`${API_BASE_URL}/api/Book/paged?${params}`, {
            headers: headers,
            credentials: 'include',
        });

        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            throw new Error(`API responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('API data received:', data);
        
        books = data.items || [];
        totalPages = data.totalPages || 1;
        
        displayBooks(books);
        updatePagination();

        loadFilterOptions();
        
    } catch (error) {
        console.error('Error loading books:', error);
        document.getElementById('bookGrid').innerHTML = `
            <p>Error loading books. Please try again later.</p>
            <p>Details: ${error.message}</p>
        `;
    }
}

// Load books and setup event listeners
async function loadFilterOptions() {
    try {
        const genreSelect = document.getElementById('filterGenre');
        const formatSelect = document.getElementById('filterFormat');
        const categorySelect = document.getElementById('filterCategory');
        
        if (genreSelect.options.length <= 1) {
            const response = await fetch(`${API_BASE_URL}/api/Book/genres`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const genres = await response.json();
            if (Array.isArray(genres)) {
                genres.forEach(genre => {
                    if (genre) {  // Only add non-null genres
                        const option = document.createElement('option');
                        option.value = genre;
                        option.textContent = genre;
                        genreSelect.appendChild(option);
                    }
                });
            }
        }
        
        if (formatSelect.options.length <= 1) {
            const response = await fetch(`${API_BASE_URL}/api/Book/formats`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const formats = await response.json();
            if (Array.isArray(formats)) {
                formats.forEach(format => {
                    if (format) {  // Only add non-null formats
                        const option = document.createElement('option');
                        option.value = format;
                        option.textContent = format;
                        formatSelect.appendChild(option);
                    }
                });
            }
        }
        if (categorySelect.options.length <= 1) {
            const response = await fetch(`${API_BASE_URL}/api/Book/categories`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const categories = await response.json();
            if (Array.isArray(categories)) {
                categories.forEach(category => {
                    if (category) {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        categorySelect.appendChild(option);
                    }
                });
            }
        }

    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Mock data for when API is unavailable
function loadMockBooks() {
    // Mock data could be defined here
    totalPages = 1;
    
    displayBooks(books);
    updatePagination();
    
    // Return the mock data
    return {
        items: [],
        currentPage: 1,
        pageSize: 0,
        totalPages: 1,
        totalCount: 0
    };
}

// Debounce function to prevent too many API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadBooks, 300));
    }
    
    // Sorting and filters
    const elements = [
        'sortBy', 
        'filterGenre', 
        'filterFormat', 
        'filterAvailability',
        'filterCategory'  
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', loadBooks);
        }
    });
    
    // Price filters
    const priceInputs = ['minPrice', 'maxPrice'];
    priceInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(loadBooks, 300));
        }
    });
    
    // Modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('bookModal').style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('bookModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function displayBooks(books) {
    const bookGrid = document.getElementById('bookGrid');
    if (!books || books.length === 0) {
        bookGrid.innerHTML = '<p>No books found.</p>';
        return;
    }

    bookGrid.innerHTML = books.map(book => `
        <div class="book-card" data-id="${book.bookId}">
            <div class="book-image">
                ${book.imageData 
                    ? `<img src="data:${book.imageContentType};base64,${arrayBufferToBase64(book.imageData)}" alt="${book.title}">`
                    : `<div class="no-image">No Image Available</div>`
                }
            </div>
            <h3>${book.title}</h3>
            <p class="author">By ${book.author}</p>
            <p class="genre">${book.genre || 'N/A'}</p>
            <p class="format">${book.format || 'N/A'}</p>
            <div class="book-price">$${book.price.toFixed(2)}</div>
            <button class="view-details-btn" onclick="viewBookDetails('${book.bookId}')">View Details</button>
        </div>
    `).join('');
}

// function to convert array buffer to base64
function arrayBufferToBase64(buffer) {
    if (typeof buffer === 'string') return buffer;
    
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Function to view book details
function viewBookDetails(bookId) {
    const book = books.find(b => b.bookId === bookId);
    if (!book) return;

    const modal = document.getElementById('bookModal');
    const modalContent = document.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <div class="book-detail-content">
            <div class="book-detail-image">
                ${book.imageData 
                    ? `<img src="data:${book.imageContentType};base64,${book.imageData}" alt="${book.title}">`
                    : `<div class="no-image">No Image Available</div>`
                }
            </div>
            <div class="book-detail-info">
                <h2>${book.title}</h2>
                <p class="author">By ${book.author}</p>
                <p class="description">${book.description}</p>
                <p class="details">
                    <strong>ISBN:</strong> ${book.isbn}<br>
                    <strong>Genre:</strong> ${book.genre}<br>
                    <strong>Format:</strong> ${book.format}<br>
                    <strong>Language:</strong> ${book.language}<br>
                    <strong>Publication Date:</strong> ${new Date(book.publicationDate).toLocaleDateString()}<br>
                    <strong>Price:</strong> $${book.price.toFixed(2)}
                </p>
                <div class="stock-status">
                    ${book.isAvailable ? '<span class="in-stock">In Stock</span>' : '<span class="out-of-stock">Out of Stock</span>'}
                </div>
                <button class="add-to-cart-btn">Add to Cart</button>
            </div>
        </div>
    `;

    modal.style.display = "block";

    // Close button functionality
    const closeBtn = modalContent.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = "none";
}

// function to update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">◀</button>`;
    
    // Page numbers (show max 5 pages with current page in the middle)
    const totalPagesToShow = Math.min(5, totalPages);
    let startPage = Math.max(1, currentPage - Math.floor(totalPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + totalPagesToShow - 1);
    
    // Adjust start page if we're at the end of the range
    if (endPage - startPage + 1 < totalPagesToShow) {
        startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="page-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // Next button
    paginationHTML += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">▶</button>`;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadBooks();
    }
}

// to populate sort options
function populateSortOptions() {
    const sortBy = document.getElementById('sortBy');
    if (!sortBy) return;
    
    sortBy.innerHTML = `
        <option value="title">Title (A-Z)</option>
        <option value="title_desc">Title (Z-A)</option>
        <option value="price">Price (Low to High)</option>
        <option value="price_desc">Price (High to Low)</option>
        <option value="date">Publication Date (Oldest)</option>
        <option value="date_desc">Publication Date (Newest)</option>
    `;
}

// Function to updates UI based on authentication status
function updateUIBasedOnAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Get user-specific elements
    const cartIcon = document.querySelector('.cart-icon');
    const userIcon = document.querySelector('.icon:last-child');
    
    if (token && user) {
        // User is logged in
        if (user.role === 'Admin') {
            // Add admin indicator if needed
            userIcon.innerHTML = '👑';
            userIcon.title = 'Admin Dashboard';
            userIcon.onclick = () => window.location.href = '/admin/dashboard.html';
        } else if (user.role === 'Staff') {
            // Add staff indicator if needed
            userIcon.innerHTML = '🛠️';
            userIcon.title = 'Staff Dashboard';
            userIcon.onclick = () => window.location.href = '/staff/dashboard.html';
        } else {
            // Regular member
            userIcon.innerHTML = '👤';
            userIcon.title = 'My Account';
            userIcon.onclick = () => {}; // Already on member dashboard
        }
        
        // Setup cart icon functionality
        cartIcon.title = 'Your Cart';
        cartIcon.onclick = () => window.location.href = '/cart.html';
    } else {
        // User is not logged in
        userIcon.innerHTML = '👤';
        userIcon.title = 'Login/Register';
        userIcon.onclick = () => window.location.href = '/login.html';
        
        // Setup cart icon for guest users
        cartIcon.title = 'Login to use cart';
        cartIcon.onclick = () => window.location.href = '/login.html';
    }
    
    // Add a login prompt in the header if not logged in
    const headerTitle = document.querySelector('.announcement-banner');
    if (headerTitle && !token) {
        headerTitle.innerHTML = 'Sign in for member benefits <a href="/login.html" style="color: white; text-decoration: underline; margin-left: 10px;">Login now</a>';
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing BookBazaar');
    
    // Populate options
    populateSortOptions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update UI based on authentication status
    updateUIBasedOnAuth();
    
    // Load the books for all users (logged in or not)
    loadBooks().catch(error => {
        console.error('Failed to load books from API, using mock data:', error);
        loadMockBooks();
    });
});