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
        const publisher = document.getElementById('filterPublisher')?.value || '';
        const author = document.getElementById('filterAuthor')?.value || '';    // Add this
        const language = document.getElementById('filterLanguage')?.value || ''; // Add this
        const libraryAvailability = document.getElementById('filterLibraryAvailability')?.value || '';

        const params = new URLSearchParams({
            page: currentPage,
            pageSize: itemsPerPage,
            sortBy: sortBy
        });

        // Add filter parameters only if they have values
        if (searchTerm) params.append('searchTerm', searchTerm);
        if (genre) params.append('genre', genre);
        if (category) params.append('category', category);
        if (publisher) params.append('publisher', publisher);
        if (format) params.append('format', format);
        if (availability) params.append('availability', availability);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (category) params.append('category', category);
        if (author) params.append('author', author);
        if (language) params.append('language', language);

        console.log('Fetching with params:', Object.fromEntries(params));

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
        // Add event listeners for all filter dropdowns
        const filterElements = [
            'filterPublisher', 'filterGenre', 'filterFormat',
            'filterAuthor', 'filterLanguage', 'filterAvailability'
        ];

        filterElements.forEach(filterId => {
            document.getElementById(filterId).addEventListener('change', () => {
                currentPage = 1;
                loadBooks();
            });
        });


        const publisherSelect = document.getElementById('filterPublisher');
        if (publisherSelect.options.length <= 1) {
            const publishersResponse = await fetch(`${API_BASE_URL}/api/Book/publishers`);
            const publishers = await publishersResponse.json();
            publishers.forEach(publisher => {
                if (publisher) {
                    const option = document.createElement('option');
                    option.value = publisher;
                    option.textContent = publisher;
                    publisherSelect.appendChild(option);
                }
            });
        }

        // Load genres
        const genreSelect = document.getElementById('filterGenre');
        if (genreSelect.options.length <= 1) {
            const genresResponse = await fetch(`${API_BASE_URL}/api/Book/genres`);
            const genres = await genresResponse.json();
            genres.forEach(genre => {
                if (genre) {
                    const option = document.createElement('option');
                    option.value = genre;
                    option.textContent = genre;
                    genreSelect.appendChild(option);
                }
            });
        }

        // Load formats
        const formatSelect = document.getElementById('filterFormat');
        if (formatSelect.options.length <= 1) {
            const formatsResponse = await fetch(`${API_BASE_URL}/api/Book/formats`);
            const formats = await formatsResponse.json();
            formats.forEach(format => {
                if (format) {
                    const option = document.createElement('option');
                    option.value = format;
                    option.textContent = format;
                    formatSelect.appendChild(option);
                }
            });
        }

        // Load authors
        const authorSelect = document.getElementById('filterAuthor');
        if (authorSelect.options.length <= 1) {
            const authorsResponse = await fetch(`${API_BASE_URL}/api/Book/authors`);
            const authors = await authorsResponse.json();
            authors.forEach(author => {
                if (author) {
                    const option = document.createElement('option');
                    option.value = author;
                    option.textContent = author;
                    authorSelect.appendChild(option);
                }
            });
        }

        // Load languages
        const languageSelect = document.getElementById('filterLanguage');
        if (languageSelect.options.length <= 1) {
            const languagesResponse = await fetch(`${API_BASE_URL}/api/Book/languages`);
            if (!languagesResponse.ok) {
                throw new Error('Failed to fetch languages');
            }
            const languages = await languagesResponse.json();
            languages.forEach(language => {
                if (language) {
                    const option = document.createElement('option');
                    option.value = language;
                    option.textContent = language;
                    languageSelect.appendChild(option);
                }
            });
        }

    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Add event listener for language filter
document.getElementById('filterLanguage').addEventListener('change', () => {
    currentPage = 1;
    loadBooks();
});

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
// Add event listener for search input
document.getElementById('searchInput').addEventListener('input', debounce(() => {
    currentPage = 1; // Reset to first page when searching
    loadBooks();
}, 300)); // 300ms debounce

// Add this debounce function at the top of your file
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
        'filterCategory',
        'filterAuthor',    // Add this
        'filterLanguage'   // Add this
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

