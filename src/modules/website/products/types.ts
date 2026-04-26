/**
 * Website Products Module Types
 * Defines all DTOs and response types for product catalog and search
 */

import { PaginatedResponse } from '../../shared/pagination';

export interface ProductSearchQuery {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'rating' | 'newest' | 'popularity';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    page?: number;
}

export interface ProductFilters {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    limit?: number;
    offset?: number;
}

export interface ProductVariantInfo {
    id: string;
    name: string;
    sku: string;
    price: number;
    discountedPrice: number;
    stock: number;
    isAvailable: boolean;
}

export interface ProductResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    variantCount: number;
    images: string[];
    rating?: number;
    reviewCount?: number;
    isAvailable: boolean;
    variants?: ProductVariantInfo[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductDetailResponse extends ProductResponse {
    category?: string;
    sellerId?: string;
    specifications?: Record<string, string>;
    fullDescription?: string;
}

export type ProductSearchResponse = PaginatedResponse<ProductResponse>;

export interface ProductListResponse {
    success: boolean;
    data: {
        products: ProductResponse[];
        total: number;
        limit: number;
        offset: number;
    };
}
