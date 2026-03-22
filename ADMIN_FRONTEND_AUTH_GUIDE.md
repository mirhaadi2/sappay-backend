# Admin-Frontend Authentication Implementation Guide

## Overview

Admin-Frontend should follow the **exact same authentication pattern** as website-frontend and seller-frontend:
- **Session-based** with HttpOnly cookies (server-managed)
- **localStorage** for client-side persistence
- **React Query** for async state management
- **Context/Hook** for global auth state
- **GET /me endpoint** on app load to restore sessions

---

## Backend Response Format

### Login Response Structure
**Endpoint:** `POST /api/admin/auth/login`

**Response (matches website/seller pattern):**
```json
{
  "success": true,
  "data": {
    "data": {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "superadmin@example.com",
        "name": "Super Admin",
        "status": "active",
        "user_type": "admin"
      }
    }
  }
}
```

**For Staff User:**
```json
{
  "success": true,
  "data": {
    "data": {
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "email": "admin.manager@example.com",
        "name": "Admin Manager",
        "status": "active",
        "department": "Management",
        "user_type": "staff"
      }
    }
  }
}
```

**Key difference from other portals:**
- Includes `user_type: 'admin' | 'staff'` to differentiate users
- Same nested `data.data` wrapper as website-frontend

---

## Get Current User Response

**Endpoint:** `GET /api/admin/auth/me`

**Response (when authenticated):**
```json
{
  "success": true,
  "data": {
    "data": {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "superadmin@example.com",
        "name": "Super Admin",
        "status": "active",
        "user_type": "admin"
      }
    }
  }
}
```

**Response (when not authenticated):**
```json
{
  "success": true,
  "data": {
    "data": {
      "user": null
    }
  }
}
```

---

## Frontend Implementation Pattern

### 1. API Client (Mimic website-frontend structure)

**File:** `admin-frontend/src/api/auth/client.ts`

```typescript
import { apiMethods } from '../index';

export interface AdminAuthUser {
  id: string;
  email: string;
  name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  user_type: 'admin' | 'staff';
  department?: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  success: boolean;
  data: {
    data: {
      user: AdminAuthUser | null;
    };
  };
}

export const adminAuthApi = {
  login: async (data: LoginData): Promise<AdminAuthResponse> => {
    const response = await apiMethods.post<AdminAuthResponse>(
      '/admin/auth/login',
      data
    );
    return response.data;
  },

  getProfile: async (): Promise<AdminAuthResponse> => {
    const response = await apiMethods.get<AdminAuthResponse>(
      '/admin/auth/me'
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiMethods.post('/admin/auth/logout', {});
  },
};
```

---

### 2. React Query Hook

**File:** `admin-frontend/src/api/auth/hooks.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAuthApi, AdminAuthUser, LoginData } from './client';

export const useAdminAuth = () => {
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: adminAuthApi.login,
    onSuccess: (data: any) => {
      // Update React Query cache
      queryClient.setQueryData(['admin', 'user'], data.data.data.user);
      
      // Store in localStorage (like website/seller do)
      if (data.data.data.user) {
        localStorage.setItem('ADMIN_user', JSON.stringify(data.data.data.user));
      }
    },
  });

  // Profile query - runs on app load to restore session
  const profileQuery = useQuery({
    queryKey: ['admin', 'user'],
    queryFn: async () => {
      const response = await adminAuthApi.getProfile();
      return response.data.data.user;
    },
    retry: false, // Don't retry on 401
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: adminAuthApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(['admin', 'user'], null);
      localStorage.removeItem('ADMIN_user');
    },
  });

  return {
    user: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    isAuthenticated: !!profileQuery.data,
    loginMutation,
    logoutMutation,
  };
};
```

---

### 3. Auth Context (Mimic website-frontend)

**File:** `admin-frontend/src/context/AdminAuthContext.tsx`

```typescript
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAdminAuth } from '../api/auth/hooks';
import { AdminAuthUser } from '../api/auth/client';

interface AdminAuthContextType {
  user: AdminAuthUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: Error | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated, loginMutation, logoutMutation, error } = useAdminAuth();
  const [contextError, setContextError] = useState<Error | null>(null);

  const login = async (email: string, password: string) => {
    setContextError(null);
    try {
      await loginMutation.mutateAsync({ email, password });
      // Auto-redirect after login (or let route handler do it)
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setContextError(new Error(errorMessage));
      throw err;
    }
  };

  const logout = async () => {
    setContextError(null);
    try {
      await logoutMutation.mutateAsync();
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Logout failed';
      setContextError(new Error(errorMessage));
      throw err;
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        error: contextError || (error as Error) || null,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuthContext = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuthContext must be used within AdminAuthProvider');
  }
  return context;
};
```

