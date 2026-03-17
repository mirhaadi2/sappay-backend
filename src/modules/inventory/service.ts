import {
  createInventory,
  findBySellerProductId,
  updateInventory,
  reserveStockRepo,
  decrementStock,
  releaseReservedStock,
} from './repository';
import { AppError } from '../../utils/AppError';

export const initializeInventoryService = async (sellerProductId: string) => {
  return await createInventory({
    sellerProductId,
    totalStock: 0,
    availableStock: 0,
    reservedStock: 0,
    soldStock: 0,
    reorderLevel: 10,
  });
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
