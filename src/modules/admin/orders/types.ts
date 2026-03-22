export interface AdminOrderQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  sellerId?: string;
  customerId?: string;
  sortBy?: 'createdAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  sellerId: string;
  sellerName: string;
  items: AdminOrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrdersListResponse {
  success: boolean;
  data: {
    orders: AdminOrder[];
    total: number;
    page: number;
    limit: number;
  };
}
