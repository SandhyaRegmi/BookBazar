document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('loginButton');

    loginButton.disabled = true;
    try {
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
            
            // Redirect based on user role
            switch (data.user.role) {
                case 'Admin':
                    window.location.href = 'adminDashboard.html';
                    break;
                case 'Staff':
                    window.location.href = 'staffDashboard.html';
                    break;
                default:
                    window.location.href = 'home.html';
                    break;
            }
        } else {
            alert(data.message || 'Login failed');
            loginButton.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login');
        loginButton.disabled = false;
    }
});