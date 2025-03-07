import { getAuthHeaders } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const fetchWithAuth = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }

    return response.json();
};

export const api = {
    login: (credentials) => fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),

    register: (userData) => fetchWithAuth('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    getTeeTimes: (course, holes) => 
        fetchWithAuth(`/api/tee-times/${encodeURIComponent(course)}/${encodeURIComponent(holes)}`),

    createBooking: (bookingData) => 
        fetchWithAuth('/api/bookings', {  // Changed from /bookings to /api/bookings
            method: 'POST',
            body: JSON.stringify(bookingData)
        }),

    updateProfile: (formData) => 
        fetchWithAuth('/api/update-profile', {
            method: 'POST',
            body: formData,
            headers: {
                Authorization: getAuthHeaders().Authorization
            }
        }),

    getCurrentUser: () => fetchWithAuth('/api/current-user'),

    getMyBookings: () => fetchWithAuth('/api/my-bookings'),

    logout: () => fetchWithAuth('/auth/logout', { method: 'POST' })
};
