// cart.js - Full updated with discount logic on cart page

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    fetchCartItems();
    updateCartCounter();

    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }

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
        updateTotals();
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
        .map(item => {
            const price = parseFloat(item.dataset.price);
            const quantity = parseInt(item.querySelector('.quantity-controls span').textContent);
            const total = price * quantity;
            
            // Update the item total display
            const itemTotal = item.querySelector('.item-total');
            if (itemTotal) {
                itemTotal.textContent = `Total: Rs. ${total.toFixed(2)}`;
            }
            
            return { price, quantity, total };
        });

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    document.querySelector('.subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
    document.querySelector('.total').textContent = `Rs. ${subtotal.toFixed(2)}`;

    const subtotalLabel = document.querySelector('.subtotal-label');
    if (subtotalLabel) {
        subtotalLabel.textContent = `Subtotal (${totalQuantity} item${totalQuantity === 1 ? '' : 's'})`;
    }
}

function displayCartItems(items) {
    const cartItemsContainer = document.getElementById('cartItems');
    
    // Store current checkbox states
    const checkboxStates = new Map();
    document.querySelectorAll('.cart-item-checkbox').forEach(checkbox => {
        const itemId = checkbox.closest('.cart-item')?.dataset.id;
        if (itemId) {
            checkboxStates.set(itemId, checkbox.checked);
        }
    });

    cartItemsContainer.innerHTML = items.map(item => {
        const price = item.book.price;
        const totalPrice = price * item.quantity;
        const isChecked = checkboxStates.get(item.cartItemId) || false;
        
        return `
            <div class="cart-item" data-id="${item.cartItemId}" data-price="${price}">
                <input type="checkbox" class="cart-item-checkbox" ${isChecked ? 'checked' : ''}>
                <div class="cart-item-image">
                    ${item.book.imageData ? 
                        `<img src="data:${item.book.imageContentType};base64,${arrayBufferToBase64(item.book.imageData)}" alt="${item.book.title}">` :
                        '<div class="no-image">No Image</div>'
                    }
                </div>
                <div class="cart-item-details">
                    <h3>${item.book.title}</h3>
                    <p>Author: ${item.book.author}</p>
                    <p>Price: Rs. ${price.toFixed(2)}</p>
                    <p class="item-total">Total: Rs. ${totalPrice.toFixed(2)}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="updateQuantity('${item.cartItemId}', ${item.quantity - 1})" 
                            ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.cartItemId}', ${item.quantity + 1})">+</button>
                </div>
                <button class="delete-btn" onclick="deleteItem('${item.cartItemId}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
    }).join('');

    const checkboxes = document.querySelectorAll('.cart-item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateTotals();
            updateSelectAllCheckbox();
        });
    });

    // Update totals after restoring checkbox states
    updateTotals();
    updateSelectAllCheckbox();
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
            counter.textContent = totalQuantity || '';
            counter.style.display = totalQuantity ? 'flex' : 'none';
        }
    })
    .catch(error => console.error('Error:', error));
}

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
        fetchCartItems();
        updateCartCounter();
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
            quantity: 0
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to remove item');
        return response.json();
    })
    .then(() => {
        fetchCartItems();
        updateCartCounter();
        updateTotals();
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

    window.location.href = '/member/order.html';
}

function arrayBufferToBase64(buffer) {
    if (!buffer || buffer.length === 0) {
        return '';
    }

    if (typeof buffer === 'string') {
        return buffer;
    }

    try {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('Error converting buffer to base64:', error);
        return '';
    }
}
