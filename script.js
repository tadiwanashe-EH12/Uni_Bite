// script.js - Complete Integrated Solution

// Global Variables
let currentUser = null;
let cart = [];
let menuItems = [];
let orders = [];
let complaints = [];
let transactions = [];
let users = [];

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const navLinks = document.getElementById('navLinks');
const burger = document.getElementById('burger');
const studentDashboard = document.getElementById('studentDashboard');
const dhStaffDashboard = document.getElementById('dhStaffDashboard');
const accountsDashboard = document.getElementById('accountsDashboard');
const adminDashboard = document.getElementById('adminDashboard');
const orderHistorySection = document.getElementById('orderHistory');
const walletSection = document.getElementById('walletManagement');
const complaintsSection = document.getElementById('complaintsSection');
const menuItemsContainer = document.getElementById('menuItems');
const orderItemsContainer = document.getElementById('orderItems');
const orderTotalElement = document.getElementById('orderTotal');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const dhOrdersList = document.getElementById('dhOrdersList');
const dhMenuItemsList = document.getElementById('dhMenuItemsList');
const dhComplaintsList = document.getElementById('dhComplaintsList');
const accountsOrdersList = document.getElementById('accountsOrdersList');
const transactionsList = document.getElementById('transactionsList');
const walletTransactionsList = document.getElementById('walletTransactionsList');
const userComplaintsList = document.getElementById('userComplaintsList');
const usersList = document.getElementById('usersList');
const orderModal = document.getElementById('orderModal');
const paymentModal = document.getElementById('paymentModal');
const receiptModal = document.getElementById('receiptModal');
const depositOptions = document.getElementById('depositOptions');
const transactionHistory = document.getElementById('transactionHistory');
const depositBtn = document.getElementById('depositBtn');
const transactionHistoryBtn = document.getElementById('transactionHistoryBtn');
const proceedPaymentBtn = document.getElementById('proceedPaymentBtn');
const depositAmount = document.getElementById('depositAmount');
const studentName = document.getElementById('studentName');
const walletBalance = document.getElementById('walletBalance');
const walletCurrentBalance = document.getElementById('walletCurrentBalance');

// API Configuration
//const API_BASE_URL = 'http://localhost/unibiteweb/api'; // Replace with your actual API base URL
const API_BASE_URL = 'http://localhost/Uni_Bite/backend/api'; // Replace with your actual API base URL


// Update your makeRequest function to handle CORS properly
async function makeRequest(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (requiresAuth) {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const config = {
        method,
        headers,
        credentials: 'include', // For cookies if needed
        mode: 'cors' // Explicitly enable CORS
    };

    if (data) {

        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);
        //console.log(response.json())
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}
// API Endpoints
const api = {
     auth: {
        login: (email, password) => makeRequest('auth.php?action=login', 'POST', { email, password }, false),
        register: (userData) => makeRequest('/auth.php?action=register', 'POST', userData, false)
    },
    menu: {
        getMenu: () => makeRequest('menu.php?action=list'),
        addItem: (itemData) => makeRequest('menu.php?action=add', 'POST', itemData),
        toggleAvailability: (itemId) => makeRequest(`menu/toggle_availability/${itemId}`, 'PUT')
    },
    orders: {
        create: (orderData) => makeRequest('orders/create_order', 'POST', orderData),
        getAll: () => makeRequest('orders/get_orders'),
        updateStatus: (orderId, status) => makeRequest(`orders/update_order/${orderId}`, 'PUT', { status })
    },
    payments: {
        deposit: (amount, method) => makeRequest('payments/deposit', 'POST', { amount, method }),
        getTransactions: () => makeRequest('payments/get_transactions')
    },
    users: {
        getAll: () => makeRequest('users/get_users'),
        update: (userId, userData) => makeRequest(`users/update_user/${userId}`, 'PUT', userData),
        delete: (userId) => makeRequest(`users/delete_user/${userId}`, 'DELETE'),
        add: (userData) => makeRequest('users/add_user', 'POST', userData)
    },
    complaints: {
        create: (complaintData) => makeRequest('complaints/create_complaint', 'POST', complaintData),
        getAll: () => makeRequest('complaints/get_complaints'),
        resolve: (complaintId) => makeRequest(`complaints/resolve_complaint/${complaintId}`, 'PUT')
    }
    
};

// Event Listeners

// Replace the duplicate DOMContentLoaded listeners with this single version
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            showDashboardBasedOnRole(currentUser.role);
            updateUIForUser();
            authModal.style.display = 'none';
        } catch (e) {
            // Clear invalid data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            authModal.style.display = 'flex';
        }
    } else {
        authModal.style.display = 'flex';
    }

    setupEventListeners();
});
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Check authentication status
    if (!token || !user) {
        // Force show auth modal and hide all content
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('studentDashboard').classList.add('hidden');
        
        // Disable all navigation except logout (which will redirect to login)
        document.querySelectorAll('#navLinks a').forEach(link => {
            if (link.id !== 'logoutLink') {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.5';
            }
        });
        
        // Hide the main content area
        document.querySelector('main').style.display = 'none';
    } else {
        // User is authenticated - hide auth modal
        document.getElementById('authModal').classList.add('hidden');
        document.querySelector('main').style.display = 'block';
        
        // Show the appropriate dashboard based on user role
        showDashboardBasedOnRole(user.role);
    }
});

