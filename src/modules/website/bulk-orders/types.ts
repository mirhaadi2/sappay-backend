/**
 * Website Bulk Orders Module Types
 * Defines all DTOs and response types for bulk order submissions
 */

export interface BulkOrderRequest {
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    product: string;
    estimatedQuantity: string;
    additionalRequirements?: string;
}

export interface BulkOrderResponse {
    id: string;
    bulkOrderNumber: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    product: string;
    estimatedQuantity: string;
    additionalRequirements?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface BulkOrderListResponse {
    success: boolean;
    data: {
        orders: BulkOrderResponse[];
        total: number;
        limit: number;
        offset: number;
    };
}

export interface BulkOrderUpdateStatusInput {
    status: 'pending' | 'contacted' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
}