// Update the availability filter logic
// Update the displayBooks function to show library availability
// Add this function before displayBooks
function arrayBufferToBase64(buffer) {
    if (!buffer || buffer.length === 0) {
        return '';
    }

    if (typeof buffer === 'string') {
        return buffer;
    }

    try {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('Error converting buffer to base64:', error);
        return '';
    }
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
            <div class="availability-status">
                ${book.isAvailable ? '<span class="in-stock">In Stock</span>' : ''}
                ${book.isAvailableInLibrary ? '<span class="library-available">Available in Library</span>' : ''}
            </div>
            <button class="view-details-btn" onclick="viewBookDetails('${book.bookId}')">View Details</button>
        </div>
    `).join('');
}

// Update the viewBookDetails function to show library availability
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
                    ${book.isAvailableInLibrary ? '<span class="library-available">Available in Library</span>' : ''}
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
    const headerTitle = document.querySelector('.announcement-banner');

    // Check if elements exist before modifying them
    if (token && user) {
        // User is logged in
        if (userIcon) {
            if (user.role === 'Admin') {
                userIcon.innerHTML = '👑';
                userIcon.title = 'Admin Dashboard';
                userIcon.onclick = () => window.location.href = '/admin/dashboard.html';
            } else if (user.role === 'Staff') {
                userIcon.innerHTML = '🛠️';
                userIcon.title = 'Staff Dashboard';
                userIcon.onclick = () => window.location.href = '/staff/dashboard.html';
            } else {
                userIcon.innerHTML = '👤';
                userIcon.title = 'My Account';
                userIcon.onclick = () => { }; // Already on member dashboard
            }
        }

        // Setup cart icon functionality if it exists
        if (cartIcon) {
            cartIcon.title = 'Your Cart';
            cartIcon.onclick = () => window.location.href = '/cart.html';
        }
    } else {
        // User is not logged in
        if (userIcon) {
            userIcon.innerHTML = '👤';
            userIcon.title = 'Login/Register';
            userIcon.onclick = () => window.location.href = '/login.html';
        }

        // Setup cart icon for guest users if it exists
        if (cartIcon) {
            cartIcon.title = 'Login to use cart';
            cartIcon.onclick = () => window.location.href = '/login.html';
        }
    }

    // Add a login prompt in the header if not logged in and element exists
    if (headerTitle && !token) {
        headerTitle.innerHTML = 'Sign in for member benefits <a href="/login.html" style="color: white; text-decoration: underline; margin-left: 10px;">Login now</a>';
    }
}

function displayUserInfo(user) {
    const userInfoContainer = document.querySelector('.user-info');
    if (!userInfoContainer) return;

    userInfoContainer.innerHTML = `
        <h2>Welcome, ${user.username}!</h2>
        <p>Email: ${user.email}</p>
        <p>Member since: ${new Date(user.createdAt).toLocaleDateString()}</p>
        <div class="membership-card">
            <h3>Membership Status</h3>
            <p>Status: ${user.role}</p>
        </div>
    `;
}

function hideUserSpecificElements() {
    const userElements = document.querySelectorAll('.user-specific');
    userElements.forEach(element => {
        element.style.display = 'none';
    });
}

async function loadUserInfo() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !user) {
            hideUserSpecificElements();
            return;
        }

        displayUserInfo(user);
    } catch (error) {
        console.error('Error loading user info:', error);
        hideUserSpecificElements();
    }
}


// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing BookBazaar');

    // Populate options
    populateSortOptions();

    // Setup event listeners
    setupEventListeners();

    // Load user info
    loadUserInfo();

    // Update UI based on authentication status
    updateUIBasedOnAuth();

    // Load the books for all users (logged in or not)
    loadBooks().catch(error => {
        console.error('Failed to load books from API, using mock data:', error);
        loadMockBooks();
    });
});

// Add these functions to handle the new tabs
async function loadNewReleases() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/Book/new-releases?page=${currentPage}&pageSize=${itemsPerPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch new releases');
        }

        const data = await response.json();
        books = data.items || [];
        totalPages = data.totalPages || 1;

        displayBooks(books);
        updatePagination();
    } catch (error) {
        console.error('Error loading new releases:', error);
        document.getElementById('bookGrid').innerHTML = `
            <p>Error loading new releases. Please try again later.</p>
            <p>Details: ${error.message}</p>
        `;
    }
}

async function loadNewArrivals() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/Book/new-arrivals?page=${currentPage}&pageSize=${itemsPerPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch new arrivals');
        }

        const data = await response.json();
        books = data.items || [];
        totalPages = data.totalPages || 1;

        displayBooks(books);
        updatePagination();
    } catch (error) {
        console.error('Error loading new arrivals:', error);
        document.getElementById('bookGrid').innerHTML = `
            <p>Error loading new arrivals. Please try again later.</p>
            <p>Details: ${error.message}</p>
        `;
    }
}

// Add event listeners for the tabs
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            e.target.classList.add('active');

            currentPage = 1; // Reset to first page when changing tabs
            
            // Load appropriate content based on tab
            switch(e.target.dataset.category) {
                case 'new-releases':
                    await loadNewReleases();
                    break;
                case 'new-arrivals':
                    await loadNewArrivals();
                    break;
                default:
                    await loadBooks(); // Default to all books
            }
        });
    });
});
