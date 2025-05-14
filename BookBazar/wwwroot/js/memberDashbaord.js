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
        const author = document.getElementById('filterAuthor')?.value || '';
        const language = document.getElementById('filterLanguage')?.value || '';

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
        if (author) params.append('author', author);
        if (language) params.append('language', language);

        console.log('Fetching with params:', Object.fromEntries(params));

        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        let endpoint = 'paged'; // default endpoint
        const endpointMap = {
            'all': 'paged',
            'new-releases': 'new-releases',
            'new-arrivals': 'new-arrivals',
            'bestsellers': 'bestsellers',
            'award-winners': 'award-winners',
            'coming-soon': 'coming-soon',
            'deals': 'deals'
        };

        endpoint = endpointMap[currentTab] || 'paged';

        const response = await fetch(`${API_BASE_URL}/api/Book/${endpoint}?${params}`, {
            headers: headers,
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
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

    bookGrid.innerHTML = books.map(book => {
        // Check if book is coming soon or out of stock
        const isComingSoon = new Date(book.publicationDate) > new Date();
        const isOutOfStock = book.stock <= 0;
        const isAvailable = !isComingSoon && !isOutOfStock;

        return `
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
                ${isAvailable ? '<span class="in-stock">In Stock</span>' : ''}
                ${isComingSoon ? '<span class="coming-soon">Coming Soon</span>' : ''}
                ${isOutOfStock ? '<span class="out-of-stock">Out of Stock</span>' : ''}
                ${book.isAvailableInLibrary ? '<span class="library-available">Available in Library</span>' : ''}
            </div>
            <div class="book-actions">
                <div class="book-actions-left">
                <a href="/member/book-details.html?id=${book.bookId}" class="view-details-btn">
                    <i class="fas fa-info-circle"></i> View Details
                </a>
                <button class="add-to-cart-btn" 
                    onclick="addToCart('${book.bookId}')"
                    ${!isAvailable ? 'disabled' : ''}
                    style="${!isAvailable ? 'opacity: 0.6; cursor: not-allowed;' : ''}"
                    title="${isComingSoon ? 'This book is not yet available for purchase' : 
                           isOutOfStock ? 'This book is currently out of stock' : 
                           'Add to Cart'}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                </div>
                <div class="book-actions-right">
                <button class="bookmark-btn" onclick="toggleBookmark('${book.bookId}')">
                    <i class="far fa-bookmark"></i>
                </button>
                </div>
            </div>
        </div>
    `}).join('');

    // Check bookmark status for all books
    checkBookmarkStatuses(books.map(book => book.bookId));
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
        loadBooks(); // Use loadBooks instead of loadTabContent
    }
}

// to populate sort options
function populateSortOptions() {
    const sortBy = document.getElementById('sortBy');
    if (!sortBy) return;

    sortBy.innerHTML = `
        <option value="title:1">Title (A-Z)</option>
        <option value="title:-1">Title (Z-A)</option>
        <option value="price:1">Price (Low to High)</option>
        <option value="price:-1">Price (High to Low)</option>
        <option value="date:1">Publication Date (Oldest)</option>
        <option value="date:-1">Publication Date (Newest)</option>
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

    // Add event listeners for the tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            categoryTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            // Load content for the selected tab
            const category = tab.dataset.category;
            currentTab = category;
            currentPage = 1;
            loadTabContent(category);
        });
    });

    // Initial load of default tab
    loadTabContent('all');
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
let currentTab = 'all'; // Add this to track current tab

// Add this function before loadTabContent
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
    };
}

async function loadTabContent(tabType) {
    try {
        currentTab = tabType; // Update current tab
        currentPage = 1; // Reset to first page when switching tabs

        // Get all filter values
        const filters = {
            page: currentPage,
            pageSize: itemsPerPage,
            sortBy: document.getElementById('sortBy')?.value || '',
            searchTerm: document.getElementById('searchInput')?.value || '',
            genre: document.getElementById('filterGenre')?.value || '',
            format: document.getElementById('filterFormat')?.value || '',
            availability: document.getElementById('filterAvailability')?.value || '',
            minPrice: document.getElementById('minPrice')?.value || '',
            maxPrice: document.getElementById('maxPrice')?.value || '',
            category: document.getElementById('filterCategory')?.value || '',
            publisher: document.getElementById('filterPublisher')?.value || '',
            author: document.getElementById('filterAuthor')?.value || '',
            language: document.getElementById('filterLanguage')?.value || ''
        };

        console.log(`Loading ${tabType} with filters:`, filters);

        // Create URLSearchParams with all filters
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.append(key, value);
            }
        });

        let endpoint = 'paged'; // default endpoint for all books

        // Map tab types to their corresponding endpoints
        const endpointMap = {
            'all': 'paged',
            'new-releases': 'new-releases',
            'new-arrivals': 'new-arrivals',
            'bestsellers': 'bestsellers',
            'award-winners': 'award-winners',
            'coming-soon': 'coming-soon',
            'deals': 'deals'
        };

        endpoint = endpointMap[tabType] || 'paged';

        console.log(`Making API call to ${endpoint} with params:`, Object.fromEntries(params));

        const response = await fetch(`${API_BASE_URL}/api/Book/${endpoint}?${params}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log(`Received data for ${tabType}:`, {
            totalItems: data.totalCount,
            itemsPerPage: data.pageSize,
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            items: data.items?.length
        });

        books = data.items || [];
        totalPages = data.totalPages || 1;

        displayBooks(books);
        updatePagination();
    } catch (error) {
        console.error('Error loading tab content:', error);
        handleError(error);
    }
}

