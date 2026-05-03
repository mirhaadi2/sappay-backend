export interface AdminProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published';
  category?: string;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Detailed variant information
 * Used in product details responses
 */
export interface AdminProductVariantDetail {
  id: string;
  sku?: string;
  price: number;
  discountedPrice?: number;
  discountedPercent?: number;
  weight?: number;
  weightUnit?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified variant for list views
 * Includes count to optimize serialization
 */
export interface AdminProductVariantSummary {
  id: string;
  sku?: string;
  price: number;
  weight?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * Seller offering information for a product
 * Includes seller details, pricing, and stock information
 */
export interface AdminProductSellerOffering {
  sellerProductId: string;
  sellerId: string;
  sellerBusinessName: string;
  sellerOwnerName: string;
  sellerOwnerEmail: string;
  sellerBusinessPhone: string;
  sellerCommissionRate?: number;
  sellerStatus: string;
  sellerSku?: string;
  sellerPrice: number;
  costPrice?: number;
  discountedPrice?: number;
  discountedPercent?: number;
  rating?: number;
  ratingCount?: number;
  sellerDescription?: string;
  sellerImages?: string[];
  sellerWeight?: number;
  sellerDimensions?: Record<string, any>;
  warrantyMonths?: number;
  sellerProductStatus: string;
  sellerProductCreatedAt: string;
  sellerProductUpdatedAt: string;
  inventoryId?: string;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  reorderLevel: number;
  lastRestockedAt?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  descriptionDetails?: Array<{
    type: 'text' | 'highlight' | 'point';
    content: string;
  }>;
  benefits?: string[];
  ingredients?: string[];
  nutritionFacts?: Array<{
    label: string;
    value: string;
  }>;
  price: number;
  weight?: number;
  gst_rate?: number;
  images: string[];
  imageUrl: string;
  category: string;
  categoryName?: string;
  status: 'draft' | 'published';
  isFeatured: boolean;
  isNew: boolean;
  isCustomerFavourites: boolean;
  isBestseller: boolean;
  stock: number;
  /**
   * Product variants - populated in list as count summary, detailed in product details
   */
  variantsCount: number;
  variants?: AdminProductVariantDetail[];
  /**
   * All sellers offering this product with pricing and stock details
   */
  sellerOfferings?: AdminProductSellerOffering[];
  sellerOfferingsPagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductsListResponse {
  success: boolean;
  data: {
    products: AdminProduct[];
    total: number;
    page: number;
    limit: number;
  };
}
