document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin before proceeding
    try {
        requireRole(['Admin']);
        
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../login.html';
            return;
        }

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .book-form {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
            }
            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            .description-container {
                grid-column: 1 / -1;
                margin-top: 20px;
            }
            .description-container textarea {
                min-height: 150px;
                resize: vertical;
            }
            button[type="submit"] {
                background-color: #000;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 20px;
                width: 200px;
                transition: background-color 0.3s;
            }
            button[type="submit"]:hover {
                background-color: #333;
            }
        `;
        document.head.appendChild(style);

        // Get book ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');

        if (!bookId) {
            alert('No book ID provided');
            window.location.href = 'bookManagement.html';
            return;
        }

        // Load book data
        try {
            const response = await fetch(`http://localhost:5000/api/Book/${bookId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to load book details');
            }

            const book = await response.json();
            console.log('Book data received:', book);

            // Populate form fields
            document.getElementById('bookId').value = book.bookId;
            document.getElementById('title').value = book.title;
            document.getElementById('isbn').value = book.isbn;
            document.getElementById('author').value = book.author;
            document.getElementById('description').value = book.description;
            document.getElementById('language').value = book.language;
            document.getElementById('format').value = book.format;
            document.getElementById('price').value = book.price;
            document.getElementById('stock').value = book.stock;
            document.getElementById('publicationDate').value = book.publicationDate.split('T')[0];
            document.getElementById('categories').value = book.categories;
            document.getElementById('genre').value = book.genre;
            document.getElementById('publisher').value = book.publisher;
            
            // Set checkbox values correctly
            document.getElementById('isAvailableInLibrary').checked = book.isAvailableInLibrary;
            // Fix this line (it's currently wrong)
            document.getElementById('isAwardWinner').checked = book.isAvailableInLibrary;
            // Should be:
            document.getElementById('isAwardWinner').checked = book.isAwardWinner;
            
            console.log('IsAvailableInLibrary:', book.isAvailableInLibrary);
            console.log('IsAwardWinner:', book.isAwardWinner);
            console.log('Book format from backend:', book.format);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load book details');
            return;
        }

        // Form submission handler
        document.getElementById('editBookForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            
            // Append all text fields
            formData.append('Title', document.getElementById('title').value.trim());
            formData.append('ISBN', document.getElementById('isbn').value.trim());
            formData.append('Author', document.getElementById('author').value.trim());
            formData.append('Description', document.getElementById('description').value.trim());
            formData.append('Language', document.getElementById('language').value.trim());
            formData.append('Format', document.getElementById('format').value);
            formData.append('Price', document.getElementById('price').value);
            formData.append('Stock', document.getElementById('stock').value);
            formData.append('PublicationDate', document.getElementById('publicationDate').value);
            formData.append('Categories', document.getElementById('categories').value.trim());
            formData.append('Publisher', document.getElementById('publisher').value.trim());
            formData.append('Genre', document.getElementById('genre').value.trim());
            
            // Append boolean values correctly
            // Add these lines before the fetch call
            formData.append('IsAvailableInLibrary', document.getElementById('isAvailableInLibrary').checked);
            formData.append('IsAwardWinner', document.getElementById('isAwardWinner').checked);
            
            // Add image only if a new one is selected
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) {
                formData.append('Image', imageFile);
            }

            // Debug logging before submission
            console.log('Submitting form with:');
            console.log('IsAvailableInLibrary:', document.getElementById('isAvailableInLibrary').checked);
            console.log('IsAwardWinner:', document.getElementById('isAwardWinner').checked);

            try {
                const response = await fetch(`http://localhost:5000/api/Book/${bookId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = 'login.html';
                        return;
                    }

                    // Handle validation errors
                    const errorData = await response.json();
                    if (response.status === 400 && errorData.errors) {
                        let errorMessage = 'Please correct the following errors:\n';
                        for (const key in errorData.errors) {
                            errorMessage += `\n- ${errorData.errors[key].join('\n- ')}`;
                        }
                        alert(errorMessage);
                        return;
                    }
                    throw new Error(errorData.message || 'Failed to update book');
                }

                alert('Book updated successfully');
                window.location.href = 'book-management.html';
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to update book. Please check all required fields and try again.');
            }
        });

    } catch (error) {
        console.error('Authorization error:', error);
        window.location.href = '/unauthorized.html';
    }
});