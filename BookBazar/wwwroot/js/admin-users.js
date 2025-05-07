document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const confirmModal = document.getElementById('confirmModal');
    const closeBtns = document.querySelectorAll('.close-btn, #cancelBtn, #confirmCancelBtn');
    const userForm = document.getElementById('userForm');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    // State
    let currentPage = 1;
    let totalPages = 1;
    let users = [];
    let currentAction = 'add';
    let userIdToDelete = null;

    // Initialize
    loadUsers();
    setupEventListeners();

    function setupEventListeners() {
        // Modal controls
        addUserBtn.addEventListener('click', () => openModal('add'));
        
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                userModal.style.display = 'none';
                confirmModal.style.display = 'none';
            });
        });
        
        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadUsers();
            }
        });
        
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadUsers();
            }
        });
        
        // Form submission
        userForm.addEventListener('submit', handleFormSubmit);
        
        // Confirm modal actions
        document.getElementById('confirmActionBtn').addEventListener('click', confirmDelete);
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === userModal) {
                userModal.style.display = 'none';
            }
            if (event.target === confirmModal) {
                confirmModal.style.display = 'none';
            }
        });
    }

    function loadUsers() {
        const token = localStorage.getItem('token');
        
        fetch(`/api/UserManagement`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        })
        .then(data => {
            users = data;
            renderUsers();
            updatePagination();
        })
        .catch(error => {
            console.error('Error loading users:', error);
            alert('Failed to load users. Please try again.');
        });
    }

    function renderUsers() {
        usersTable.innerHTML = '';
        
        if (users.length === 0) {
            const row = usersTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'No users found';
            cell.style.textAlign = 'center';
            return;
        }
        
        users.forEach(user => {
            const row = usersTable.insertRow();
            
            row.insertCell().textContent = user.username;
            row.insertCell().textContent = user.email;
            row.insertCell().textContent = user.phoneNumber || '-';
            row.insertCell().textContent = user.role;
            row.insertCell().textContent = new Date(user.membershipDate).toLocaleDateString();
            
            const discountCell = row.insertCell();
            discountCell.textContent = user.hasActiveDiscount 
                ? `${user.discountPercentage}%` 
                : 'None';
            
            const actionsCell = row.insertCell();
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'action-btns';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-edit';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.addEventListener('click', () => openModal('edit', user));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
            deleteBtn.addEventListener('click', () => confirmAction(user.id));
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            actionsCell.appendChild(actionsDiv);
        });
    }

    function updatePagination() {
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    function openModal(action, user = null) {
        currentAction = action;
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('userForm');
        
        // Reset form and errors
        form.reset();
        clearErrors();
        
        if (action === 'add') {
            modalTitle.textContent = 'Add New User';
            document.getElementById('password').required = true;
            document.getElementById('confirmPassword').required = true;
            document.getElementById('role').value = 'Member'; // Default to Member
        } else {
            modalTitle.textContent = 'Edit User';
            document.getElementById('password').required = false;
            document.getElementById('confirmPassword').required = false;
            
            // Populate form with user data
            document.getElementById('userId').value = user.id;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phoneNumber || '';
            document.getElementById('role').value = user.role;
            document.getElementById('hasDiscount').checked = user.hasActiveDiscount;
            document.getElementById('discountPercentage').value = user.discountPercentage || 0;
        }
        
        userModal.style.display = 'block';
    }

    function confirmAction(userId) {
        userIdToDelete = userId;
        document.getElementById('confirmMessage').textContent = 
            'Are you sure you want to delete this user? This action cannot be undone.';
        confirmModal.style.display = 'block';
    }

    function confirmDelete() {
        const token = localStorage.getItem('token');
        
        fetch(`/api/UserManagement/${userIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            return response.json();
        })
        .then(() => {
            confirmModal.style.display = 'none';
            loadUsers();
            alert('User deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Please try again.');
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        const formData = getFormData();
        
        if (!validateForm(formData)) {
            return;
        }
        
        const url = currentAction === 'add' 
            ? '/api/UserManagement' 
            : `/api/UserManagement/${document.getElementById('userId').value}`;
            
        const method = currentAction === 'add' ? 'POST' : 'PUT';
        
        fetch(url, {
            method: method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    handleFormErrors(err);
                    throw new Error('Form submission failed');
                });
            }
            return response.json();
        })
        .then(() => {
            userModal.style.display = 'none';
            loadUsers();
            alert(`User ${currentAction === 'add' ? 'created' : 'updated'} successfully`);
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            if (!error.message.includes('Form submission failed')) {
                alert('An error occurred. Please try again.');
            }
        });
    }

    function getFormData() {
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phoneNumber: document.getElementById('phone').value.trim(),
            role: document.getElementById('role').value
        };
        
        // Only include password if it's provided (for edit) or required (for add)
        const password = document.getElementById('password').value.trim();
        if (password || currentAction === 'add') {
            formData.password = password;
            formData.confirmPassword = document.getElementById('confirmPassword').value.trim();
        }
        
        // Include discount information
        formData.hasActiveDiscount = document.getElementById('hasDiscount').checked;
        formData.discountPercentage = parseFloat(document.getElementById('discountPercentage').value) || 0;
        
        return formData;
    }

    function validateForm(formData) {
        let isValid = true;
        clearErrors();
        
        // Username validation
        if (!formData.username) {
            showError('username-error', 'Username is required');
            isValid = false;
        } else if (formData.username.length < 3) {
            showError('username-error', 'Username must be at least 3 characters');
            isValid = false;
        }
        
        // Email validation
        if (!formData.email) {
            showError('email-error', 'Email is required');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            showError('email-error', 'Please enter a valid email');
            isValid = false;
        }
        
        // Phone validation
        if (formData.phoneNumber && !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phoneNumber)) {
            showError('phone-error', 'Please enter a valid phone number');
            isValid = false;
        }
        
        // Role validation
        if (!formData.role) {
            showError('role-error', 'Role is required');
            isValid = false;
        }
        
        // Password validation
        if (currentAction === 'add') {
            if (!formData.password) {
                showError('password-error', 'Password is required');
                isValid = false;
            } else if (formData.password.length < 6) {
                showError('password-error', 'Password must be at least 6 characters');
                isValid = false;
            }
            
            if (formData.password !== formData.confirmPassword) {
                showError('confirmPassword-error', 'Passwords do not match');
                isValid = false;
            }
        } else if (formData.password && formData.password.length < 6) {
            showError('password-error', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        return isValid;
    }

    function handleFormErrors(errors) {
        clearErrors();
        
        if (errors.errors) {
            for (const [field, message] of Object.entries(errors.errors)) {
                const errorElement = document.getElementById(`${field}-error`);
                if (errorElement) {
                    errorElement.textContent = message;
                    errorElement.style.display = 'block';
                }
            }
        } else if (errors.message) {
            alert(errors.message);
        }
    }

    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    function clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }
});