function showDashboardBasedOnRole(role) {
    // Hide all dashboards first
    document.querySelectorAll('.dashboard').forEach(dash => {
        dash.classList.add('hidden');
    });

    // Show the appropriate dashboard
    switch(role) {
        case 'student':
            document.getElementById('studentDashboard').classList.remove('hidden');
            loadMenuItems();
            updateCartUI();
            break;
        case 'dh_staff':
            document.getElementById('dhStaffDashboard').classList.remove('hidden');
            loadDHOrders();
            break;
        case 'accounts':
            document.getElementById('accountsDashboard').classList.remove('hidden');
            loadDailySales();
            break;
        case 'admin':
            document.getElementById('adminDashboard').classList.remove('hidden');
            loadAllUsers();
            break;
        default:
            console.error('Unknown user role:', role);
            authModal.style.display = 'flex';
    }

    // Update navigation visibility based on role
    updateNavForRole(role);
}

function updateNavForRole(role) {
    const isStudent = role === 'student';

    document.getElementById('ordersLink').style.display = isStudent ? 'block' : 'none';
    document.getElementById('walletLink').style.display = isStudent ? 'block' : 'none';
    document.getElementById('complaintsLink').style.display = isStudent ? 'block' : 'none';

    // For staff/admin, show all links but disable some if needed
    if (!isStudent) {
        document.querySelectorAll('#navLinks a').forEach(link => {
            link.style.pointerEvents = 'auto';
            link.style.opacity = '1';
        });
    }
}

function setupEventListeners() {
    // Navigation burger menu
    burger.addEventListener('click', toggleNav);
    
    // Auth modal close button
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Signup form submission
    signupForm.addEventListener('submit', handleSignup);
    
    // Navigation links
    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard('student');
    });
    
    document.getElementById('menuLink').addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard('student');
    });
    
    document.getElementById('ordersLink').addEventListener('click', (e) => {
        e.preventDefault();
        showOrderHistory();
    });
    
    document.getElementById('walletLink').addEventListener('click', (e) => {
        e.preventDefault();
        showWallet();
    });
    
    document.getElementById('complaintsLink').addEventListener('click', (e) => {
        e.preventDefault();
        showComplaints();
    });
    
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}
    
    // Menu category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', filterMenuByCategory);
    });
    
    // Place order button
    placeOrderBtn.addEventListener('click', showOrderConfirmation);
    
    // Wallet buttons
    depositBtn.addEventListener('click', () => {
        depositOptions.classList.remove('hidden');
        transactionHistory.classList.add('hidden');
    });
    
    transactionHistoryBtn.addEventListener('click', () => {
        transactionHistory.classList.remove('hidden');
        depositOptions.classList.add('hidden');
        loadWalletTransactions();
    });

    
    // Proceed to payment button
    proceedPaymentBtn.addEventListener('click', showPaymentModal);
    
    // Confirm order button in modal
    document.getElementById('confirmOrderBtn').addEventListener('click', confirmOrder);
    
    // Complete payment button
    document.getElementById('completePaymentBtn').addEventListener('click', completePayment);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.style.display = 'none';
        if (e.target === orderModal) orderModal.style.display = 'none';
        if (e.target === paymentModal) paymentModal.style.display = 'none';
        if (e.target === receiptModal) receiptModal.style.display = 'none';
    });
    if (document.getElementById('addUserBtn')) {
        setupAdminEventListeners();

        function setupAdminEventListeners() {
    document.getElementById('addUserBtn').addEventListener('click', () => {
        document.getElementById('addUserModal').style.display = 'flex';
    });

    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
}
}

// Utility Functions
function toggleNav() {
    navLinks.classList.toggle('active');
    burger.classList.toggle('toggle');
}

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function openStaffTab(tabName) {
    document.querySelectorAll('.staff-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.staff-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabName === 'manageOrders') loadDHOrders();
    if (tabName === 'manageMenu') loadDHMenuItems();
    if (tabName === 'manageComplaints') loadDHComplaints();
}

function openAccountsTab(tabName) {
    document.querySelectorAll('.accounts-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.accounts-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabName === 'dailySales') loadDailySales();
    if (tabName === 'transactions') loadAllTransactions();
}

function openAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabName === 'manageUsers') loadAllUsers();
}

