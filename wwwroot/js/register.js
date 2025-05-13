document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const registerButton = document.getElementById('registerButton');

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    registerButton.disabled = true;
    try {
        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                confirmPassword,
                phoneNumber
            }),
        },
        );

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Registration failed');
            registerButton.disabled=false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration');
    }
});