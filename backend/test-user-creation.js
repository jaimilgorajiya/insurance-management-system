/**
 * Test script for the new user onboarding system
 * Run with: node test-user-creation.js
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
    adminCredentials: {
        email: 'admin@test.com',
        password: 'admin123'
    },
    testUsers: {
        agent: {
            name: 'Test Agent',
            email: 'testagent@example.com',
            mobile: '+1234567890'
        },
        customer: {
            name: 'Test Customer', 
            email: 'testcustomer@example.com',
            mobile: '+1987654321'
        }
    }
};

async function loginAsAdmin() {
    try {
        console.log('🔐 Logging in as admin...');
        
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testConfig.adminCredentials)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Admin login successful');
            return data.data.accessToken;
        } else {
            console.log('❌ Admin login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Admin login error:', error.message);
        return null;
    }
}

async function createUser(token, userType, userData) {
    try {
        console.log(`\n👤 Creating ${userType}...`);
        
        const endpoint = userType === 'agent' ? '/users/agents' : '/users/customers';
        
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ ${userType} created successfully`);
            console.log(`   Name: ${data.data.user.name}`);
            console.log(`   Email: ${data.data.user.email}`);
            console.log(`   Role: ${data.data.user.role}`);
            console.log(`   Temp Password: ${data.data.tempPassword}`);
            console.log(`   📧 Credentials email sent to ${data.data.user.email}`);
            return data.data;
        } else {
            console.log(`❌ ${userType} creation failed:`, data.message);
            return null;
        }
    } catch (error) {
        console.log(`❌ ${userType} creation error:`, error.message);
        return null;
    }
}

async function testUserLogin(email, password, expectedRole) {
    try {
        console.log(`\n🧪 Testing login for ${email}...`);
        
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ Login successful for ${expectedRole}`);
            console.log(`   User ID: ${data.data.user.id}`);
            console.log(`   Role: ${data.data.user.role}`);
            console.log(`   Dashboard: /${data.data.user.role}`);
            return data.data.accessToken;
        } else {
            console.log(`❌ Login failed for ${email}:`, data.message);
            return null;
        }
    } catch (error) {
        console.log(`❌ Login error for ${email}:`, error.message);
        return null;
    }
}

async function testAgentCreateCustomer(agentToken) {
    try {
        console.log('\n🧪 Testing agent creating customer...');
        
        const customerData = {
            name: 'Agent Created Customer',
            email: 'agentcustomer@example.com',
            mobile: '+1555666777'
        };
        
        const response = await fetch(`${BASE_URL}/users/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${agentToken}`
            },
            body: JSON.stringify(customerData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Agent successfully created customer');
            console.log(`   Customer: ${data.data.user.name} (${data.data.user.email})`);
            return data.data;
        } else {
            console.log('❌ Agent failed to create customer:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Agent customer creation error:', error.message);
        return null;
    }
}

async function runUserOnboardingTests() {
    console.log('🚀 Starting User Onboarding System Tests');
    console.log('==========================================');
    
    // Step 1: Login as admin
    const adminToken = await loginAsAdmin();
    if (!adminToken) {
        console.log('\n❌ Cannot proceed without admin access');
        return;
    }
    
    // Step 2: Create an agent
    const agentData = await createUser(adminToken, 'agent', testConfig.testUsers.agent);
    if (!agentData) {
        console.log('\n❌ Agent creation failed');
        return;
    }
    
    // Step 3: Create a customer (as admin)
    const customerData = await createUser(adminToken, 'customer', testConfig.testUsers.customer);
    if (!customerData) {
        console.log('\n❌ Customer creation failed');
        return;
    }
    
    // Step 4: Test agent login
    const agentToken = await testUserLogin(
        agentData.user.email, 
        agentData.tempPassword, 
        'agent'
    );
    
    // Step 5: Test customer login
    await testUserLogin(
        customerData.user.email, 
        customerData.tempPassword, 
        'customer'
    );
    
    // Step 6: Test agent creating customer
    if (agentToken) {
        await testAgentCreateCustomer(agentToken);
    }
    
    console.log('\n✨ User Onboarding Tests Completed!');
    console.log('\n📧 Check email inbox for credential emails');
    console.log('🔗 Users can now login and access their dashboards');
    console.log('\nNext Steps:');
    console.log('- Verify email delivery and formatting');
    console.log('- Test login links in emails');
    console.log('- Update frontend to use new endpoints');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runUserOnboardingTests().catch(console.error);
}

export { runUserOnboardingTests };