function openComplaintsTab(tabName) {
   (Name).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabName === 'myComplaints') loadUserComplaints();
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await api.auth.login(email, password);
        
        if (!response.token || !response.user) {
            throw new Error('Invalid response from server');
        }
        
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        currentUser = response.user;
        authModal.style.display = 'none';
        
        showDashboard(currentUser.role);
        updateUIForUser();
        
        // Update welcome message
        alert(`Welcome back, ${currentUser.name}!`);
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Login failed. Please check your credentials and try again.');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const studentId = document.getElementById('studentId').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (!email || !password || !fullName || !studentId) {
        alert('Please fill in all required fields');
        return;
    }

    const userData = {
        name: fullName,
        studentId,
        email,
        phone,
        password,
        role: 'student' // Default role for signups
    };
    
    try {
        const response = await api.auth.register(userData);
        
        if (!response.token || !response.user) {
            throw new Error('Registration failed - invalid server response');
        }
        
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        currentUser = response.user;

        authModal.style.display = 'none';
        showDashboard('student');
        updateUIForUser();
        
        alert(`Registration successful! Welcome ${currentUser.name}`);
    } catch (error) {
        console.error('Registration error:', error);
        alert(error.message || 'Registration failed. Please try again.');
    }
}
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    currentUser = null;
    cart = [];
    authModal.style.display = 'flex';
    resetUI();
}

// Dashboard Functions
function showDashboard(userType) {
    // Hide all dashboards
    //studentDashboard.classList.add('hidden');
    dhStaffDashboard.classList.add('hidden');
    accountsDashboard.classList.add('hidden');
    adminDashboard.classList.add('hidden');
    orderHistorySection.classList.add('hidden');
    walletSection.classList.add('hidden');
    complaintsSection.classList.add('hidden');
    
    // Show the appropriate dashboard
    switch(userType) {
        case 'student':
            studentDashboard.classList.remove('hidden');
            loadMenuItems();
            updateCartUI();
            break;
        case 'dh_staff':
            dhStaffDashboard.classList.remove('hidden');
            loadDHOrders();
            break;
        case 'accounts':
            accountsDashboard.classList.remove('hidden');
            loadDailySales();
            break;
        case 'admin':
            adminDashboard.classList.remove('hidden');
            loadAllUsers();
            break;
    }
}

function showOrderHistory() {
    studentDashboard.classList.add('hidden');
    dhStaffDashboard.classList.add('hidden');
    accountsDashboard.classList.add('hidden');
    adminDashboard.classList.add('hidden');
    walletSection.classList.add('hidden');
    complaintsSection.classList.add('hidden');
    orderHistorySection.classList.remove('hidden');
    loadOrderHistory();
}

function showWallet() {
    studentDashboard.classList.add('hidden');
    dhStaffDashboard.classList.add('hidden');
    accountsDashboard.classList.add('hidden');
    adminDashboard.classList.add('hidden');
    orderHistorySection.classList.add('hidden');
    complaintsSection.classList.add('hidden');
    walletSection.classList.remove('hidden');
    depositOptions.classList.add('hidden');
    transactionHistory.classList.add('hidden');
    updateWalletBalance();
}

function showComplaints() {
    studentDashboard.classList.add('hidden');
    dhStaffDashboard.classList.add('hidden');
    accountsDashboard.classList.add('hidden');
    adminDashboard.classList.add('hidden');
    orderHistorySection.classList.add('hidden');
    walletSection.classList.add('hidden');
    complaintsSection.classList.remove('hidden');
    openComplaintsTab('newComplaint');
}
async function handleAddUser(e) {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        phone: document.getElementById('newUserPhone').value,
        role: document.getElementById('newUserRole').value,
        password: document.getElementById('newUserPassword').value
    };
    
    try {
        const response = await api.users.add(userData);
        alert(`User ${response.user.name} created successfully with role ${response.user.role}`);
        document.getElementById('addUserModal').style.display = 'none';
        document.getElementById('addUserForm').reset();
        loadAllUsers();
    } catch (error) {
        alert(error.message || 'Failed to create user');
    }
}


function updateUIForUser() {
    if (currentUser) {
        console.log(currentUser)
        studentName.textContent = currentUser.full_name;
        walletBalance.textContent = `$${currentUser.walletBalance?.toFixed(2) || '0.00'}`;
        walletCurrentBalance.textContent = `$${currentUser.walletBalance?.toFixed(2) || '0.00'}`;
        
        let isStudent = currentUser.role === 'student';
        console.log(isStudent)

        document.getElementById('ordersLink').style.display = isStudent ? 'block' : 'none';
        document.getElementById('walletLink').style.display = isStudent ? 'block' : 'none';
        document.getElementById('complaintsLink').style.display = isStudent ? 'block' : 'none';
    }
}

function resetUI() {
    studentName.textContent = '';
    walletBalance.textContent = '$0.00';
    walletCurrentBalance.textContent = '$0.00';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('userType').value = 'student';
}

