const axios = require('axios');
const API_URL = 'http://localhost:5000';
let authToken;
let testEmail; // Add this to store the email

async function checkServerConnection() {
    try {
        await axios.get(API_URL);
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('\n❌ Server is not running. Please start the server with:');
            console.error('npm run dev\n');
            return false;
        }
        throw error;
    }
}

async function runTests() {
    console.log('Starting system tests...\n');

    try {
        // Check server connection first
        const isServerRunning = await checkServerConnection();
        if (!isServerRunning) {
            process.exit(1);
        }

        // Test 1: User Registration
        console.log('1. Testing User Registration');
        const testPassword = 'TestPass@123';
        testEmail = `test${Date.now()}@example.com`; // Store email for later use
        const registerData = {
            name: 'Test User',
            username: 'testuser' + Date.now(), // Make username unique
            email: testEmail, // Use the stored email
            password: testPassword,
            phone: '1234567890'
        };
        console.log('Attempting registration with:', {...registerData, password: '[HIDDEN]'});
        
        try {
            const registerResponse = await axios.post(`${API_URL}/api/register`, registerData);
            console.log('Registration response:', registerResponse.data);
            console.log('✓ Registration successful');
        } catch (error) {
            console.error('Registration failed:');
            console.error('Status:', error.response?.status);
            console.error('Error:', error.response?.data);
            throw error;
        }

        // Test 2: User Login
        console.log('\n2. Testing User Login');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: testEmail,
            password: testPassword
        });
        authToken = loginResponse.data.token;
        console.log('Login response:', {
            userId: loginResponse.data.user.id,
            token: authToken
        });
        console.log('✓ Login successful');

        // Test 3: Get Tee Times
        console.log('\n3. Testing Tee Times Retrieval');
        const teeTimesResponse = await axios.get(
            `${API_URL}/api/tee-times/Pine Valley/18H`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('Tee times data:', JSON.stringify(teeTimesResponse.data, null, 2));
        console.log('✓ Tee times retrieved successfully');

        // Test 4: Make a Booking
        if (teeTimesResponse.data.teeTimeSlots && teeTimesResponse.data.teeTimeSlots.length > 0) {
            console.log('\n4. Testing Booking Creation');
            const teeTime = teeTimesResponse.data.teeTimeSlots[0];
            console.log('User ID from token:', authToken);
            console.log('Selected tee time:', teeTime);
            
            const bookingData = {
                teeTimeId: teeTime.id,
                players: 2
            };
            console.log('Sending booking data:', bookingData);
            
            try {
                const bookingResponse = await axios.post(
                    `${API_URL}/api/bookings`,
                    bookingData,
                    { 
                        headers: { 
                            Authorization: `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
                console.log('Booking response:', bookingResponse.data);
                console.log('✓ Booking created successfully');
            } catch (error) {
                console.error('Booking creation failed:');
                console.error('Status:', error.response?.status);
                console.error('Error data:', error.response?.data);
                throw error;
            }
        } else {
            console.log('\nSkipping booking test - no tee times available');
        }

        // Test 5: Get User Profile
        console.log('\n5. Testing Profile Retrieval');
        const profileResponse = await axios.get(
            `${API_URL}/api/current-user`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✓ Profile retrieved successfully');

        console.log('\nAll tests completed successfully! ✨');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('\n❌ Failed to connect to server:', error.message);
        } else {
            console.error('\n✕ Test failed:');
            console.error('Status:', error.response?.status);
            console.error('Error Message:', error.response?.data?.message);
            if (error.response?.data?.errors) {
                console.error('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
            }
            console.error('Full Error:', error.message);
        }
        process.exit(1);
    }
}

runTests();
