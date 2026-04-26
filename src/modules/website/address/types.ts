/**
 * Website Address Module Types
 * Defines all DTOs and response types for customer addresses
 */

export enum AddressType {
    HOME = 'HOME',
    WORK = 'WORK',
    OTHER = 'OTHER',
}

export interface CreateAddressRequest {
    type: AddressType;
    name?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault?: boolean;
}

export interface UpdateAddressRequest {
    type?: AddressType;
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
}

export interface AddressResponse {
    id: string;
    customerId: string;
    type: AddressType;
    name?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AddressListResponse {
    success: boolean;
    data: {
        addresses: AddressResponse[];
        total: number;
    };
}

export interface SetDefaultAddressRequest {
    addressId: string;
}
