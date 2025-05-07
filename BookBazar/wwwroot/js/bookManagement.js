document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    await loadBooks();

    document.querySelector('.add-btn').addEventListener('click', () => {
        window.location.href = '/admin/add-book.html';
    });
});

async function loadBooks() {
    try {
        const response = await fetch('http://localhost:5000/api/Book', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        alert('Failed to load books');
    }
}

function displayBooks(books) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = books.map(book => `
        <tr>
            <td>${book.bookId}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td>${book.price}</td>
            <td><button class="action-btn" onclick="editBook('${book.bookId}')">Edit</button></td>
            <td><button class="action-btn" onclick="deleteBook('${book.bookId}')">Delete</button></td>
        </tr>
    `).join('');
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
        const response = await fetch(`http://localhost:5000/api/Book/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            await loadBooks();
            alert('Book deleted successfully');
        } else {
            alert('Failed to delete book');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete book');
    }
}

function editBook(bookId) {
    window.location.href = `edit-book.html?id=${bookId}`;
}