function checkUserRole() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found');
        window.location.href = 'login.html';
        return null;
    }

    try {
        // Decode JWT token to get user role
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        console.log('User Role:', role);
        return role;
    } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return null;
    }
}

function requireRole(allowedRoles) {
    const userRole = checkUserRole();
    console.log('Checking role:', userRole, 'Against allowed roles:', allowedRoles);
    if (!userRole || !allowedRoles.includes(userRole)) {
        window.location.href = 'unauthorized.html';
    }
}