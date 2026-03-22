export interface AdminSellerQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'suspended';
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  sortBy?: 'createdAt' | 'businessName';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminSeller {
  id: string;
  email: string;
  name: string;
  businessName: string;
  businessLicense?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  status: 'active' | 'suspended';
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSellersListResponse {
  success: boolean;
  data: {
    sellers: AdminSeller[];
    total: number;
    page: number;
    limit: number;
  };
}
