document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin before loading the page
    try {
        requireRole(['Admin']);
        await loadBooks();
    } catch (error) {
        console.error('Authorization error:', error);
        window.location.href = '/unauthorized.html';
    }

    document.querySelector('.add-btn').addEventListener('click', () => {
        window.location.href = 'add-book.html';
    });
});

// Role-based access control
// parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (error) {
        console.error('Error parsing JWT:', error);
        return null;
    }
}

// Check if user has the required role
function requireRole(roles) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        throw new Error('Not logged in');
    }

    const tokenData = parseJwt(token);
    if (!tokenData) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        throw new Error('Invalid token');
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenData.exp && tokenData.exp < currentTime) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        throw new Error('Token expired');
    }

    // Check role
    const userRole = tokenData.role;
    if (!roles.includes(userRole)) {
        window.location.href = '/unauthorized.html';
        throw new Error('Unauthorized');
    }

    return true;
}

// Update the loadBooks function with error handling
async function loadBooks() {
    try {
        const token = localStorage.getItem('token');
        if (!requireRole(['Admin'])) {
            return;
        }

        const response = await fetch('http://localhost:5000/api/Book', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            if (response.status === 403) {
                window.location.href = '/unauthorized.html';
                return;
            }
            throw new Error(`Failed to load books: ${response.status} ${response.statusText}`);
        }
        
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        showError('Failed to load books. Please try again later.');
        
        // Show error in table
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #cc0000;">Failed to load books</td></tr>';
    }
}

//  event listener for the add button
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if user is admin before loading the page
        requireRole(['Admin']);
        await loadBooks();

        // Add event listener for the add button
        const addButton = document.querySelector('.add-btn');
        if (addButton) {
            addButton.addEventListener('click', () => {
                window.location.href = 'add-book.html';
            });
        }
    } catch (error) {
        showError(error.message || 'You are not authorized to access this page');
    }
});

// deleteBook function 
async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!requireRole(['Admin'])) {
            return;
        }

        const response = await fetch(`http://localhost:5000/api/Book/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            if (response.status === 403) {
                showError('You do not have permission to delete books');
                return;
            }
            throw new Error(`Failed to delete book: ${response.status}`);
        }

        await loadBooks();
        showSuccess('Book deleted successfully');
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to delete book');
    }
}

// Add success message function
function showSuccess(message) {
    const mainContent = document.querySelector('.main-content');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.color = '#007700';
    successDiv.style.padding = '10px';
    successDiv.style.marginBottom = '10px';
    successDiv.style.backgroundColor = '#eeffee';
    successDiv.style.borderRadius = '4px';
    successDiv.textContent = message;
    
    mainContent.insertBefore(successDiv, mainContent.firstChild);

    // Remove the message after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function showError(message) {
    const mainContent = document.querySelector('.main-content');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#cc0000';
    errorDiv.style.padding = '10px';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.backgroundColor = '#ffeeee';
    errorDiv.style.borderRadius = '4px';
    errorDiv.textContent = message;
    
    // Insert at the top of main content
    mainContent.insertBefore(errorDiv, mainContent.firstChild);
}

async function loadBooks() {
    try {
        // Show loading indicator
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Loading books...</td></tr>';
        
        const token = localStorage.getItem('token');
        if (!requireRole(['Admin'])) {
            return;
        }

        const response = await fetch('http://localhost:5000/api/Book', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            if (response.status === 403) {
                window.location.href = '/unauthorized.html';
                return;
            }
            throw new Error(`Failed to load books: ${response.status} ${response.statusText}`);
        }
        
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        showError('Failed to load books. Please try again later.');
        
        // Show error in table
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #cc0000;">Failed to load books</td></tr>';
    }
}

function displayBooks(books) {
    const tbody = document.querySelector('tbody');
    
    if (!books || books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">No books found</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => `
        <tr>
            <td>
                <div style="display: flex; align-items: center;">
                    <img src="${getBookImageSrc(book)}" 
                         alt="${escapeHtml(book.title)}" 
                         style="width: 50px; height: 70px; object-fit: cover; margin-right: 10px;"
                         onerror="this.src='images/default-book-cover.jpg'">
                    <div>
                        <strong>${escapeHtml(book.title)}</strong><br>
                        <small>By ${escapeHtml(book.author || 'Unknown')}</small>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(book.isbn || 'N/A')}</td>
            <td>${book.description ? escapeHtml(book.description.substring(0, 100) + (book.description.length > 100 ? '...' : '')) : 'N/A'}</td>
            <td>${escapeHtml(book.language || 'N/A')}</td>
            <td>${escapeHtml(book.format || 'N/A')}</td>
            <td>$${book.price ? book.price.toFixed(2) : '0.00'}</td>
            <td>${book.stock || 0}</td>
            <td>${book.publicationDate ? new Date(book.publicationDate).toLocaleDateString() : 'N/A'}</td>
            <td>${escapeHtml(book.categories || 'N/A')}</td>
            <td>
                <button class="action-btn" onclick="editBook('${book.bookId}')" 
                        style="border-color: #0066cc; color: #0066cc;">Edit</button>
                <button class="action-btn" onclick="deleteBook('${book.bookId}')"
                        style="border-color: #cc0000; color: #cc0000;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function getBookImageSrc(book) {
    if (book.imageData && book.imageContentType) {
        // Check if imageData is a string or array
        if (typeof book.imageData === 'string') {
            return `data:${book.imageContentType};base64,${book.imageData}`;
        } else if (Array.isArray(book.imageData) || book.imageData instanceof Uint8Array) {
            return `data:${book.imageContentType};base64,${arrayBufferToBase64(book.imageData)}`;
        }
    }
    return 'images/default-book-cover.jpg';
}

function arrayBufferToBase64(buffer) {
    if (!buffer || buffer.length === 0) return '';
    
    try {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (e) {
        console.error('Error converting image data:', e);
        return '';
    }
}

function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function deleteBook(bookId) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/Book/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            } else if (response.status === 403) {
                showError('You do not have permission to delete books');
                return;
            }
            throw new Error(`Failed to delete book: ${response.status} ${response.statusText}`);
        }
        
        await loadBooks();
        alert('Book deleted successfully');
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to delete book. Please try again later.');
    }
}

function editBook(bookId) {
    window.location.href = `edit-book.html?id=${bookId}`;
}