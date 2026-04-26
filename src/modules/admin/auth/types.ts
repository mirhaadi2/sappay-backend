/**
 * Admin Authentication Module Types
 * Defines all DTOs and response types for admin login/logout
 */

export interface AdminPayload {
    id: string;
    email: string;
    name: string | null | undefined;
    status: string;
}

export interface StaffPayload {
    id: string;
    email: string;
    name: string;
    status: string;
    department?: string | null;
}

export type UserPayload = (AdminPayload | StaffPayload) & {
    user_type: "admin" | "staff";
};

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        user: AdminPayload | StaffPayload;
        user_type: "admin" | "staff";
    };
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export interface MeResponse {
    success: boolean;
    data: {
        user: AdminPayload | StaffPayload;
        user_type: "admin" | "staff";
    };
}
