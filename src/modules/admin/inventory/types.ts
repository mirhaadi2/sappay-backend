export interface AdminInventoryItem {
    id: string;
    sellerProductId: string;
    productId: string;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    reorderLevel: number;
    lastRestockedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    sellerSku: string;
    sellerPrice: number;
    discountedPrice: number | null;
    discountedPercent: number | null;
    sellerName: string;
    sellerId: string;
    productName: string;
}

export interface AdminInventoryUpdateInput {
    totalStock?: number;
    availableStock?: number;
    reorderLevel?: number;
    notes?: string;
}

export interface AdminAddStockInput {
    quantity: number;
    notes?: string;
}

export interface AdminRemoveStockInput {
    quantity: number;
    reason: string;
    notes?: string;
}

export interface AdminInventoryHistoryItem {
    id: string;
    type: 'STOCK_ADDED' | 'STOCK_REMOVED' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
    quantity: number;
    previousStock: number;
    newStock: number;
    reference?: string;
    notes?: string;
    createdAt: Date;
    inventoryId: string;
    sellerSku: string;
    sellerName: string;
    productName: string;
}

export interface AdminInventoryQuery {
    page?: number;
    limit?: number;
    productId?: string;
    sellerId?: string;
    lowStock?: boolean;
    search?: string;
}

export interface AdminInventoryResponse {
    success: boolean;
    data: AdminInventoryItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AdminInventoryHistoryResponse {
    success: boolean;
    data: {
        data: AdminInventoryHistoryItem[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export interface AdminInventoryStats {
    totalItems: number;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    lowStockItems: number;
    uniqueProducts: number;
    uniqueSellers: number;
}