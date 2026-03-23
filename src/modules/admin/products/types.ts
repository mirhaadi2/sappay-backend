export interface AdminProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published';
  category?: string;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  discountedPercent?: number;
  gst_rate?: number;
  images: string[];
  imageUrl: string;
  category: string;
  categoryName?: string;
  status: 'draft' | 'published';
  isFeatured: boolean;
  stock: number;
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