// Menu Functions
async function loadMenuItems() {
    menuItemsContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.menu.getMenu();
        //console.log(response)
        menuItems = Object.values(response.data).flat(); // Convert category-based object to array
        console.log(menuItems)
        renderMenuItems();
    } catch (error) {
        console.error('Failed to load menu items:', error);
        menuItemsContainer.innerHTML = '<p class="error-message">Failed to load menu. Please try again later.</p>';
    }
}

function renderMenuItems() {
    menuItemsContainer.innerHTML = '';
    
    menuItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `menu-item ${item.is_available ? '' : 'unavailable'}`;
        itemElement.innerHTML = `
            <img src="${item.image_url || ''}" alt="${item.name}" class="menu-item-img">
            <div class="menu-item-details">
                <h3 class="menu-item-title">${item.name}</h3>
                <p class="menu-item-desc">${item.description}</p>
                <p class="menu-item-price">$${item.price}</p>
                <div class="menu-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity-value" data-id="${item.id}">0</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${item.id}">Add</button>
                </div>
            </div>
        `;
        
        menuItemsContainer.appendChild(itemElement);
    });
    
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', increaseQuantity);
    });
    
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
}

function filterMenuByCategory() {
    const category = this.dataset.category;
    
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => {
        if (category === 'all') {
            item.style.display = 'block';
        } else {
            const itemId = parseInt(item.querySelector('.add-to-cart').dataset.id);
            const menuItem = menuItems.find(i => i.id === itemId);
            const itemCategory = menuItem?.category_name?.toLowerCase() || '';
            item.style.display = itemCategory.includes(category) ? 'block' : 'none';
        }
    });
}

function decreaseQuantity() {
    const itemId = parseInt(this.dataset.id);
    const quantityElement = document.querySelector(`.quantity-value[data-id="${itemId}"]`);
    let quantity = parseInt(quantityElement.textContent);
    
    if (quantity > 0) {
        quantity--;
        quantityElement.textContent = quantity;
    }
}

function increaseQuantity() {
    const itemId = parseInt(this.dataset.id);
    const quantityElement = document.querySelector(`.quantity-value[data-id="${itemId}"]`);
    let quantity = parseInt(quantityElement.textContent);
    
    quantity++;
    quantityElement.textContent = quantity;
}

function addToCart() {
    const itemId = parseInt(this.dataset.id);
    const quantityElement = document.querySelector(`.quantity-value[data-id="${itemId}"]`);
    const quantity = parseInt(quantityElement.textContent);
    
    if (quantity === 0) {
        alert('Please select at least 1 quantity');
        return;
    }
    
    const menuItem = menuItems.find(item => item.id === itemId);
    
    const existingItemIndex = cart.findIndex(item => item.id === itemId);
    
    if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: quantity
        });
    }
    
    quantityElement.textContent = '0';
    updateCartUI();
}

