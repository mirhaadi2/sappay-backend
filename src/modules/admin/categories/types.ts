export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId?: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryCreateInput {
  name: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string;
  image?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface AdminCategoryUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string;
  image?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface AdminCategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminCategoryListResponse {
  success: boolean;
  data: {
    categories: AdminCategory[];
    total: number;
    page: number;
    limit: number;
  };
}
