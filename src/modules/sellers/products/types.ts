/**
 * Seller Products Types
 * Type definitions for seller product operations
 */

import { PaginatedResponse } from '../../shared/pagination';

export interface SellerProductCreateInput {
  sellerPrice: number;
  costPrice?: number;
  discountedPrice?: number;
  discountedPercent?: number;
  rating?: number;
  ratingCount?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SellerProductUpdateInput {
  sellerPrice?: number;
  costPrice?: number;
  discountedPrice?: number;
  discountedPercent?: number;
  rating?: number;
  ratingCount?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface SellerProductPriceUpdate {
  sellerPrice: number;
  costPrice?: number;
  discountedPrice?: number;
  discountedPercent?: number;
}

export interface SellerProductsListParams {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'all';
  search?: string;
  category?: string;
  sortBy?: 'createdAt' | 'sellerPrice';
  sortOrder?: 'asc' | 'desc';
}

export interface SellerProductListItem {
  sellerProductId: string;
  productId: string;
  name: string;
  slug: string;
  images: string[];
  categoryId: string;
  sellerPrice: number;
  costPrice?: number;
  discountedPrice?: number;
  discountedPercent?: number;
  rating?: number;
  ratingCount?: number;
  availableStock: number;
  status: string;
}

export type SellerProductsListResponse = PaginatedResponse<SellerProductListItem>;