class Navigation extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <header class="header">
                <div class="logo">Book<span>Bazaar</span></div>
                <div class="search-container">
                    <input type="text" id="searchInput" class="search-box" placeholder="Search by title, ISBN, author, or description...">
                </div>
                <div class="header-icons" id="headerIcons">
                    <div class="icon cart-icon">
                       <a href="/member/cart.html"><i class="fas fa-shopping-cart"></i><span class="cart-counter">0</span></a>

                    </div>

                    <div class="profile-dropdown">
                        <button class="profile-btn">
                            <i class="fas fa-user-circle"></i>
                            <span id="username">Member</span>
                            <i class="fas fa-caret-down"></i>
                        </button>
                        <div class="dropdown-content">
                            <a href="/member/profile.html"><i class="fas fa-user"></i> Profile</a>
                            <a href="/member/whitelist.html"><i class="fas fa-bookmark"></i> Whitelist</a>
                            <a href="/member/order-history.html"><i class="fas fa-history"></i> Order History</a>
                            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                        </div>
                    </div>
                </div>
            </header>
        `;

        this.setupEventListeners();
        this.updateHeaderIcons();
    }

    setupEventListeners() {
        const logoutBtn = this.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout);
        }



        const searchInput = this.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                if (window.loadBooks) {
                    window.loadBooks();
                }
            }, 300));
        }
    }

    handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    updateHeaderIcons() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const headerIcons = this.querySelector('#headerIcons');
        const username = this.querySelector('#username');

        if (!token) {
            headerIcons.innerHTML = `
                <a href="/login.html" style="text-decoration: none;">
                    <button style="padding: 8px 16px; background-color: var(--accent); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        Login
                    </button>
                </a>`;
        } else {
            if (username) {
                username.textContent = user.username || 'Member';
            }
            this.updateCartCounter();
        }
    }

    async updateCartCounter() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/Cart', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cart items');
            }

            const items = await response.json();
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

            const counter = this.querySelector('.cart-counter');
            if (counter) {
                counter.textContent = totalQuantity || '';
                counter.style.display = totalQuantity ? 'flex' : 'none';
            }
        } catch (error) {
            console.error('Error updating cart counter:', error);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

customElements.define('nav-component', Navigation); 