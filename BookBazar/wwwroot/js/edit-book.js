document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (!bookId) {
        alert('No book ID provided');
        window.location.href = 'bookManagement.html';
        return;
    }

    // Load book details
    try {
        const response = await fetch(`http://localhost:5000/api/Book/${bookId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load book details');

        const book = await response.json();
        // Populate form fields with book details
        document.getElementById('bookId').value = book.bookId;
        document.getElementById('title').value = book.title;
        document.getElementById('isbn').value = book.isbn;
        document.getElementById('author').value = book.author;
        document.getElementById('description').value = book.description;
        document.getElementById('language').value = book.language;
        document.getElementById('format').value = book.format;
        document.getElementById('price').value = book.price;
        document.getElementById('stock').value = book.stock;
        document.getElementById('genre').value = book.genre;
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load book details');
    }

    // Handle form submission
    document.getElementById('editBookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            bookId: bookId,
            title: document.getElementById('title').value,
            isbn: document.getElementById('isbn').value,
            author: document.getElementById('author').value,
            description: document.getElementById('description').value,
            language: document.getElementById('language').value,
            format: document.getElementById('format').value,
            price: parseFloat(document.getElementById('price').value),
            stock: parseInt(document.getElementById('stock').value),
            genre: document.getElementById('genre').value
        };

        try {
            const response = await fetch(`http://localhost:5000/api/Book/${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update book');

            alert('Book updated successfully');
            window.location.href = '/admin/bookManagement.html';
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update book');
        }
    });
});