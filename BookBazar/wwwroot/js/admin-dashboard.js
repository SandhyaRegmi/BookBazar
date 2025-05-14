document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'Admin') {
        window.location.href = '/login.html';
        return;
    }
    
    document.getElementById('adminName').textContent = user.username;
    
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-collapsed');
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
            sidebar.classList.add('sidebar-collapsed');
        }
    });
});