// Add this function to handle errors
function handleError(error) {
    document.getElementById('bookGrid').innerHTML = `
        <p>Error loading books. Please try again later.</p>
        <p>Details: ${error.message}</p>
    `;
}

// Update event listeners for filters
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for all filter controls
    const filterElements = document.querySelectorAll('.filter-control, .filter-btn, #sortBy, #searchInput, #minPrice, #maxPrice');
    filterElements.forEach(element => {
        if (element.id === 'minPrice' || element.id === 'maxPrice') {
            element.addEventListener('input', debounce(() => {
                currentPage = 1;
                loadBooks(); // Use loadBooks instead of loadTabContent
            }, 300));
        } else {
            element.addEventListener('change', () => {
                currentPage = 1;
                loadBooks(); // Use loadBooks instead of loadTabContent
            });
        }
    });

    // Add event listener for search input with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            loadBooks(); // Use loadBooks instead of loadTabContent
        }, 300));
    }

    // Add event listener for sort dropdown
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', () => {
            currentPage = 1;
            loadBooks(); // Use loadBooks instead of loadTabContent
        });
    }

    // Initial load of default tab
    loadTabContent('all');
});

// Add to cart functionality
async function addToCart(bookId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Get the button that was clicked
        const button = document.querySelector(`[onclick="addToCart('${bookId}')"]`);
        if (button && button.disabled) {
            const isComingSoon = button.title.includes('not yet available');
            showMessage(
                isComingSoon 
                    ? 'This book is not yet available for purchase' 
                    : 'This book is currently out of stock', 
                'error'
            );
            return;
        }

        const response = await fetch('http://localhost:5000/api/Cart/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookId: bookId,
                quantity: 1
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add to cart');
        }

        const data = await response.json();
        showMessage('Book added to cart successfully!', 'success');
        updateCartCounter();
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add book to cart. Please try again.', 'error');
    }
}

// Bookmark functionality
async function toggleBookmark(bookId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`http://localhost:5000/api/Bookmark/${bookId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to toggle bookmark');
        }

        const data = await response.json();
        const bookmarkBtn = document.querySelector(`[onclick="toggleBookmark('${bookId}')"]`);

        if (data.isBookmarked) {
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            bookmarkBtn.classList.add('bookmarked');
            showMessage('Book added to whitelist!', 'success');
        } else {
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
            bookmarkBtn.classList.remove('bookmarked');
            showMessage('Book removed from whitelist', 'info');
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showMessage('Failed to update bookmark. Please try again.', 'error');
    }
}

// Check bookmark status for multiple books
async function checkBookmarkStatuses(bookIds) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/Bookmark/ids', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bookmark statuses');
        }

        const bookmarkedIds = await response.json();

        bookIds.forEach(bookId => {
            const bookmarkBtn = document.querySelector(`[onclick="toggleBookmark('${bookId}')"]`);
            if (bookmarkBtn) {
                if (bookmarkedIds.includes(bookId)) {
                    bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
                    bookmarkBtn.classList.add('bookmarked');
                } else {
                    bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
                    bookmarkBtn.classList.remove('bookmarked');
                }
            }
        });
    } catch (error) {
        console.error('Error checking bookmark statuses:', error);
    }
}

// Update cart counter
async function updateCartCounter() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/Cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch cart items');
        }

        const items = await response.json();
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        const counter = document.querySelector('.cart-counter');
        if (counter) {
            counter.textContent = totalQuantity;
        }
    } catch (error) {
        console.error('Error updating cart counter:', error);
    }
}

// Show message helper function
function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
    `;
    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}