function updateCartUI() {
    orderItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = '<p class="empty-message">No items selected</p>';
        orderTotalElement.textContent = '$0.00';
        placeOrderBtn.disabled = true;
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-quantity">${item.quantity}</div>
            <div class="order-item-price">$${itemTotal.toFixed(2)}</div>
            <div class="order-item-remove" data-id="${item.id}">&times;</div>
        `;
        
        orderItemsContainer.appendChild(itemElement);
    });
    
    document.querySelectorAll('.order-item-remove').forEach(btn => {
        btn.addEventListener('click', removeFromCart);
    });
    
    orderTotalElement.textContent = `$${total.toFixed(2)}`;
    placeOrderBtn.disabled = false;
}

function removeFromCart() {
    const itemId = parseInt(this.dataset.id);
    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
}

function showOrderConfirmation() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let orderDetailsHTML = '<h3>Your Order</h3><ul>';
    
    cart.forEach(item => {
        orderDetailsHTML += `
            <li>${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}</li>
        `;
    });
    
    orderDetailsHTML += `</ul><p><strong>Total: $${total.toFixed(2)}</strong></p>`;
    
    document.getElementById('modalOrderDetails').innerHTML = orderDetailsHTML;
    orderModal.style.display = 'flex';
}

async function confirmOrder() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        const orderData = {
            items: cart.map(item => ({
                item_id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };
        
        const response = await api.orders.create(orderData);
        
        // Update local state
        orders.push(response.data);
        if (currentUser.walletBalance !== undefined) {
            currentUser.walletBalance -= total;
            localStorage.setItem('userData', JSON.stringify(currentUser));
        }
        updateWalletBalance();
        
        // Clear cart
        cart = [];
        updateCartUI();
        
        // Close order modal
        orderModal.style.display = 'none';
        
        // Show receipt
        showReceipt(response.data);
    } catch (error) {
        alert(error.message || 'Failed to place order. Please try again.');
    }
}

function showReceipt(order) {
    let receiptHTML = `
        <h3>Order Receipt</h3>
        <p><strong>Reference:</strong> ${order.reference || order.id}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at || order.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <hr>
        <h4>Order Items</h4>
        <ul>
    `;
    
    order.items.forEach(item => {
        receiptHTML += `
            <li>${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}</li>
        `;
    });
    
    receiptHTML += `
        </ul>
        <hr>
        <p><strong>Total:</strong> $${order.total_amount?.toFixed(2) || order.total?.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${order.payment_method || 'Wallet'}</p>
    `;
    
    document.getElementById('receiptDetails').innerHTML = receiptHTML;
    receiptModal.style.display = 'flex';
}

// DH Staff Functions
async function loadDHOrders() {
    dhOrdersList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.orders.getAll();
        orders = response.data;
        
        renderDHOrders();
    } catch (error) {
        console.error('Failed to load orders:', error);
        dhOrdersList.innerHTML = '<p class="error-message">Failed to load orders. Please try again later.</p>';
    }
}

function renderDHOrders() {
    dhOrdersList.innerHTML = '';
    
    orders.forEach(order => {
        const user = users.find(u => u.id === order.user_id) || { name: 'Unknown User', email: '', studentId: '' };
        
        let itemsHTML = '';
        order.items.forEach(item => {
            itemsHTML += `
                <div class="order-item-row">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.innerHTML = `
            <div class="order-card-header">
                <span class="order-id">${order.reference || `Order #${order.id}`}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-card-body">
                <div class="order-items-list">
                    <h4>Items</h4>
                    ${itemsHTML}
                </div>
                <div class="order-customer-info">
                    <h4>Customer</h4>
                    <p>${user.name}</p>
                    <p>${user.studentId || user.email}</p>
                    <p>Ordered at: ${new Date(order.created_at || order.createdAt).toLocaleTimeString()}</p>
                </div>
            </div>
            <div class="order-actions">
                ${order.status === 'pending' ? '<button class="btn btn-sm" data-order-id="${order.id}" data-action="preparing">Mark as Preparing</button>' : ''}
                ${order.status === 'preparing' ? '<button class="btn btn-sm" data-order-id="${order.id}" data-action="ready">Mark as Ready</button>' : ''}
                ${order.status === 'ready' ? '<button class="btn btn-sm" data-order-id="${order.id}" data-action="collected">Mark as Collected</button>' : ''}
            </div>
        `;
        
        dhOrdersList.appendChild(orderElement);
    });
    
    document.querySelectorAll('.order-actions .btn-sm').forEach(btn => {
        btn.addEventListener('click', updateOrderStatus);
    });
}

async function updateOrderStatus() {
    const orderId = parseInt(this.dataset.orderId);
    const action = this.dataset.action;
    
    try {
        await api.orders.updateStatus(orderId, action);
        
        // Update local state
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex >= 0) {
            orders[orderIndex].status = action;
            if (action === 'collected') {
                orders[orderIndex].collected_at = new Date().toISOString();
            }
        }
        
        // Reload orders
        renderDHOrders();
    } catch (error) {
        alert(error.message || 'Failed to update order status. Please try again.');
    }
}

async function loadDHMenuItems() {
    dhMenuItemsList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.menu.getMenu();
        menuItems = Object.values(response.data).flat(); // Convert category-based object to array
        
        renderDHMenuItems();
    } catch (error) {
        console.error('Failed to load menu items:', error);
        dhMenuItemsList.innerHTML = '<p class="error-message">Failed to load menu items. Please try again later.</p>';
    }
}

function renderDHMenuItems() {
    dhMenuItemsList.innerHTML = '';
    
    menuItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'menu-item-card';
        itemElement.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p><strong>Price:</strong> $${item.price.toFixed(2)}</p>
            <p><strong>Category:</strong> ${item.category_name || item.category}</p>
            <p><strong>Status:</strong> ${item.is_available ? 'Available' : 'Unavailable'}</p>
            <div class="menu-item-card-actions">
                <button class="btn btn-sm" data-item-id="${item.id}" data-action="edit">Edit</button>
                <button class="btn btn-sm ${item.is_available ? 'btn-cancel' : ''}" data-item-id="${item.id}" data-action="toggle-availability">
                    ${item.is_available ? 'Make Unavailable' : 'Make Available'}
                </button>
            </div>
        `;
        
        dhMenuItemsList.appendChild(itemElement);
    });
    
    document.querySelectorAll('.menu-item-card-actions .btn-sm').forEach(btn => {
        btn.addEventListener('click', manageMenuItem);
    });
}

async function manageMenuItem() {
    const itemId = parseInt(this.dataset.itemId);
    const action = this.dataset.action;
    
    try {
        if (action === 'toggle-availability') {
            await api.menu.toggleAvailability(itemId);
            
            // Update local state
            const itemIndex = menuItems.findIndex(i => i.id === itemId);
            if (itemIndex >= 0) {
                menuItems[itemIndex].is_available = !menuItems[itemIndex].is_available;
            }
            
            // Reload menu items
            renderDHMenuItems();
        } else if (action === 'edit') {
            // Implement edit functionality
            alert('Edit functionality would be implemented here');
        }
    } catch (error) {
        alert(error.message || 'Failed to update menu item. Please try again.');
    }
}

