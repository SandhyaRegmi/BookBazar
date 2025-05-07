document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addBookForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: form.title.value,
            isbn: form.isbn.value,
            author: form.author.value,
            description: form.description.value,
            language: form.language.value,
            format: form.format.value,
            price: parseFloat(form.price.value),
            stock: parseInt(form.stock.value),
            publicationDate: form.publicationDate.value,
            categories: form.categories.value,
            genre: form.genre.value
        };

        try {
            const response = await fetch('http://localhost:5000/api/Book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to add book');
            }

            alert('Book added successfully!');
            window.location.href = 'catalog.html';
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add book. Please try again.');
        }
    });

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Admin') {
        alert('Unauthorized access');
        window.location.href = 'catalog.html';
    }
});