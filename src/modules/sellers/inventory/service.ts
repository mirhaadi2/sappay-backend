import {
  createInventory,
  findBySellerProductId,
  updateInventory,
  reserveStockRepo,
  decrementStock,
  releaseReservedStock,
  getSellerInventory,
  findInventoryByProductId,
  reserveStockByProductIdRepo,
} from "./repository";
import { createHistoryRecord, InventoryHistory } from './histories';
import { AppError } from "../../../utils/AppError";
import { buildPaginatedResponse } from "../../shared/pagination";
import { Transaction } from "sequelize";
import { ProductVariant } from '../../admin/products/product-variant/model';

export const initializeInventoryService = async (
  sellerProductId: string,
  initialStock: number = 0,
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
      type: "STOCK_ADDED",
      quantity: initialStock,
      previousStock: 0,
      newStock: initialStock,
      notes: "Initial stock entry",
    });
  }

  return inventory;
};

export const getInventoryService = async (inventoryId: string) => {
  const inventory = await findBySellerProductId(inventoryId);
  if (!inventory) {
    throw new AppError("NotFound", 404, "Inventory not found");
  }
  return inventory;
};

export const updateStockService = async (
  sellerProductId: string,
  quantity: number,
) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) {
    throw new AppError("NotFound", 404, "Inventory not found");
  }

  return await updateInventory(inventory.id, {
    totalStock: inventory.totalStock + quantity,
    availableStock: inventory.availableStock + quantity,
    lastRestockedAt: new Date(),
  });
};

export const reserveStockByProductIdService = async (
  productId: string,
  productVariantId: string,
  quantity: number,
  transaction?: Transaction,
) => {
  return await reserveStockByProductIdRepo(productId, productVariantId, quantity, transaction);
};

export const reserveStockService = async (
  sellerProductId: string,
  productVariantId: string,
  quantity: number,
) => {
  return await reserveStockRepo(sellerProductId, productVariantId, quantity);
};

export const confirmOrderService = async (
  sellerProductId: string,
  productVariantId: string,
  quantity: number,
  transaction?: any,
) => {
  return await decrementStock(sellerProductId, productVariantId, quantity, transaction);
};

export const cancelOrderService = async (
  productId: string,
  productVariantId: string,
  quantity: number,
  transaction?: any,
) => {
  return await releaseReservedStock(productId, productVariantId, quantity, transaction);
};

export const checkInventoryByProductIdService = async (
  productId: string,
  productVariantId: string,
  quantity: number,
  transaction?: Transaction,
) => {
  const inventory = await findInventoryByProductId(productId, transaction);
  if (!inventory) return false;

  const productVariant = await ProductVariant.findByPk(productVariantId, {
    attributes: ['weight', 'weightUnit'],
    raw: true,
    transaction,
  });
  if (!productVariant) return false;

  const unitMultiplier = productVariant.weightUnit?.toUpperCase() === 'G' ? 0.001 : 1;
  const weightPerUnitKg = parseFloat(String(productVariant.weight || '0')) * unitMultiplier;
  const totalWeightNeeded = weightPerUnitKg * quantity;

  return parseFloat(String(inventory?.dataValues?.availableStock)) >= totalWeightNeeded;
};

export const checkAvailabilityService = async (
  sellerProductId: string,
  productVariantId: string,
  quantity: number,
) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) return false;

  const productVariant = await ProductVariant.findByPk(productVariantId, {
    attributes: ['weight', 'weightUnit'],
    raw: true,
  });
  if (!productVariant) return false;

  const unitMultiplier = productVariant.weightUnit?.toUpperCase() === 'G' ? 0.001 : 1;
  const weightPerUnitKg = parseFloat(String(productVariant.weight || '0')) * unitMultiplier;
  const totalWeightNeeded = weightPerUnitKg * quantity;

  return parseFloat(String(inventory.availableStock)) >= totalWeightNeeded;
};

export const getSellerInventoryService = async (
  sellerId: string,
  filters: any = {},
) => {
  const { page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  const response = await getSellerInventory(sellerId, {
    ...filters,
    limit,
    page,
    offset,
  });
  return buildPaginatedResponse(response.rows, response.count, {
    page,
    limit,
    offset,
  });
};

export const logInventoryTransaction = async (
  inventoryId: string,
  sellerProductId: string,
  type: string,
  quantity: number,
  previousStock: number,
  newStock: number,
  reference?: string,
  notes?: string,
  transaction?: Transaction,
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
  }, transaction);
};

/**
 * Initialize inventory for admin-created products
 * Simple function that just initializes stock without seller involvement
 */
export const initializeAdminProductStockService = async (
  productId: string,
  initialStock: number = 0,
  addedBy?: string,
  transaction?: any,
) => {
  try {
    if (!initialStock || initialStock <= 0) {
      return {
        success: true,
        message: "No initial stock provided",
      };
    }

    const inventory = await createInventory({
      productId,
      totalStock: initialStock,
      availableStock: initialStock,
      reservedStock: 0,
      soldStock: 0,
      reorderLevel: 10,
    }, transaction);

    // Create history record for initial stock entry
    if (initialStock > 0) {
      await createHistoryRecord({
        inventoryId: inventory?.dataValues?.id || inventory.id,
        productId,
        addedBy: addedBy ?? null, // system action
        type: "STOCK_ADDED",
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        notes: "Initial stock entry",
      }, transaction);
    }

    // For now, just acknowledge the stock initialization
    // Stock management for admin products can be expanded later
    return {
      success: true,
      message: `Product initialized with ${initialStock} units of stock`,
      productId,
      initialStock,
    };
  } catch (error: any) {
    throw new AppError(
      "InternalServerError",
      500,
      `Stock initialization failed: ${error.message}`,
    );
  }
};
