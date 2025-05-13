class NavigationManager {
    constructor() {
        this.topNavContainer = document.getElementById('adminTopNav');
        this.sidebarContainer = document.getElementById('adminSideBar');
        this.sidebarMenuItems = [
            { href: "/admin/dashboard.html", icon: "fas fa-tachometer-alt", text: "Dashboard" },
            { href: "/admin/book-management.html", icon: "fas fa-book", text: "Book Management" },
            { href: "/admin/admin-users.html", icon: "fas fa-users", text: "User Management" },
            { href: "/admin/inventory.html", icon: "fas fa-boxes", text: "Inventory" },
            { href: "/admin/announcement-management.html", icon: "fas fa-tag", text: "Announcement" },
            { href: "/admin/discounts.html", icon: "fas fa-tag", text: "Discounts" },
            { href: "/admin/reports.html", icon: "fas fa-chart-line", text: "Reports" }
        ];
    }

    async loadNavigation() {
        try {
            await this.loadTopNav();
            await this.loadSidebar();
            this.initializeNavigation();
        } catch (error) {
            console.error('Navigation loading failed:', error);
            setTimeout(() => {
                if (!this.topNavContainer.hasChildNodes()) {
                    window.location.href = '/login.html';
                }
            }, 2000);
        }
    }

    async loadTopNav() {
        const response = await fetch('/components/adminTopNav.html');
        this.topNavContainer.innerHTML = await response.text();
    }

    async loadSidebar() {
        const response = await fetch('/components/adminSideBar.html');
        this.sidebarContainer.innerHTML = await response.text();
        this.renderSidebarMenu();
    }

    renderSidebarMenu() {
        const menuContainer = document.querySelector('.sidebar-menu');
        if (!menuContainer) return;

        menuContainer.innerHTML = this.sidebarMenuItems.map(item => `
            <li>
                <a href="${item.href}">
                    <i class="${item.icon}"></i>
                    <span>${item.text}</span>
                </a>
            </li>
        `).join('');
    }

    initializeNavigation() {
        // Authentication check
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user || user.role !== 'Admin') {
            window.location.href = '/login.html';
            return;
        }
        
        // Set admin name
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement && user.username) {
            adminNameElement.textContent = user.username;
        }

        // Set page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
            const formattedTitle = currentPage
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            pageTitle.textContent = formattedTitle || 'Admin Dashboard';
        }

        // Initialize sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('sidebar-collapsed');
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('sidebar-open');
                }
            });
        }

        // Initialize logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            });
        }

        // Set active menu item
        const currentPath = window.location.pathname;
        const menuItems = document.querySelectorAll('.sidebar-menu a');
        menuItems.forEach(item => {
            if (item.getAttribute('href') === currentPath) {
                item.parentElement.classList.add('active');
            }
        });
    }
}

const navigationManager = new NavigationManager();
export default navigationManager;