// api.js
const API_BASE_URL = 'http://localhost/lsu_dh'; 

async function makeRequest(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (requiresAuth) {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    const config = {
        method,
        headers
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Auth API
export const authAPI = {
    login: (email, password) => makeRequest('auth/login', 'POST', { email, password }, false),
    register: (userData) => makeRequest('auth/register', 'POST', userData, false)
};

// Menu API
export const menuAPI = {
    getMenu: () => makeRequest('menu/get_menu'),
    addMenuItem: (itemData) => makeRequest('menu/add_item', 'POST', itemData),
    toggleAvailability: (itemId) => makeRequest(`menu/toggle_availability/${itemId}`, 'PUT')
};

// Orders API
export const ordersAPI = {
    createOrder: (orderData) => makeRequest('orders/create_order', 'POST', orderData),
    getOrders: () => makeRequest('orders/get_orders'),
    updateOrderStatus: (orderId, status) => makeRequest(`orders/update_order/${orderId}`, 'PUT', { status })
};

// Payments API
export const paymentsAPI = {
    deposit: (amount, method) => makeRequest('payments/deposit', 'POST', { amount, method }),
    getTransactions: () => makeRequest('payments/get_transactions')
};

// Users API
export const usersAPI = {
    getUsers: () => makeRequest('users/get_users'),
    updateUser: (userId, userData) => makeRequest(`users/update_user/${userId}`, 'PUT', userData),
    deleteUser: (userId) => makeRequest(`users/delete_user/${userId}`, 'DELETE')
};

// Complaints API
export const complaintsAPI = {
    createComplaint: (complaintData) => makeRequest('complaints/create_complaint', 'POST', complaintData),
    getComplaints: () => makeRequest('complaints/get_complaints'),
    resolveComplaint: (complaintId) => makeRequest(`complaints/resolve_complaint/${complaintId}`, 'PUT')
};