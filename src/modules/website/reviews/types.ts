/**
 * Website Reviews Module Types
 * Defines all DTOs and response types for product reviews
 */

export interface CreateReviewRequest {
    customerId: string;
    orderId: string;
    orderItemId: string;
    productId: string;
    rating: number;
    comment?: string;
}

export interface ReviewFilters {
    customerId?: string;
    productId?: string;
    sellerProductId?: string;
    rating?: number;
    limit?: number;
    offset?: number;
}

export interface ReviewResponse {
    id: string;
    customerId: string;
    orderId: string;
    orderItemId: string;
    productId: string;
    rating: number;
    comment?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewListResponse {
    success: boolean;
    data: {
        reviews: ReviewResponse[];
        total: number;
        limit: number;
        offset: number;
    };
}

export interface UpdateReviewRequest {
    rating?: number;
    comment?: string;
}
