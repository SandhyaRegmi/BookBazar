document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadWhitelist();
});

function loadWhitelist() {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/Bookmark', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch whitelist');
        return response.json();
    })
    .then(books => {
        const container = document.getElementById('whitelist-container');
        if (books.length === 0) {
            container.innerHTML = '<p>No books in your whitelist.</p>';
            return;
        }

        container.innerHTML = '';
        books.forEach(book => {
            const card = document.createElement('div');
            card.classList.add('book-card');
            card.innerHTML = `
                <h2>${book.title}</h2>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Genre:</strong> ${book.genre}</p>
                <p><strong>Price:</strong> $${book.price.toFixed(2)}</p>
                <div class="actions">
                    <a href="book-details.html?id=${book.bookId}" class="view-details">View Details</a>
                    <button class="add-to-cart-btn" onclick="addToCart('${book.bookId}')">Add to Cart</button>
                    <button class="bookmark-btn" onclick="toggleBookmark('${book.bookId}', this)">❤️</button>
                </div>
                <div class="message"></div>
            `;
            container.appendChild(card);
        });
    })
    .catch(error => {
        console.error('Error loading whitelist:', error);
        document.getElementById('whitelist-container').textContent = 'Error loading your bookmarked books.';
    });
}

function toggleBookmark(bookId, buttonElement) {
    const token = localStorage.getItem('token');
    const card = buttonElement.closest('.book-card');
    const messageDiv = card.querySelector('.message');

    fetch(`http://localhost:5000/api/Bookmark/${bookId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to toggle bookmark');
        return response.json();
    })
    .then(data => {
        if (!data.isBookmarked) {
            messageDiv.textContent = '❌ Bookmark removed';
            messageDiv.className = 'message error-message';
            // Remove the card after a short delay
            setTimeout(() => {
                card.remove();
                if (document.querySelectorAll('.book-card').length === 0) {
                    document.getElementById('whitelist-container').innerHTML = '<p>No books in your whitelist.</p>';
                }
            }, 1000);
        }
    })
    .catch(error => {
        console.error('Error toggling bookmark:', error);
        messageDiv.textContent = 'Failed to update bookmark';
        messageDiv.className = 'message error-message';
    });
}

function addToCart(bookId) {
    const token = localStorage.getItem('token');
    
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
        if (!response.ok) throw new Error(data.error || 'Failed to add to cart');
        return data;
    })
    .then(() => {
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
        
        setTimeout(() => messageElement.remove(), 3000);
    })
    .catch(error => {
        console.error('Error:', error);
        const messageElement = document.createElement('div');
        messageElement.textContent = 'Failed to add to cart. Please try again.';
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
        
        setTimeout(() => messageElement.remove(), 3000);
    });
}
