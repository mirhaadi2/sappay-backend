import { withTransaction } from '../../../utils/transaction';
import {
    AdminInventoryUpdateInput,
    AdminAddStockInput,
    AdminRemoveStockInput,
    AdminInventoryQuery,
} from './types';
import {
    listInventory,
    getProductInventory,
    updateInventory,
    addStock,
    removeStock,
    getInventoryHistory,
    getInventoryStats,
} from './repository';

export const adminListInventory = async (params: AdminInventoryQuery) => {
    return listInventory(params);
};

export const adminGetProductInventory = async (productId: string) => {
    return getProductInventory(productId);
};

export const adminUpdateInventory = async (inventoryId: string, updates: AdminInventoryUpdateInput) => {
    return withTransaction(async (transaction) => {
        return updateInventory(inventoryId, updates, transaction);
    });
};

export const adminAddStock = async (inventoryId: string, input: AdminAddStockInput) => {
    return withTransaction(async (transaction) => {
        return addStock(inventoryId, input, transaction);
    });
};

export const adminRemoveStock = async (inventoryId: string, input: AdminRemoveStockInput) => {
    return withTransaction(async (transaction) => {
        return removeStock(inventoryId, input, transaction);
    });
};

export const adminGetInventoryHistory = async (
    page: number = 1,
    limit: number = 20,
    filters: {
        productId?: string;
        sellerId?: string;
        inventoryId?: string;
    } = {},
) => {
    return getInventoryHistory(page, limit, filters);
};

export const adminGetInventoryStats = async () => {
    return getInventoryStats();
};
