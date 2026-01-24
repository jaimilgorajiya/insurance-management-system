# Authentication System Migration Guide

## Overview
The authentication system has been refactored from separate role-based login APIs to a unified role-based authentication system.

## Changes Made

### 🔄 API Changes

#### NEW: Unified Authentication
- **POST /api/auth/login** - Single login endpoint for all roles
- **POST /api/auth/logout** - Unified logout endpoint

#### DEPRECATED: Role-specific logins (still functional for backward compatibility)
- ~~POST /api/admin/login~~ → Use `/api/auth/login`
- ~~POST /api/agent/login~~ → Use `/api/auth/login`  
- ~~POST /api/customer/login~~ → Use `/api/auth/login`

### 🔐 Authentication Flow

#### Login Request
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin|agent|customer",
      "status": "active"
    },
    "accessToken": "jwt_token"
  }
}
```

#### JWT Payload
```json
{
  "id": "user_id",
  "role": "admin|agent|customer",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 🛡️ Authorization Rules

#### Route Protection
- **Admin routes** → `authorizeRoles("admin")`
- **Agent routes** → `authorizeRoles("agent", "admin")` 
- **Customer routes** → `authorizeRoles("customer", "admin")`

#### Role Hierarchy
- **Admin**: Full access to all resources
- **Agent**: Access to agent-specific resources + admin can manage agents
- **Customer**: Access to customer-specific resources + admin can manage customers

### 🔧 Technical Implementation

#### Password Security
- Uses `@jaimilgorajiya/password-utils` package
- `hashPassword()` for registration
- `comparePassword()` for login validation

#### JWT Configuration
- Payload: `{ id, role }`
- Secure cookie storage
- Environment-based expiry

#### Error Handling
- Standardized error responses
- Proper HTTP status codes
- Role-based access control messages

### 📋 Migration Checklist

#### Backend ✅
- [x] Unified login controller
- [x] Role-based authorization middleware
- [x] JWT payload standardization
- [x] Route protection implementation
- [x] Backward compatibility maintained

#### Frontend (Required)
- [ ] Update login forms to use `/api/auth/login`
- [ ] Implement role-based routing after login
- [ ] Update token handling logic
- [ ] Test all user flows

### 🧪 Testing

#### Test the new authentication:
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Access protected admin route
curl -X GET http://localhost:5000/api/admin/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 🚨 Important Notes

1. **Backward Compatibility**: Old login endpoints still work but are deprecated
2. **Frontend Changes Required**: Frontend must be updated to use the new unified login
3. **Role-based Routing**: Frontend should redirect users based on their role after login
4. **Security**: All routes are now properly protected with role-based authorization

### 🔄 Next Steps

1. Update frontend to use `/api/auth/login`
2. Implement role-based routing in frontend
3. Remove deprecated login endpoints after frontend migration
4. Add comprehensive testing for all user roles