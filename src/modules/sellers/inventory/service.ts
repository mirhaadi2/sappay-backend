import {
  createInventory,
  findBySellerProductId,
  updateInventory,
  reserveStockRepo,
  decrementStock,
  releaseReservedStock,
  getSellerInventory,
} from './repository';
import { createHistoryRecord } from './histories';
import { AppError } from '../../../utils/AppError';
import { buildPaginatedResponse } from '../../shared/pagination';

export const initializeInventoryService = async (
  sellerProductId: string,
  initialStock: number = 0
) => {
  const inventory = await createInventory({
    sellerProductId,
    totalStock: initialStock,
    availableStock: initialStock,
    reservedStock: 0,
    soldStock: 0,
    reorderLevel: 10,
  });

  // Create history record for initial stock entry
  if (initialStock > 0) {
    await createHistoryRecord({
      inventoryId: inventory.id,
      sellerProductId,
      type: 'STOCK_ADDED',
      quantity: initialStock,
      previousStock: 0,
      newStock: initialStock,
      notes: 'Initial stock entry',
    });
  }

  return inventory;
};

export const getInventoryService = async (inventoryId: string) => {
  const inventory = await findBySellerProductId(inventoryId);
  if (!inventory) {
    throw new AppError('NotFound', 404, 'Inventory not found');
  }
  return inventory;
};

export const updateStockService = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) {
    throw new AppError('NotFound', 404, 'Inventory not found');
  }

  return await updateInventory(inventory.id, {
    totalStock: inventory.totalStock + quantity,
    availableStock: inventory.availableStock + quantity,
    lastRestockedAt: new Date(),
  });
};

export const reserveStockService = async (sellerProductId: string, quantity: number) => {
  return await reserveStockRepo(sellerProductId, quantity);
};

export const confirmOrderService = async (sellerProductId: string, quantity: number) => {
  return await decrementStock(sellerProductId, quantity);
};

export const cancelOrderService = async (sellerProductId: string, quantity: number) => {
  return await releaseReservedStock(sellerProductId, quantity);
};

export const checkAvailabilityService = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) return false;
  return inventory.availableStock >= quantity;
};

export const getSellerInventoryService = async (sellerId: string, filters: any = {}) => {
  const { page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  const response = await getSellerInventory(sellerId, { ...filters, limit, page, offset });
  return buildPaginatedResponse(response.rows, response.count, { page, limit, offset });
};

export const logInventoryTransaction = async (
  inventoryId: string,
  sellerProductId: string,
  type: string,
  quantity: number,
  previousStock: number,
  newStock: number,
  reference?: string,
  notes?: string
) => {
  return await createHistoryRecord({
    inventoryId,
    sellerProductId,
    type,
    quantity,
    previousStock,
    newStock,
    reference,
    notes,
  });
};
