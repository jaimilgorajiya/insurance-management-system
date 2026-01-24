import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAdminRegistration() {
    console.log('🧪 Testing Admin Registration...');
    
    // Generate random email
    const randomEmail = `test_admin_${Math.floor(Math.random() * 10000)}@test.com`;

    const adminData = {
        name: 'Test Admin',
        email: randomEmail,
        mobile: '+1234567890',
        status: 'active'
    };

    try {
        const response = await fetch(`${BASE_URL}/admin/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });

        console.log(`Status Code: ${response.status}`);
        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Admin registration successful');
        } else {
            console.log('❌ Admin registration failed');
        }
    } catch (error) {
        console.error('❌ Test script error:', error.message);
    }
}

testAdminRegistration();