async function loadDHComplaints() {
    dhComplaintsList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.complaints.getAll();
        complaints = response.data;
        
        renderDHComplaints();
    } catch (error) {
        console.error('Failed to load complaints:', error);
        dhComplaintsList.innerHTML = '<p class="error-message">Failed to load complaints. Please try again later.</p>';
    }
}

function renderDHComplaints() {
    dhComplaintsList.innerHTML = '';
    
    complaints.forEach(complaint => {
        const user = users.find(u => u.id === complaint.user_id) || { name: 'Unknown User' };
        const order = complaint.order_id ? orders.find(o => o.id === complaint.order_id) : null;
        
        const complaintElement = document.createElement('div');
        complaintElement.className = 'complaint-card';
        complaintElement.innerHTML = `
            <div class="complaint-header">
                <span class="complaint-type">${complaint.type.replace('_', ' ')}</span>
                <span class="complaint-status ${complaint.status}">${complaint.status}</span>
            </div>
            <div class="complaint-body">
                <p>${complaint.details}</p>
                ${order ? `<p><strong>Related Order:</strong> ${order.reference || `Order #${order.id}`}</p>` : ''}
            </div>
            <div class="complaint-footer">
                <span>Submitted by: ${user.name}</span>
                <span>${new Date(complaint.created_at || complaint.createdAt).toLocaleString()}</span>
            </div>
            ${complaint.status === 'pending' ? '<button class="btn btn-sm" data-complaint-id="${complaint.id}" data-action="resolve">Mark as Resolved</button>' : ''}
        `;
        
        dhComplaintsList.appendChild(complaintElement);
    });
    
    document.querySelectorAll('.complaint-card .btn-sm').forEach(btn => {
        btn.addEventListener('click', resolveComplaint);
    });
}

async function resolveComplaint() {
    const complaintId = parseInt(this.dataset.complaintId);
    
    try {
        await api.complaints.resolve(complaintId);
        
        // Update local state
        const complaintIndex = complaints.findIndex(c => c.id === complaintId);
        if (complaintIndex >= 0) {
            complaints[complaintIndex].status = 'resolved';
            complaints[complaintIndex].resolved_at = new Date().toISOString();
        }
        
        // Reload complaints
        renderDHComplaints();
    } catch (error) {
        alert(error.message || 'Failed to resolve complaint. Please try again.');
    }
}

// Accounts Functions
async function loadDailySales() {
    accountsOrdersList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.orders.getAll();
        orders = response.data;
        
        // Calculate today's date
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => 
            (order.created_at || order.createdAt).startsWith(today)
        );
        
        // Calculate totals
        const totalOrders = todayOrders.length;
        const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || order.total), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Update summary cards
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
        
        // Display order details
        renderDailySales(todayOrders);
    } catch (error) {
        console.error('Failed to load daily sales:', error);
        accountsOrdersList.innerHTML = '<p class="error-message">Failed to load daily sales. Please try again later.</p>';
    }
}

