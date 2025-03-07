export const setAuthToken = (token) => {
    localStorage.setItem('authToken', token);
};

export const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
    localStorage.removeItem('authToken');
};

export const isAuthenticated = () => {
    return !!getAuthToken();
};

export const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};
