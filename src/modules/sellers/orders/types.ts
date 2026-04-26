/**
 * Sellers Orders Module Types
 * Defines all DTOs and response types for seller order management
 */

export interface SellerOrderListQuery {
    status?: string;
    limit?: number;
    offset?: number;
    page?: number;
    sortBy?: 'createdAt' | 'totalAmount';
    sortOrder?: 'asc' | 'desc';
}

export interface SellerOrderItemResponse {
    id: string;
    orderId: string;
    productId: string;
    productVariantId: string;
    sku: string;
    quantity: number;
    price: number;
    discountedPrice: number;
    discountedPercent: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface SellerOrderResponse {
    id: string;
    orderNumber: string;
    customerId?: string;
    guestEmail?: string;
    guestPhone?: string;
    subtotal: number;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    shippingCost?: number;
    status: string;
    paymentStatus: string;
    items: SellerOrderItemResponse[];
    createdAt: string;
    updatedAt: string;
}

export interface SellerOrderListResponse {
    success: boolean;
    data: {
        orders: SellerOrderResponse[];
        total: number;
        limit: number;
        offset: number;
    };
}

export interface UpdateOrderItemStatusRequest {
    status: string;
    notes?: string;
}

export interface UpdateOrderItemStatusResponse {
    success: boolean;
    data: SellerOrderItemResponse;
}
