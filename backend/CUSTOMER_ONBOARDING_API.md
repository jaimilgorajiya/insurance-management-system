# Customer Onboarding API Documentation

## Overview
The Customer Onboarding API provides a comprehensive 5-step onboarding process for new customers in the Insurance Management System (InsureCRM). This API handles personal details, contact information, KYC document uploads, policy selection, and final submission.

## Base URL
```
http://localhost:5000/api/customer-onboarding
```

## Authentication
All endpoints require JWT authentication with admin role privileges.

**Header:**
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Customer Onboarding Submission

**POST** `/onboard`

Submits a complete customer onboarding application with all required information and KYC documents.

**Content-Type:** `multipart/form-data`

**Form Fields:**

**Personal Details:**
- `firstName` (string, required) - Customer's first name
- `lastName` (string, required) - Customer's last name  
- `dateOfBirth` (string, required) - Date in YYYY-MM-DD format
- `gender` (string, required) - "Male", "Female", or "Other"
- `occupation` (string, required) - Customer's occupation
- `annualIncome` (number, required) - Annual income amount

**Contact Information:**
- `email` (string, required) - Customer's email address
- `phone` (string, required) - Primary phone number
- `alternatePhone` (string, optional) - Alternate phone number
- `addressLine1` (string, required) - Primary address line
- `addressLine2` (string, optional) - Secondary address line
- `city` (string, required) - City name
- `state` (string, required) - State/Province
- `zipCode` (string, required) - ZIP/Postal code
- `country` (string, required) - Country name

**KYC Documents (Files):**
- `governmentId` (file, required) - Government ID (Passport/Driver License)
- `proofOfAddress` (file, required) - Proof of address document
- `incomeProof` (file, required) - Income verification document

**Policy Selection:**
- `selectedPolicy` (string, optional) - Policy ID (for future use)

**File Requirements:**
- Supported formats: JPEG, PNG, GIF, PDF
- Maximum file size: 10MB per file
- All three KYC documents are required

**Response:**
```json
{
  "success": true,
  "message": "Customer onboarding completed successfully",
  "data": {
    "customer": {
      "_id": "customer_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "kycStatus": "pending",
      "onboardingCompleted": true,
      "onboardingCompletedAt": "2024-01-24T10:30:00.000Z",
      // ... other customer fields
    },
    "tempPassword": "generated_password"
  }
}
```

### 2. Get Customer Onboarding Details

**GET** `/details/:customerId`

Retrieves complete onboarding details for a specific customer.

**Parameters:**
- `customerId` (string) - Customer's MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "_id": "customer_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "address": {
        "addressLine1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "United States"
      },
      "kycDocuments": {
        "governmentId": {
          "filename": "gov-id-123456.jpg",
          "originalName": "passport.jpg",
          "uploadDate": "2024-01-24T10:30:00.000Z",
          "status": "pending"
        },
        // ... other documents
      },
      // ... other fields
    }
  }
}
```

### 3. Get KYC Document

**GET** `/kyc-document/:customerId/:documentType`

Downloads a specific KYC document for a customer.

**Parameters:**
- `customerId` (string) - Customer's MongoDB ObjectId
- `documentType` (string) - "governmentId", "proofOfAddress", or "incomeProof"

**Response:**
- Returns the actual file with appropriate content-type headers
- File is served inline for viewing in browser

### 4. Update KYC Document Status

**PUT** `/kyc-document/:customerId/:documentType/status`

Updates the approval status of a specific KYC document (Admin only).

**Parameters:**
- `customerId` (string) - Customer's MongoDB ObjectId
- `documentType` (string) - "governmentId", "proofOfAddress", or "incomeProof"

**Request Body:**
```json
{
  "status": "approved" // "pending", "approved", or "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document status updated successfully",
  "data": {
    "customer": {
      // Updated customer object
    },
    "overallKycStatus": "pending" // Overall KYC status after update
  }
}
```

## Data Models

### Enhanced User Model

The User model has been extended to support comprehensive onboarding:

```javascript
{
  // Personal Details
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String, // "Male", "Female", "Other"
  occupation: String,
  annualIncome: Number,
  
  // Contact Information
  email: String, // Required, unique
  mobile: String, // Primary phone
  alternatePhone: String,
  address: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // KYC Documents
  kycDocuments: {
    governmentId: {
      filename: String,
      originalName: String,
      uploadDate: Date,
      fileType: String,
      fileSize: Number,
      status: String // "pending", "approved", "rejected"
    },
    proofOfAddress: { /* same structure */ },
    incomeProof: { /* same structure */ }
  },
  
  // System Fields
  role: String, // "admin", "agent", "customer"
  status: String, // "active", "inactive"
  kycStatus: String, // "pending", "approved", "rejected"
  onboardingCompleted: Boolean,
  onboardingCompletedAt: Date,
  createdBy: ObjectId, // Reference to admin who created
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## File Storage

KYC documents are stored in the server filesystem at:
```
backend/uploads/kyc-documents/
```

Files are renamed with unique identifiers to prevent conflicts:
```
{documentType}-{timestamp}-{random}.{extension}
```

## Email Notifications

Upon successful onboarding, the system automatically sends a welcome email to the customer containing:
- Login credentials (email and temporary password)
- Instructions to change password
- KYC status information
- Support contact information

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (successful onboarding)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (customer/document not found)
- `500` - Internal Server Error

## Testing

Use the provided test script to verify the onboarding functionality:

```bash
npm run test:onboarding
```

This script will:
1. Login as admin
2. Submit a complete onboarding application
3. Verify the response
4. Clean up test files

## Security Considerations

1. **File Upload Security:**
   - File type validation (only images and PDFs)
   - File size limits (10MB max)
   - Unique filename generation
   - Secure file storage location

2. **Access Control:**
   - Admin-only onboarding submission
   - Role-based document access
   - Customer can only view their own documents

3. **Data Validation:**
   - Required field validation
   - Email format validation
   - Phone number format validation
   - Date validation

4. **Password Security:**
   - Temporary passwords are generated securely
   - Passwords are hashed before storage
   - Email delivery of credentials

## Integration with Frontend

The frontend CustomerOnboarding component integrates with this API by:

1. Collecting data through the 5-step wizard
2. Validating data on each step
3. Uploading files and form data via FormData
4. Handling success/error responses
5. Redirecting to customer list on success

The API endpoint used by frontend:
```javascript
const response = await fetch(`${API_BASE_URL}/customer-onboarding/onboard`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData // FormData object with all fields and files
});
```