function renderDailySales(todayOrders) {
    accountsOrdersList.innerHTML = '';
    
    todayOrders.forEach(order => {
        const user = users.find(u => u.id === order.user_id) || { name: 'Unknown User', email: '', studentId: '' };
        
        let itemsHTML = '';
        order.items.forEach(item => {
            itemsHTML += `
                <div class="order-item-row">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.innerHTML = `
            <div class="order-card-header">
                <span class="order-id">${order.reference || `Order #${order.id}`}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-card-body">
                <div class="order-items-list">
                    <h4>Items</h4>
                    ${itemsHTML}
                    <div class="order-item-row total">
                        <span><strong>Total</strong></span>
                        <span><strong>$${(order.total_amount || order.total).toFixed(2)}</strong></span>
                    </div>
                </div>
                <div class="order-customer-info">
                    <h4>Customer</h4>
                    <p>${user.name}</p>
                    <p>${user.studentId || user.email}</p>
                    <p>Ordered at: ${new Date(order.created_at || order.createdAt).toLocaleTimeString()}</p>
                    ${order.collected_at ? `<p>Collected at: ${new Date(order.collected_at).toLocaleTimeString()}</p>` : ''}
                </div>
            </div>
        `;
        
        accountsOrdersList.appendChild(orderElement);
    });
}

async function loadAllTransactions() {
    transactionsList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.payments.getTransactions();
        transactions = response.data;
        
        renderAllTransactions();
    } catch (error) {
        console.error('Failed to load transactions:', error);
        transactionsList.innerHTML = '<p class="error-message">Failed to load transactions. Please try again later.</p>';
    }
}

function renderAllTransactions() {
    transactionsList.innerHTML = '';
    
    transactions.forEach(transaction => {
        const user = users.find(u => u.id === transaction.user_id) || { name: 'Unknown User' };
        const order = transaction.order_id ? orders.find(o => o.id === transaction.order_id) : null;
        
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.innerHTML = `
            <div class="transaction-details">
                <p><strong>${transaction.type.toUpperCase()}</strong> - ${transaction.reference}</p>
                <p>${user.name} (${user.studentId || user.email})</p>
                <p class="transaction-date">${new Date(transaction.created_at || transaction.createdAt).toLocaleString()}</p>
                ${order ? `<p>Order: ${order.reference || `Order #${order.id}`}</p>` : ''}
                <p>Method: ${transaction.method.replace('_', ' ')}</p>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'deposit' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </div>
        `;
        
        transactionsList.appendChild(transactionElement);
    });
}

// Order History Functions
async function loadOrderHistory() {
    historyOrdersList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.orders.getAll();
        const userOrders = response.data.filter(order => order.user_id === currentUser.id);
        
        renderOrderHistory(userOrders);
    } catch (error) {
        console.error('Failed to load order history:', error);
        historyOrdersList.innerHTML = '<p class="error-message">Failed to load order history. Please try again later.</p>';
    }
}

function renderOrderHistory(userOrders) {
    historyOrdersList.innerHTML = '';
    
    if (userOrders.length === 0) {
        historyOrdersList.innerHTML = '<p class="empty-message">No order history found</p>';
        return;
    }
    
    userOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.innerHTML = `
            <div class="order-card-header">
                <span class="order-id">${order.reference || `Order #${order.id}`}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-card-body">
                <div class="order-items-list">
                    <h4>Items</h4>
                    ${order.items.map(item => `
                        <div class="order-item-row">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="order-item-row total">
                        <span><strong>Total</strong></span>
                        <span><strong>$${(order.total_amount || order.total).toFixed(2)}</strong></span>
                    </div>
                </div>
                <div class="order-meta">
                    <p>Ordered on: ${new Date(order.created_at || order.createdAt).toLocaleString()}</p>
                    ${order.collected_at ? `<p>Collected on: ${new Date(order.collected_at).toLocaleString()}</p>` : ''}
                    <button class="btn btn-sm" data-order-id="${order.id}">View Receipt</button>
                </div>
            </div>
        `;
        
        historyOrdersList.appendChild(orderElement);
    });
    
    document.querySelectorAll('.order-meta .btn-sm').forEach(btn => {
        btn.addEventListener('click', viewOrderReceipt);
    });
}

function viewOrderReceipt() {
    const orderId = parseInt(this.dataset.orderId);
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        showReceipt(order);
    }
}

// Wallet Functions
function updateWalletBalance() {
    if (currentUser) {
        walletBalance.textContent = `$${currentUser.walletBalance?.toFixed(2) || '0.00'}`;
        walletCurrentBalance.textContent = `$${currentUser.walletBalance?.toFixed(2) || '0.00'}`;
    }
}

async function loadWalletTransactions() {
    walletTransactionsList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.payments.getTransactions();
        const userTransactions = response.data.filter(t => t.user_id === currentUser.id);
        
        renderWalletTransactions(userTransactions);
    } catch (error) {
        console.error('Failed to load wallet transactions:', error);
        walletTransactionsList.innerHTML = '<p class="error-message">Failed to load transactions. Please try again later.</p>';
    }
}

function renderWalletTransactions(userTransactions) {
    walletTransactionsList.innerHTML = '';
    
    if (userTransactions.length === 0) {
        walletTransactionsList.innerHTML = '<p class="empty-message">No transactions found</p>';
        return;
    }
    
    userTransactions.forEach(transaction => {
        const order = transaction.order_id ? orders.find(o => o.id === transaction.order_id) : null;
        
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.innerHTML = `
            <div class="transaction-details">
                <p><strong>${transaction.type.toUpperCase()}</strong> - ${transaction.reference}</p>
                <p class="transaction-date">${new Date(transaction.created_at || transaction.createdAt).toLocaleString()}</p>
                ${order ? `<p>Order: ${order.reference || `Order #${order.id}`}</p>` : ''}
                <p>Method: ${transaction.method.replace('_', ' ')}</p>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'deposit' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </div>
        `;
        
        walletTransactionsList.appendChild(transactionElement);
    });
}

function showPaymentModal() {
    const amount = parseFloat(depositAmount.value);
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const paymentDetailsHTML = `
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${method.replace('_', ' ')}</p>
        ${method === 'ecocash' ? `
            <div class="form-group">
                <label for="ecocashNumber">EcoCash Number</label>
                <input type="tel" id="ecocashNumber" placeholder="0771234567" required>
            </div>
        ` : ''}
        ${method === 'bank_transfer' ? `
            <div class="form-group">
                <label for="bankDetails">Bank Details</label>
                <p>Bank: CBZ Bank</p>
                <p>Account: Lupane State University DH</p>
                <p>Account Number: 4567891234</p>
                <p>Branch: Lupane</p>
                <p>Reference: ${currentUser.studentId || currentUser.email}</p>
            </div>
        ` : ''}
        ${method === 'card' ? `
            <div class="form-group">
                <label for="cardNumber">Card Number</label>
                <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" required>
            </div>
            <div class="form-group">
                <label for="cardExpiry">Expiry Date</label>
                <input type="text" id="cardExpiry" placeholder="MM/YY" required>
            </div>
            <div class="form-group">
                <label for="cardCvv">CVV</label>
                <input type="text" id="cardCvv" placeholder="123" required>
            </div>
        ` : ''}
    `;
    
    document.getElementById('paymentDetails').innerHTML = paymentDetailsHTML;
    paymentModal.style.display = 'flex';
}

async function completePayment() {
    const amount = parseFloat(depositAmount.value);
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    try {
        const response = await api.payments.deposit(amount, method);
        
        // Update local state
        currentUser.walletBalance = (currentUser.walletBalance || 0) + amount;
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        transactions.push(response.data);
        updateWalletBalance();
        
        // Close payment modal
        paymentModal.style.display = 'none';
        
        // Reset deposit form
        depositAmount.value = '';
        depositOptions.classList.add('hidden');
        
        // Show success message
        alert(`Payment of $${amount.toFixed(2)} was successful! Your wallet has been updated.`);
    } catch (error) {
        alert(error.message || 'Payment failed. Please try again.');
    }
}

// Complaints Functions
async function loadUserComplaints() {
    userComplaintsList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.complaints.getAll();
        const userComplaints = response.data.filter(c => c.user_id === currentUser.id);
        
        renderUserComplaints(userComplaints);
    } catch (error) {
        console.error('Failed to load complaints:', error);
        userComplaintsList.innerHTML = '<p class="error-message">Failed to load complaints. Please try again later.</p>';
    }
}

function renderUserComplaints(userComplaints) {
    userComplaintsList.innerHTML = '';
    
    if (userComplaints.length === 0) {
        userComplaintsList.innerHTML = '<p class="empty-message">No complaints found</p>';
        return;
    }
    
    userComplaints.forEach(complaint => {
        const order = complaint.order_id ? orders.find(o => o.id === complaint.order_id) : null;
        
        const complaintElement = document.createElement('div');
        complaintElement.className = 'complaint-card';
        complaintElement.innerHTML = `
            <div class="complaint-header">
                <span class="complaint-type">${complaint.type.replace('_', ' ')}</span>
                <span class="complaint-status ${complaint.status}">${complaint.status}</span>
            </div>
            <div class="complaint-body">
                <p>${complaint.details}</p>
                ${order ? `<p><strong>Related Order:</strong> ${order.reference || `Order #${order.id}`}</p>` : ''}
            </div>
            <div class="complaint-footer">
                <span>Submitted on: ${new Date(complaint.created_at || complaint.createdAt).toLocaleString()}</span>
                ${complaint.resolved_at ? `<span>Resolved on: ${new Date(complaint.resolved_at).toLocaleString()}</span>` : ''}
            </div>
        `;
        
        userComplaintsList.appendChild(complaintElement);
    });
}

// Admin Functions
async function loadAllUsers() {
    usersList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.users.getAll();
        users = response.data;
        
        renderAllUsers();
    } catch (error) {
        console.error('Failed to load users:', error);
        usersList.innerHTML = '<p class="error-message">Failed to load users. Please try again later.</p>';
    }
}

function renderAllUsers() {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-card';
        userElement.innerHTML = `
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
                <p>${user.phone}</p>
                ${user.studentId ? `<p>Student ID: ${user.studentId}</p>` : ''}
            </div>
            <div class="user-meta">
                <span class="user-role ${user.role}">${user.role.replace('_', ' ')}</span>
                <p>Registered: ${new Date(user.created_at || user.registeredAt).toLocaleDateString()}</p>
                ${user.role === 'student' ? `<p>Wallet: $${user.walletBalance?.toFixed(2) || '0.00'}</p>` : ''}
            </div>
            <div class="user-actions">
                <button class="btn btn-sm" data-user-id="${user.id}" data-action="edit">Edit</button>
                ${user.role !== 'admin' ? `<button class="btn btn-sm btn-cancel" data-user-id="${user.id}" data-action="delete">Delete</button>` : ''}
            </div>
        `;
        
        usersList.appendChild(userElement);
    });
    
    document.querySelectorAll('.user-actions .btn-sm').forEach(btn => {
        btn.addEventListener('click', manageUser);
    });
}

async function manageUser() {
    const userId = parseInt(this.dataset.userId);
    const action = this.dataset.action;
    
    if (action === 'edit') {
        // Implement edit functionality
        alert('Edit user functionality would be implemented here');
    } else if (action === 'delete') {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await api.users.delete(userId);
                // Refresh user list
                await loadAllUsers();
            } catch (error) {
                alert(error.message || 'Failed to delete user. Please try again.');
            }
        }
    }
}