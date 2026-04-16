export interface AdminUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'banned';
  sortBy?: 'createdAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'active' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersListResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  };
}