---

### 4. Login Page Component

**File:** `admin-frontend/src/pages/LoginPage.tsx`

```typescript
import React, { useState } from 'react';
import { useAdminAuthContext } from '../context/AdminAuthContext';
import { useForm } from 'react-hook-form';

interface LoginFormData {
  email: string;
  password: string;
}

export const AdminLoginPage: React.FC = () => {
  const { login, error, isLoading } = useAdminAuthContext();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              placeholder="Email address"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}

            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              placeholder="Password"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

---

### 5. Protected Route Component

**File:** `admin-frontend/src/components/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuthContext } from '../context/AdminAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuthContext();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
```

---

### 6. App Root Component

**File:** `admin-frontend/src/App.tsx`

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminLoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
};
```

---

### 7. Local Storage Restoration

**During App Load:**

1. **AdminAuthProvider mounts**
2. **useAdminAuth() hook runs**
3. **profileQuery executes:** calls `GET /api/admin/auth/me`
   - If session valid: returns user data
   - If session invalid: returns `null` (401 handled gracefully)
4. **Frontend reads localStorage** (optional, use for instant UI update):
   ```typescript
   const cachedUser = localStorage.getItem('ADMIN_user');
   if (cachedUser) {
     // Show user immediately while profileQuery loads
   }
   ```

---

## Key Differences from Backend Response

| Aspect | Website | Seller | Admin |
|--------|---------|--------|-------|
| Login endpoint | `/auth/login` | `/sellers/login` | `/admin/auth/login` |
| Response wrapper | `data.data.user` | `data.seller` | `data.data.user` |
| Has user_type? | No | No | **Yes** (admin\|staff) |
| localStorage key | `WEBSITE_user` | `SELLER_user` | `ADMIN_user` |
| Context hook | `useAuth()` | `useSellerAuth()` | `useAdminAuthContext()` |
| Protected route | `ProtectedRoute` | `ProtectedRoute` | `ProtectedRoute` |
| Auth check | `profileQuery` | `profileQuery` | `profileQuery` |

---

## Session Flow Diagram

```
User visits /admin/login
    ↓
AdminAuthProvider mounts
    ↓
profileQuery runs: GET /api/admin/auth/me
    ↓
[Session Cookie Auto-Sent by Browser]
    ↓
Backend checks session:
  - Valid sesion → return user data
  - No session → return user: null
    ↓
Query resolves with user or null
    ↓
ProtectedRoute checks isAuthenticated:
  - user exists → render dashboard
  - user null → redirect to /admin/login
    ↓
[User Stays Logged In]
User enters credentials
    ↓
POST /api/admin/auth/login
    ↓
[Backend validates, creates session cookie]
    ↓
Response: { data: { data: { user: {...} } } }
    ↓
loginMutation.onSuccess:
  - Update React Query cache
  - localStorage.setItem('ADMIN_user', user)
    ↓
Redirect to /admin/dashboard
```

---

## Error Handling

### Handle 401 Errors Gracefully

```typescript
// In api/index.ts or interceptor:
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state
      localStorage.removeItem('ADMIN_user');
      queryClient.setQueryData(['admin', 'user'], null);
      
      // Redirect to login
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Testing Credentials

Login with these to test:

**Admin User:**
```
Email:    superadmin@example.com
Password: SuperAdmin123!
user_type: admin
```

**Staff User:**
```
Email:    admin.manager@example.com
Password: AdminManager123!
user_type: staff
```

---

## Summary

✅ **Session-based:** HttpOnly cookies handled automatically
✅ **React Query:** Handles async state + caching
✅ **Context:** Global auth state management
✅ **localStorage:** Persist user info on client
✅ **GET /me:** Restore session on app load
✅ **Protected Routes:** Prevent unauthorized access
✅ **Consistent Pattern:** Matches website + seller implementations

This is now **functionally identical** to website and seller authentication! 🎉
