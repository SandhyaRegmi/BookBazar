document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'Admin') {
        window.location.href = '/login.html';
        return;
    }
    
    // Set admin name
    document.getElementById('adminName').textContent = user.username;
    
    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('sidebar-collapsed');
    });
    
    
    
   
    // Add responsive sidebar toggle for mobile
    window.addEventListener('resize', function() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('sidebar-collapsed');
        }
    });
});