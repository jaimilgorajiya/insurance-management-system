/**
 * Simple test script to verify the unified authentication system
 * Run with: node test-auth.js
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = {
    admin: { email: 'admin@test.com', password: 'admin123' },
    agent: { email: 'agent@test.com', password: 'agent123' },
    customer: { email: 'customer@test.com', password: 'customer123' }
};

async function testLogin(role, credentials) {
    try {
        console.log(`\n🧪 Testing ${role} login...`);
        
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ ${role} login successful`);
            console.log(`   User ID: ${data.data.user.id}`);
            console.log(`   Role: ${data.data.user.role}`);
            console.log(`   Token: ${data.data.accessToken.substring(0, 20)}...`);
            return data.data.accessToken;
        } else {
            console.log(`❌ ${role} login failed: ${data.message}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ ${role} login error: ${error.message}`);
        return null;
    }
}

async function testProtectedRoute(token, route, expectedRole) {
    try {
        console.log(`\n🔒 Testing protected route: ${route}`);
        
        const response = await fetch(`${BASE_URL}${route}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Access granted to ${route}`);
        } else {
            console.log(`❌ Access denied to ${route}: ${data.message}`);
        }
    } catch (error) {
        console.log(`❌ Route test error: ${error.message}`);
    }
}

async function runTests() {
    console.log('🚀 Starting Authentication System Tests');
    console.log('=====================================');
    
    // Test unified login for each role
    const tokens = {};
    
    for (const [role, credentials] of Object.entries(testUsers)) {
        const token = await testLogin(role, credentials);
        if (token) {
            tokens[role] = token;
        }
    }
    
    // Test protected routes if we have tokens
    if (tokens.admin) {
        await testProtectedRoute(tokens.admin, '/admin/all', 'admin');
        await testProtectedRoute(tokens.admin, '/agent/all', 'admin');
    }
    
    if (tokens.agent) {
        await testProtectedRoute(tokens.agent, '/admin/all', 'agent');
    }
    
    console.log('\n✨ Tests completed!');
    console.log('\nNote: These tests require actual users in the database.');
    console.log('Create test users first or modify credentials accordingly.');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testLogin, testProtectedRoute };