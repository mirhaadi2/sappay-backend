# Admin & Staff Authentication API Documentation

## Overview

Complete authentication system for **Admin** and **Staff** portals with role-based access control (RBAC) support.

---

## Admin Authentication APIs

### 1. Admin Login
**POST** `/api/admin/auth/login`

#### Request Body
```json
{
  "email": "superadmin@example.com",
  "password": "SuperAdmin123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "superadmin@example.com",
      "name": "Super Admin",
      "status": "active"
    }
  }
}
```

#### Error Responses
- **400** - Missing email or password
- **401** - Invalid email/password or account suspended
- **500** - Server error

#### Notes
- Password must match hashed value in database
- Only active admins can login
- Session is automatically created on successful login
- Password is never returned in response

---

### 2. Get Current Admin Details
**GET** `/api/admin/auth/me`

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "superadmin@example.com",
      "name": "Super Admin",
      "status": "active"
    }
  }
}
```

#### Unauthenticated Response (200)
```json
{
  "success": true,
  "data": {
    "admin": null
  }
}
```

#### Notes
- No authentication required
- Returns `null` if no active session
- Safe to call on page load to check auth status

---

### 3. Admin Logout
**POST** `/api/admin/auth/logout`

#### Requirements
- Must be authenticated (session required)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Error Responses
- **401** - Not authenticated
- **500** - Session destroy error

#### Notes
- Destroys session and clears cookies
- Safe to call even if already logged out

---

## Staff Authentication APIs

### 1. Staff Login
**POST** `/api/staff/auth/login`

#### Request Body
```json
{
  "email": "admin.manager@example.com",
  "password": "AdminManager123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "staff": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "admin.manager@example.com",
      "name": "Admin Manager",
      "status": "active",
      "department": "Management"
    }
  }
}
```

#### Error Responses
- **400** - Missing email or password
- **401** - Invalid email/password or account suspended
- **500** - Server error

#### Notes
- Staff must have active status
- Department is optional field
- Session created automatically on success
- Integrates with RBAC system (roles/permissions loaded separately)

---

### 2. Get Current Staff Details
**GET** `/api/staff/auth/me`

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "staff": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "admin.manager@example.com",
      "name": "Admin Manager",
      "status": "active",
      "department": "Management"
    }
  }
}
```

#### Unauthenticated Response (200)
```json
{
  "success": true,
  "data": {
    "staff": null
  }
}
```

#### Notes
- No authentication required
- Returns `null` if no active session
- Safe for initial page load authentication checks

---

### 3. Staff Logout
**POST** `/api/staff/auth/logout`

#### Requirements
- Must be authenticated (session required)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Error Responses
- **401** - Not authenticated
- **500** - Session destroy error

#### Notes
- Destroys session and clears cookies
- Clears role/permission cache if applicable

---

## Seed Credentials

Use these credentials for testing (created via migration):

### Admin Portal
- **Email**: `superadmin@example.com`
- **Password**: `SuperAdmin123!`
- **Status**: Active
- **Permissions**: All (SUPER_ADMIN role)

### Staff Portal
1. **Admin Manager**
   - **Email**: `admin.manager@example.com`
   - **Password**: `AdminManager123!`
   - **Role**: ADMIN_MANAGER
   - **Department**: Management

2. **Inventory Manager**
   - **Email**: `inventory.manager@example.com`
   - **Password**: `InventoryManager123!`
   - **Role**: INVENTORY_MANAGER
   - **Department**: Inventory

---

## Security Features

### Password Hashing
- Algorithm: bcrypt (cost factor: 12)
- Never transmitted in responses
- Verified securely on login

### Session Management
- Session-based authentication (Express sessions)
- Portal-aware session configuration
- Automatic session destruction on logout
- Cookie-based session tracking

### Status Validation
- Only `active` admins/staff can login
- Inactive/suspended accounts rejected with clear message
- Status stored in session for quick checks

### Error Messages
- Generic "Invalid email or password" to prevent account enumeration
- Specific status messages for account issues
- No sensitive data in error responses

---

## Implementation Architecture

