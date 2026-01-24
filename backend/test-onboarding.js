import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:5000/api';

// Test customer onboarding
async function testCustomerOnboarding() {
    try {
        console.log('🧪 Testing Customer Onboarding API...\n');

        // First, login as admin to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@insurecrm.com',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            throw new Error('Failed to login as admin');
        }

        const loginData = await loginResponse.json();
        const token = loginData.data.accessToken;
        console.log('✅ Admin login successful\n');

        // Create form data for onboarding
        console.log('2. Preparing onboarding data...');
        const formData = new FormData();
        
        // Personal details
        formData.append('firstName', 'John');
        formData.append('lastName', 'Doe');
        formData.append('dateOfBirth', '1990-01-15');
        formData.append('gender', 'Male');
        formData.append('occupation', 'Software Engineer');
        formData.append('annualIncome', '75000');
        
        // Contact information
        formData.append('email', 'john.doe@example.com');
        formData.append('phone', '+1-555-123-4567');
        formData.append('alternatePhone', '+1-555-987-6543');
        formData.append('addressLine1', '123 Main Street');
        formData.append('addressLine2', 'Apt 4B');
        formData.append('city', 'New York');
        formData.append('state', 'NY');
        formData.append('zipCode', '10001');
        formData.append('country', 'United States');

        // Create dummy files for testing (you would replace these with actual files)
        const dummyFileContent = 'This is a dummy file for testing purposes';
        
        // Create temporary files
        const tempDir = './temp-test-files';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const govIdPath = path.join(tempDir, 'government-id.txt');
        const proofAddressPath = path.join(tempDir, 'proof-address.txt');
        const incomeProofPath = path.join(tempDir, 'income-proof.txt');

        fs.writeFileSync(govIdPath, dummyFileContent);
        fs.writeFileSync(proofAddressPath, dummyFileContent);
        fs.writeFileSync(incomeProofPath, dummyFileContent);

        // Append files to form data
        formData.append('governmentId', fs.createReadStream(govIdPath));
        formData.append('proofOfAddress', fs.createReadStream(proofAddressPath));
        formData.append('incomeProof', fs.createReadStream(incomeProofPath));

        console.log('✅ Onboarding data prepared\n');

        // Submit onboarding
        console.log('3. Submitting customer onboarding...');
        const onboardingResponse = await fetch(`${API_BASE_URL}/customer-onboarding/onboard`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const onboardingResult = await onboardingResponse.json();

        if (!onboardingResponse.ok) {
            throw new Error(`Onboarding failed: ${onboardingResult.message}`);
        }

        console.log('✅ Customer onboarding successful!');
        console.log('📧 Customer ID:', onboardingResult.data.customer._id);
        console.log('🔑 Temporary Password:', onboardingResult.data.tempPassword);
        console.log('📄 KYC Status:', onboardingResult.data.customer.kycStatus);

        // Clean up temporary files
        fs.unlinkSync(govIdPath);
        fs.unlinkSync(proofAddressPath);
        fs.unlinkSync(incomeProofPath);
        fs.rmdirSync(tempDir);

        console.log('\n🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Clean up on error
        try {
            const tempDir = './temp-test-files';
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(tempDir, file));
                });
                fs.rmdirSync(tempDir);
            }
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError.message);
        }
    }
}

// Run the test
testCustomerOnboarding();