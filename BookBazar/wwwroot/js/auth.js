function checkUserRole() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return null;
    }
}

function requireRole(allowedRoles) {
    const userRole = checkUserRole();
    if (!userRole || !allowedRoles.includes(userRole)) {
        window.location.href = 'unauthorized.html';
    }
}