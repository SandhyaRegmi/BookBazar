document.addEventListener('DOMContentLoaded', () => {
    try {
        requireRole(['Admin']);
        const form = document.getElementById('addBookForm');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();

            const imageFile = form.image.files[0];
            if (imageFile) {
                formData.append('Image', imageFile);
            }

            formData.append('Title', form.title.value);
            formData.append('ISBN', form.isbn.value);
            formData.append('Author', form.author.value);
            formData.append('Description', form.description.value);
            formData.append('Language', form.language.value);
            formData.append('Format', form.format.value);
            formData.append('Price', form.price.value);
            formData.append('Stock', form.stock.value);
            formData.append('PublicationDate', form.publicationDate.value);
            formData.append('Publisher', form.publisher.value);
            formData.append('Categories', form.categories.value);
            formData.append('Genre', form.genre.value);
            formData.append('IsAvailableInLibrary', form.isAvailableInLibrary.checked.toString());

            try {
                const response = await fetch('http://localhost:5000/api/Book', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                       
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.title || 'Failed to add book');
                }

                const result = await response.json();
                alert('Book added successfully!');
                window.location.href = 'Dashboard.html';
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'Failed to add book. Please try again.');
            }
        });
    } catch (error) {
        console.error('Authorization error:', error);
        window.location.href = '/unauthorized.html';
    }
});