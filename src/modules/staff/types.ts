/**
 * Staff Module Types
 * Defines all TypeScript interfaces and types for staff operations
 */

export interface StaffPayload {
    id: string;
    email: string;
    name: string;
    status: string;
    department?: string | null;
}

export interface StaffCreateDTO {
    email: string;
    password: string;
    name: string;
    phone?: string;
    department?: string;
    manager_id?: string;
    hire_date?: Date;
}

export interface StaffUpdateDTO {
    email?: string;
    name?: string;
    phone?: string;
    department?: string;
    manager_id?: string;
    hire_date?: Date;
}

export interface StaffListFilters {
    status?: 'active' | 'inactive' | 'suspended';
    department?: string;
    limit?: number;
    offset?: number;
    search?: string; // Search by name or email
}

export interface StaffListResult {
    staff: any[];
    total: number;
    limit: number;
    offset: number;
}

export interface StaffResponse {
    id: string;
    email: string;
    name: string;
    phone?: string;
    status: 'active' | 'inactive' | 'suspended';
    department?: string;
    manager_id?: string;
    hire_date?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface StaffDetailResponse extends StaffResponse {
    roles?: any[];
    manager?: StaffResponse;
}
