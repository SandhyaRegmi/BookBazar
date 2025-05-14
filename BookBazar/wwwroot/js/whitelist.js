document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    loadWhitelist();
});

async function loadWhitelist() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/Bookmark', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch whitelist');
        }

        const books = await response.json();
        displayWhitelist(books);
    } catch (error) {
        console.error('Error loading whitelist:', error);
        document.getElementById('whitelist-container').innerHTML = `
            <p>Error loading whitelist. Please try again later.</p>
            <p>Details: ${error.message}</p>
        `;
    }
}

function displayWhitelist(books) {
    const container = document.getElementById('whitelist-container');
    if (!books || books.length === 0) {
        container.innerHTML = '<p>Your whitelist is empty.</p>';
        return;
    }

    container.innerHTML = books.map(book => {
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
                <button class="bookmark-btn bookmarked" onclick="toggleBookmark('${book.bookId}')">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        </div>
    `}).join('');
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

async function toggleBookmark(bookId) {
    try {
        const token = localStorage.getItem('token');
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

        // Reload the whitelist after toggling
        loadWhitelist();
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showMessage('Failed to update bookmark. Please try again.', 'error');
    }
}

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

        showMessage('Book added to cart successfully!', 'success');
        updateCartCounter();
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add book to cart. Please try again.', 'error');
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
            counter.textContent = totalQuantity || '';
            counter.style.display = totalQuantity ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error updating cart counter:', error);
    }
}
