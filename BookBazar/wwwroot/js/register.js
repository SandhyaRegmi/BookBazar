document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user) {
        // Redirect based on role
        switch (user.role) {
            case 'Admin':
                window.location.href = '/admin/dashboard.html';
                return;
            case 'Staff':
                window.location.href = '/staff/dashboard.html';
                return;
            default:
                window.location.href = '/member/dashboard.html';
                return;
        }
    }
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    
   
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        
        clearErrors();
        
      
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        
       
        let isValid = true;
        
        if (!username) {
            showError('username-error', 'Username is required');
            isValid = false;
        } else if (username.length < 3) {
            showError('username-error', 'Username must be at least 3 characters');
            isValid = false;
        }
        
        if (!email) {
            showError('email-error', 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('email-error', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
            showError('phone-error', 'Please enter a valid phone number');
            isValid = false;
        }
        
        if (!password) {
            showError('password-error', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showError('password-error', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        if (!confirmPassword) {
            showError('confirm-password-error', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('confirm-password-error', 'Passwords do not match');
            isValid = false;
        }
        
        if (!isValid) return;
        
        try {
            // Show loading state
            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Registering...';
            
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    phoneNumber, 
                    password, 
                    confirmPassword 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
               
                showMessage('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html?message=Registration successful! Please login.';
                }, 2000);
            } else {
               
                showMessage(data.message || 'Registration failed', 'error');
                
                
                if (data.errors) {
                    if (data.errors.username) {
                        showError('username-error', data.errors.username);
                    }
                    if (data.errors.email) {
                        showError('email-error', data.errors.email);
                    }
                    if (data.errors.phoneNumber) {
                        showError('phone-error', data.errors.phoneNumber);
                    }
                    if (data.errors.password) {
                        showError('password-error', data.errors.password);
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred during registration. Please try again.', 'error');
        } finally {
          
            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    });
    
    // Helper functions
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
    
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function isValidPhoneNumber(phone) {
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(phone);
    }
});