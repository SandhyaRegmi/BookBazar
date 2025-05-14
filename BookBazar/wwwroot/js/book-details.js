document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Verify token format and expiration
    try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        // Decode the payload
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Check if token is expired
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        if (Date.now() >= expirationTime) {
            throw new Error('Token expired');
        }

        // Check for required claims
        if (!payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] && !payload.sub) {
            throw new Error('Token missing user identifier');
        }
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (bookId) {
        fetchBookDetails(bookId);
        checkBookmarkStatus(bookId);
    }

    const bookmarkBtn = document.querySelector('.bookmark-btn');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
            toggleBookmark(bookId, bookmarkBtn);
        });
    }

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            addToCart(bookId);
        });
    }
});

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function checkBookmarkStatus(bookId) {
    try {
        fetch('http://localhost:5000/api/Bookmark/ids', {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    const isTokenExpired = response.headers.get('Token-Expired') === 'true';
                    if (isTokenExpired) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login.html';
                    }
                    throw new Error('Authentication failed');
                }
                throw new Error('Failed to fetch bookmark status');
            }
            return response.json();
        })
        .then(bookmarkedIds => {
            const bookmarkBtn = document.querySelector('.bookmark-btn');
            const messageElement = document.querySelector('.bookmark-message');
            
            if (bookmarkedIds.includes(bookId)) {
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
                bookmarkBtn.classList.add('bookmarked');
                if (messageElement) {
                    messageElement.innerHTML = `✅ Book bookmarked — <a href="../member/whitelist.html" class="whitelist-link">View Whitelist</a>`;
                    messageElement.style.color = '#2ecc71';
                }
            } else {
                bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
                bookmarkBtn.classList.remove('bookmarked');
                if (messageElement) {
                    messageElement.textContent = '';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching bookmark status:', error);
            if (error.message === 'Authentication failed') {
                return;
            }
            showMessage('Failed to check bookmark status', 'error');
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message, 'error');
    }
}

function toggleBookmark(bookId, buttonElement) {
    try {
        const messageElement = document.querySelector('.bookmark-message');
        if (messageElement) {
            messageElement.style.display = 'none';
        }

        fetch(`http://localhost:5000/api/Bookmark/${bookId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ bookId })
        })
        .then(async response => {
            if (response.status === 401) {
                const isTokenExpired = response.headers.get('Token-Expired') === 'true';
                if (isTokenExpired) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login.html';
                }
                throw new Error('Authentication failed');
            }
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to toggle bookmark');
            }
            return data;
        })
        .then(data => {
            if (messageElement) {
                messageElement.style.display = 'block';
            }
            if (data.isBookmarked) {
                buttonElement.innerHTML = '<i class="fas fa-bookmark"></i>';
                buttonElement.classList.add('bookmarked');
                if (messageElement) {
                    messageElement.innerHTML = `✅ Book bookmarked — <a href="/whitelist.html">View Whitelist</a>`;
                    messageElement.style.color = '#2ecc71';
                }
            } else {
                buttonElement.innerHTML = '<i class="far fa-bookmark"></i>';
                buttonElement.classList.remove('bookmarked');
                if (messageElement) {
                    messageElement.textContent = '❌ Bookmark removed';
                    messageElement.style.color = '#e74c3c';
                }
            }
        })
        .catch(error => {
            console.error('Error toggling bookmark:', error);
            if (error.message === 'Authentication failed') {
                return;
            }
            if (messageElement) {
                messageElement.style.display = 'block';
                messageElement.textContent = '❌ Failed to update bookmark. Please try again.';
                messageElement.style.color = '#e74c3c';
            }
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message, 'error');
    }
}

function fetchBookDetails(bookId) {
    const token = localStorage.getItem('token');
    const errorMessageElement = document.querySelector('.error-message');
    errorMessageElement.style.display = 'none'; 

    fetch(`http://localhost:5000/api/Book/${bookId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load book details: ${response.status}`);
        }
        return response.json();
    })
    .then(book => {
        displayBookDetails(book);
        checkBookmarkStatus(bookId);
    })
    .catch(error => {
        console.error('Error:', error);
        errorMessageElement.textContent = 'Failed to load book details';
        errorMessageElement.style.display = 'block'; // Show error message only when there's an error
    });
}

