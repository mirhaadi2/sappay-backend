/**
 * Website Customers Module Types
 * Defines all DTOs and response types for customer authentication and profile management
 */

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
}

export interface CheckUserExistsRequest {
    email: string;
    phone: string;
}

export interface CheckUserExistsResponse {
    success: boolean;
    exists: boolean;
}

export interface InitiateRegistrationRequest {
    name: string;
    email: string;
    phone: string;
}

export interface InitiateRegistrationResponse {
    success: boolean;
    message: string;
    expiresIn: number;
}

export interface VerifyRegistrationOtpRequest {
    email: string;
    otp: string;
}

export interface CompleteRegistrationRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface SendOtpForLoginRequest {
    contact: string; // email or phone
}

export interface VerifyOtpForLoginRequest {
    contact: string;
    otp: string;
}

export interface CustomerResponse {
    id: string;
    email: string;
    phone: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerListResponse {
    success: boolean;
    data: {
        customers: CustomerResponse[];
        total: number;
    };
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    email?: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: CustomerResponse;
    };
}
