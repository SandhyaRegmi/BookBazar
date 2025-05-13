document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (bookId) {
        fetchBookDetails(bookId);
        // Check bookmark status immediately when page loads
        checkBookmarkStatus(bookId);
    }

    const bookmarkBtn = document.querySelector('.bookmark-btn');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    bookmarkBtn.addEventListener('click', () => {
        toggleBookmark(bookId, bookmarkBtn);
    });

    addToCartBtn.addEventListener('click', () => {
        addToCart(bookId);
    });
});

// Update checkBookmarkStatus function
function checkBookmarkStatus(bookId) {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/Bookmark/ids', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch bookmark status');
        }
        return response.json();
    })
    .then(bookmarkedIds => {
        const bookmarkBtn = document.querySelector('.bookmark-btn');
        const messageElement = document.querySelector('.bookmark-message');
        
        if (bookmarkedIds.includes(bookId)) {
            bookmarkBtn.textContent = '❤️';
            messageElement.innerHTML = `✅ Book bookmarked — <a href="whitelist.html">View Whitelist</a>`;
            messageElement.style.color = '#2ecc71';
        } else {
            bookmarkBtn.textContent = '🤍';
            messageElement.textContent = '';
        }
    })
    .catch(error => {
        console.error('Error fetching bookmark status:', error);
    });
}

// Update toggleBookmark function
function toggleBookmark(bookId, buttonElement) {
    const token = localStorage.getItem('token');

    fetch(`http://localhost:5000/api/Bookmark/${bookId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle bookmark');
        }
        return response.json();
    })
    .then(data => {
        const messageElement = document.querySelector('.bookmark-message');
        if (data.isBookmarked) {
            buttonElement.textContent = '❤️';
            messageElement.innerHTML = `✅ Book bookmarked — <a href="whitelist.html">View Whitelist</a>`;
            messageElement.style.color = '#2ecc71';
        } else {
            buttonElement.textContent = '🤍';
            messageElement.textContent = '❌ Bookmark removed';
            messageElement.style.color = '#e74c3c';
        }
    })
    .catch(error => {
        console.error('Error toggling bookmark:', error);
        alert('Failed to update bookmark. Please try again.');
    });
}

function fetchBookDetails(bookId) {
    const token = localStorage.getItem('token');

    fetch(`http://localhost:5000/api/Book/${bookId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch book details');
        }
        return response.json();
    })
    .then(book => {
        updateBookDetails(book);
        checkBookmarkStatus(book.bookId); // Check from server
    })
    .catch(error => {
        console.error('Error fetching book details:', error);
    });
}

function updateBookDetails(book) {
    document.title = `${book.title} - BookBazar`;
    document.querySelector('.book-title').textContent = book.title;
    document.querySelector('.author').textContent = `Author: ${book.author}`;
    document.querySelector('.isbn').textContent = `ISBN: ${book.isbn}`;
    document.querySelector('.language').textContent = `Language: ${book.language}`;
    document.querySelector('.genre').textContent = `Genre: ${book.genre}`;
    document.querySelector('.format').textContent = `Format: ${book.format}`;
    document.querySelector('.price').textContent = `Price: $${book.price.toFixed(2)}`;
    document.querySelector('.book-description').textContent = book.description;
    document.querySelector('.rating').innerHTML =
        '★'.repeat(Math.floor(book.rating || 4)) + '☆'.repeat(5 - Math.floor(book.rating || 4));
    
    const stockStatus = document.querySelector('.stock-status');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    
    if (book.stock > 0) {
        stockStatus.textContent = 'In Stock';
        stockStatus.style.color = '#2ecc71';
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = 'Add to Cart';
    } else {
        stockStatus.textContent = 'Out of Stock';
        stockStatus.style.color = '#e74c3c';
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Out of Stock';
    }
}

function addToCart(bookId) {
    const token = localStorage.getItem('token');
    
    // Check if token exists and is valid
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const cartData = {
        bookId: bookId,
        quantity: 1
    };

    fetch('http://localhost:5000/api/Cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cartData)
    })
    .then(async response => {
        const data = await response.json();
        
        if (!response.ok) {
            // If token is invalid or expired, redirect to login
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(data.error || 'Failed to add to cart');
        }
        
        return data;
    })
    .then(data => {
        const messageElement = document.createElement('div');
        messageElement.textContent = 'Book added to cart successfully!';
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(messageElement);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
        
        updateCartCounter();
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = error.message === 'Failed to add to cart' ? 
            'Failed to add to cart. Please try again.' : error.message;
        
        const messageElement = document.createElement('div');
        messageElement.textContent = errorMessage;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(messageElement);
        
        // Remove the error message after 3 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    });
}

// Add this function
function updateCartCounter() {
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:5000/api/Cart', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(items => {
        const counter = document.querySelector('.cart-counter');
        counter.textContent = items.length;
    })
    .catch(error => console.error('Error:', error));
}

// Also update the fetchBookDetails function to better handle errors
function fetchBookDetails(bookId) {
    const token = localStorage.getItem('token');

    fetch(`http://localhost:5000/api/Book/${bookId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(async response => {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch book details');
        }
        return response.json();
    })
    .then(book => {
        if (!book) {
            throw new Error('Book not found');
        }
        updateBookDetails(book);
    })
    .catch(error => {
        console.error('Error fetching book details:', error);
        alert(error.message);
    });
}