### File Structure
```
src/modules/
├── admin/
│   └── auth/
│       ├── service.ts      # Login logic, password verification
│       ├── controller.ts   # HTTP request handlers
│       ├── middleware.ts   # Authentication middleware
│       ├── routes.ts       # Route definitions
│       └── index.ts        # Module exports
│
└── staff/
    └── auth/
        ├── service.ts      # Login logic, password verification
        ├── controller.ts   # HTTP request handlers
        ├── middleware.ts   # Authentication middleware
        ├── routes.ts       # Route definitions
        └── index.ts        # Module exports
```

### Middleware Functions

#### Admin
- `requireAdminAuth` - Checks session, requires authentication
- `requireActiveAdmin` - Checks session + active status

#### Staff
- `requireStaffAuth` - Checks session, requires authentication
- `requireActiveStaff` - Checks session + active status

**Usage:**
```typescript
router.post('/protected', requireActiveAdmin, handler);
```

---

## Integration Notes

### With RBAC System
Staff login integrates with RBAC:
1. Staff login successful → session created
2. RBAC middleware fetches staff roles/permissions separately
3. Permission checks use role data from database

### With Existing CRUD Endpoints
- Staff CRUD requires `requireActiveStaff` + permission checks
- Admin CRUD requires admin authentication + permission checks
- Login endpoints require NO authentication

### Session Configuration
- Configured per-portal (admin/staff/website)
- Uses Redis or memory store based on environment
- Cookie name matches portal configuration

---

## Testing with cURL

### Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SuperAdmin123!"
  }' \
  -c cookies.txt
```

### Get Admin Details
```bash
curl -X GET http://localhost:3000/api/admin/auth/me \
  -b cookies.txt
```

### Admin Logout
```bash
curl -X POST http://localhost:3000/api/admin/auth/logout \
  -b cookies.txt
```

### Staff Login
```bash
curl -X POST http://localhost:3000/api/staff/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.manager@example.com",
    "password": "AdminManager123!"
  }' \
  -c staff-cookies.txt
```

---

## Error Codes

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| UnauthorizedError | 401 | Invalid email or password | Wrong credentials |
| UnauthorizedError | 401 | Account is suspended | Account suspended |
| ValidationError | 400 | Email and password required | Missing fields |
| InternalError | 500 | Authentication failed | Server error |

---

## Next Steps for Frontend Integration

1. **Login Form**
   - POST to `/api/admin/auth/login` or `/api/staff/auth/login`
   - Store response for user display
   - Handle error messages gracefully

2. **Protected Routes**
   - Call `/api/admin/auth/me` on app load
   - Redirect to login if null returned
   - Display user info from response

3. **Logout**
   - POST to `/api/admin/auth/logout` or `/api/staff/auth/logout`
   - Clear local state
   - Redirect to login page

4. **Token/Session Persistence**
   - Cookies handled automatically by browser
   - No need for manual token storage
   - Session expires based on configuration

---

## Troubleshooting

### "Invalid email or password" for correct credentials
1. Check password case (passwords are case-sensitive)
2. Verify email is lowercase in database
3. Confirm account status is "active"

### "Account is suspended"
- Admin needs to activate account via CRUD endpoints
- Use PATCH `/api/admin/admins/:id` or `/api/staff/:id`

### Session not persisting
1. Check if cookies are enabled
2. Verify same domain/origin for requests
3. Check session store configuration
4. Confirm CORS credentials option is true

### 401 Unauthorized on logout
- Session may have already expired
- Safe to ignore and redirect to login
- Frontend should gracefully handle 401

---

## Database Models

### Admins Table
```
- id (UUID)
- email (unique)
- password (bcrypt hashed)
- name
- phone
- status (active/inactive/suspended)
- created_at
- updated_at
- deleted_at (soft delete)
```

### Staff Table
```
- id (UUID)
- email (unique)
- password (bcrypt hashed)
- name
- phone
- status (active/inactive/suspended)
- department
- manager_id (self-reference)
- hire_date
- created_at
- updated_at
- deleted_at (soft delete)
```

---

**Created**: March 22, 2026
**Version**: 1.0
**Status**: Production Ready
