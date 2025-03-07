const axios = require('axios');
const API_URL = 'http://localhost:5000';

async function testEndpoints() {
    try {
        // Test registration
        const registerResponse = await axios.post(`${API_URL}/api/register`, {
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            phone: '1234567890'
        });
        console.log('Registration:', registerResponse.data);

        // Test login
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Login:', loginResponse.data);

        const token = loginResponse.data.token;

        // Test get tee times
        const teeTimesResponse = await axios.get(
            `${API_URL}/api/tee-times/Pine Valley/18H`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Tee Times:', teeTimesResponse.data);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testEndpoints();
