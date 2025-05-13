document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const bookGrid = document.querySelector('.book-grid');
    fetchBooks();

    function fetchBooks() {
        const token = localStorage.getItem('token');

        fetch('http://localhost:5000/api/Book', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }
            return response.json();
        })
        .then(books => {
            bookGrid.innerHTML = ''; // Clear existing books
            books.forEach(book => {
                const bookCard = createBookCard(book);
                bookGrid.appendChild(bookCard);
            });
        })
        .catch(error => {
            console.error('Error fetching books:', error);
        });
    }
});

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    card.innerHTML = `
        <div style="aspect-ratio: 1; background: #f0f0f0; margin-bottom: 1rem;"></div>
        <div class="title">${book.title}</div>
        <div class="rating">
            ${'★'.repeat(Math.floor(book.rating || 4))}${'☆'.repeat(5 - Math.floor(book.rating || 4))}
        </div>
        <div class="price">$${book.price.toFixed(2)}</div>
        <div class="stock-status">${book.stock > 0 ? 'In Stock' : 'Out of Stock'}</div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `book-details.html?id=${book.bookId}`;
    });

    return card;
}