function displayBookDetails(book) {
    document.title = `${book.title} - BookBazar`;

    // Display book image
    const imageContainer = document.querySelector('.book-image');
    if (book.imageData) {
        const img = document.createElement('img');
        img.src = `data:${book.imageContentType};base64,${arrayBufferToBase64(book.imageData)}`;
        img.alt = book.title;
        imageContainer.appendChild(img);
    } else {
        imageContainer.innerHTML = '<div class="no-image">No Image Available</div>';
    }

    // Display book details
    document.querySelector('.book-title').textContent = book.title;
    document.querySelector('.author').textContent = `Author: ${book.author}`;
    document.querySelector('.isbn').textContent = `ISBN: ${book.isbn}`;
    document.querySelector('.language').textContent = `Language: ${book.language}`;
    document.querySelector('.genre').textContent = `Genre: ${book.genre}`;
    document.querySelector('.format').textContent = `Format: ${book.format}`;
    document.querySelector('.publisher').textContent = `Publisher: ${book.publisher}`;
    document.querySelector('.publication-date').textContent = `Publication Date: ${new Date(book.publicationDate).toLocaleDateString()}`;
    document.querySelector('.categories').textContent = `Categories: ${book.categories}`;
    document.querySelector('.price').textContent = `Price: Rs. ${book.price.toFixed(2)}`;
    document.querySelector('.book-description').textContent = book.description;

    // Display rating
    const ratingContainer = document.querySelector('.rating');
    ratingContainer.innerHTML = generateRatingStars(book.rating);

    // Handle availability and stock status
    const stockStatus = document.querySelector('.stock-status');
    const libraryStatus = document.querySelector('.library-status');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    // Check if book is coming soon or out of stock
    const isComingSoon = new Date(book.publicationDate) > new Date();
    const isOutOfStock = book.stock <= 0;
    const isAvailable = !isComingSoon && !isOutOfStock;

    // Update stock status and button state
    if (isComingSoon) {
        stockStatus.textContent = 'Coming Soon';
        stockStatus.style.color = '#e67e22';
        addToCartBtn.disabled = true;
        addToCartBtn.style.opacity = '0.6';
        addToCartBtn.style.cursor = 'not-allowed';
        addToCartBtn.title = 'This book is not yet available for purchase';
    } else if (isOutOfStock) {
        stockStatus.textContent = 'Out of Stock';
        stockStatus.style.color = '#e74c3c';
        addToCartBtn.disabled = true;
        addToCartBtn.style.opacity = '0.6';
        addToCartBtn.style.cursor = 'not-allowed';
        addToCartBtn.title = 'This book is currently out of stock';
    } else {
        stockStatus.textContent = `In Stock (${book.stock} available)`;
        stockStatus.style.color = '#27ae60';
        addToCartBtn.disabled = false;
        addToCartBtn.style.opacity = '1';
        addToCartBtn.style.cursor = 'pointer';
        addToCartBtn.title = 'Add to Cart';
    }

    // Library availability
    if (book.isAvailableInLibrary) {
        libraryStatus.textContent = 'Available in Library';
        libraryStatus.style.color = '#27ae60';
    } else {
        libraryStatus.textContent = 'Not Available in Library';
        libraryStatus.style.color = '#e74c3c';
    }

    // Add to cart functionality
    addToCartBtn.addEventListener('click', () => {
        if (!isAvailable) {
            showMessage(
                isComingSoon 
                    ? 'This book is not yet available for purchase' 
                    : 'This book is currently out of stock', 
                'error'
            );
            return;
        }
        addToCart(book.bookId);
    });

    // Bookmark functionality
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', () => {
        toggleBookmark(book.bookId, bookmarkBtn);
    });
}

async function addToCart(bookId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
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

        showMessage('Book added to cart successfully!', 'success');
        updateCartCounter();
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add book to cart. Please try again.', 'error');
    }
}

function updateCartCounter() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/api/Cart', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => response.json())
        .then(items => {
            const counter = document.querySelector('.cart-counter');
            if (counter) {
                const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
                counter.textContent = totalQuantity || '';
                counter.style.display = totalQuantity ? 'flex' : 'none';
            }
        })
        .catch(error => console.error('Error:', error));
}

function generateRatingStars(rating) {
    // Default to 0 if rating is undefined or null
    const ratingValue = rating || 0;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
        ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
        ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
        <span>(${ratingValue.toFixed(1)})</span>
    `;
}

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