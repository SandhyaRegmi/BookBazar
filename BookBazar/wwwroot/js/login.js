document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user) {
        // Redirect based on role
        switch (user.role) {
            case 'Admin':
                window.location.replace('/admin/dashboard.html');
                return;
            case 'Staff':
                window.location.replace('/staff/dashboard.html');
                return;
            case 'Member':
                window.location.replace('/member/dashboard.html');
                return;
        }
    }

    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    
   
    
    const urlParams = new URLSearchParams(window.location.search);
    const redirectMessage = urlParams.get('message');
    if (redirectMessage) {
        showMessage(redirectMessage, 'success');
    }
    
   
    // Event listener for form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        let isValid = true;
        
        if (!username) {
            showError('username-error', 'Username is required');
            isValid = false;
        }
        
        if (!password) {
            showError('password-error', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showError('password-error', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        if (!isValid) return;
        
        try {
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';
            
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    password 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    switch (data.user.role) {
                        case 'Admin':
                            window.location.href = '/admin/dashboard.html';
                            break;
                        case 'Staff':
                            window.location.href = '/staff/dashboard.html';
                            break;
                        default:
                            window.location.href = '/member/dashboard.html';
                            break;
                    }
                }, 1500);
            } else {
                showMessage(data.message || 'Login failed', 'error');
                
                if (data.errors) {
                    if (data.errors.username) {
                        showError('username-error', data.errors.username);
                    }
                    if (data.errors.password) {
                        showError('password-error', data.errors.password);
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred during login. Please try again.', 'error');
        } finally {
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
    
    
    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
        }
    }
    
    function clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.textContent = '');
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }
    
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
    }
});