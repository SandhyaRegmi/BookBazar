document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    fetchCartItems();
    updateCartCounter();
    // Add select all functionality
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
    // Add checkout button click handler
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});

function fetchCartItems() {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/Cart', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(items => {
        displayCartItems(items);
        updateTotals(); // Change this from updateOrderSummary to updateTotals
    })
    .catch(error => console.error('Error:', error));
}

function handleSelectAll(event) {
    const checkboxes = document.querySelectorAll('.cart-item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked;
    });
    updateTotals();
}


function updateTotals() {
    const items = Array.from(document.querySelectorAll('.cart-item'))
        .filter(item => item.querySelector('.cart-item-checkbox').checked)
        .map(item => ({
            price: parseFloat(item.querySelector('.cart-item-details p').textContent.replace('Rs. ', '')),
            quantity: parseInt(item.querySelector('.quantity-controls span').textContent)
        }));

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update the display with correct quantity and price
    document.querySelector('.subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
    document.querySelector('.total').textContent = `Rs. ${subtotal.toFixed(2)}`;
    
    // Update the subtotal label with correct class name
    const subtotalLabel = document.querySelector('.subtotal-label');
    if (subtotalLabel) {
        subtotalLabel.textContent = `Subtotal (${totalQuantity} item${totalQuantity === 1 ? '' : 's'})`;
    }
}

function displayCartItems(items) {
    const cartItemsContainer = document.querySelector('.cart-items');
    cartItemsContainer.innerHTML = items.map(item => `
        <div class="cart-item" data-id="${item.cartItemId}">
            <input type="checkbox" class="cart-item-checkbox">
            <div class="cart-item-image"></div>
            <div class="cart-item-details">
                <h3>${item.book.title}</h3>
                <p>Rs. ${item.book.price}</p>
            </div>
            <div class="quantity-controls">
                <button onclick="updateQuantity('${item.cartItemId}', ${item.quantity - 1})" 
                        ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity('${item.cartItemId}', ${item.quantity + 1})">+</button>
            </div>
            <button class="delete-btn" onclick="deleteItem('${item.cartItemId}')">Remove</button>
        </div>
    `).join('');

    // Reattach checkbox change listeners after rendering
    const checkboxes = document.querySelectorAll('.cart-item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateTotals();
            updateSelectAllCheckbox();
        });
    });
}

function updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('.cart-item-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);

    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.checked = allChecked;
        selectAll.indeterminate = !allChecked && anyChecked;
    }
}


function updateCartCounter() {
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:5000/api/Cart', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(items => {
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const counter = document.querySelector('.cart-counter');
        if (counter) {
            counter.textContent = totalQuantity;
        }
    })
    .catch(error => console.error('Error:', error));
}

// Add this function to your cart.js
function updateQuantity(cartItemId, newQuantity) {
    if (newQuantity < 1) return;
    
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/Cart/update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            cartItemId: cartItemId,
            quantity: newQuantity
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update quantity');
        return response.json();
    })
    .then(() => {
        fetchCartItems(); // Refresh cart items
        updateCartCounter(); // Update the cart counter
        updateTotals(); // Update order summary
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update quantity');
    });
}


function deleteItem(cartItemId) {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/Cart/update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            cartItemId: cartItemId,
            quantity: 0  // Setting quantity to 0 will trigger deletion in the backend
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to remove item');
        return response.json();
    })
    .then(() => {
        fetchCartItems(); // Refresh cart items
        updateCartCounter(); // Update the cart counter
        updateTotals(); // Update order summary
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to remove item');
    });
}


function handleCheckout() {
    const checkedItems = document.querySelectorAll('.cart-item-checkbox:checked');
    if (checkedItems.length === 0) {
        alert('Please select at least one item to checkout');
        return;
    }
    
    window.location.href = 'order.html';
}

