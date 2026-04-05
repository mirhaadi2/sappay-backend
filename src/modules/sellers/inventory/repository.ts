import { Inventory } from './model';
import { SellerProduct } from '../../admin/products/seller-product/model';
import { AppError } from '../../../utils/AppError';
import { sequelize } from '../../../db/sequelize';
import { QueryTypes, Transaction } from 'sequelize';
import logger from '../../../utils/logger';

export const findInventoryByProductId = async (productId: string, transaction?: Transaction) => {
  return await Inventory.findOne({ where: { productId }, ...(transaction ? { transaction } : {}) });
};

export const createInventory = async (data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const inventory = await Inventory.create(data, { transaction });
    await transaction.commit();
    logger.info('Inventory created', { inventoryId: inventory.id });
    return inventory;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating inventory', { error });
    throw error;
  }
};

export const findBySellerProductId = async (sellerProductId: string) => {
  return await Inventory.findOne({ where: { sellerProductId } });
};

export const updateInventory = async (id: string, data: any) => {
  const transaction = await sequelize.transaction();
  try {
    const inventory = await Inventory.findByPk(id, { transaction });
    if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');
    const updated = await inventory.update(data, { transaction });
    await transaction.commit();
    logger.info('Inventory updated', { inventoryId: id });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating inventory', { inventoryId: id, error });
    throw error;
  }
};

export const getSellerInventory = async (sellerId: string, filters: any = {}) => {
  const { page = 1, limit = 20, offset = 0 } = filters;

  // 2. Define Queries
  const query = `
    SELECT 
      i.id,
      i.seller_product_id as "sellerProductId",
      i.total_stock as "totalStock",
      i.available_stock as "availableStock",
      i.reserved_stock as "reservedStock",
      i.sold_stock as "soldStock",
      i.reorder_level as "reorderLevel",
      i.last_restocked_at as "lastRestockedAt",
      i.created_at as "createdAt",
      i.updated_at as "updatedAt",
      sp.id as "productId",
      sp.seller_sku as "sellerSku",
      sp.seller_price as "sellerPrice",
      p.name as "productName"
    FROM inventory i
    INNER JOIN seller_products sp ON i.seller_product_id = sp.id
    INNER JOIN products p ON sp.product_id = p.id
    WHERE sp.seller_id = :sellerId
    ORDER BY i.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const countQuery = `
    SELECT COUNT(*)::int as count
    FROM inventory i
    INNER JOIN seller_products sp ON i.seller_product_id = sp.id
    WHERE sp.seller_id = :sellerId
  `;

  try {
    // 3. Parallel Execution (Professional Level)
    const [rows, countResult] = await Promise.all([
      sequelize.query(query, {
        replacements: { sellerId, limit, offset },
        type: QueryTypes.SELECT,
      }),
      sequelize.query(countQuery, {
        replacements: { sellerId },
        type: QueryTypes.SELECT,
      })
    ]);

    // 4. Return clean response
    return {
      rows: rows as any[],
      count: (countResult[0] as any)?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching seller inventory:', error);
    // Assuming AppError is defined in your custom errors file
    throw error; 
  }
};

export const decrementStock = async (sellerProductId: string, quantity: number, transaction?: Transaction) => {
  let txn = transaction;
  const needsCommit = !transaction; // Only commit if we created the transaction

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const inventory = await Inventory.findOne({ where: { sellerProductId }, transaction: txn });
    if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

    if (inventory.availableStock < quantity) {
      throw new AppError('BadRequest', 400, 'Insufficient stock');
    }

    const updated = await inventory.update({
      availableStock: inventory.availableStock - quantity,
      soldStock: inventory.soldStock + quantity,
    }, { transaction: txn });
    
    if (needsCommit) {
      await txn!.commit();
    }
    logger.info('Stock decremented', { sellerProductId, quantity });
    return updated;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback();
    }
    logger.error('Error decrementing stock', { sellerProductId, quantity, error });
    throw error;
  }
};

export const reserveStockByProductIdRepo = async (productId: string, quantity: number, transaction?: Transaction) => {
  const inventory = await findInventoryByProductId(productId, transaction);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

  if (inventory?.dataValues?.availableStock < quantity) {
    throw new AppError('BadRequest', 400, 'Insufficient stock');
  }

  return await inventory.update({
    availableStock: inventory.availableStock - quantity,
    reservedStock: inventory.reservedStock + quantity,
  }, transaction ? { transaction } : {});
};


export const reserveStockRepo = async (sellerProductId: string, quantity: number, transaction?: Transaction) => {
  let txn = transaction;
  const needsCommit = !transaction; // Only commit if we created the transaction

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const inventory = await Inventory.findOne({ where: { sellerProductId }, transaction: txn });
    if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

    if (inventory.availableStock < quantity) {
      throw new AppError('BadRequest', 400, 'Insufficient stock');
    }

    const updated = await inventory.update({
      availableStock: inventory.availableStock - quantity,
      reservedStock: inventory.reservedStock + quantity,
    }, { transaction: txn });
    
    if (needsCommit) {
      await txn!.commit();
    }
    logger.info('Stock reserved', { sellerProductId, quantity });
    return updated;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback();
    }
    logger.error('Error reserving stock', { sellerProductId, quantity, error });
    throw error;
  }
};

export const releaseReservedStock = async (sellerProductId: string, quantity: number, transaction?: Transaction) => {
  let txn = transaction;
  const needsCommit = !transaction; // Only commit if we created the transaction

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const inventory = await Inventory.findOne({ where: { sellerProductId }, transaction: txn });
    if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

    const updated = await inventory.update({
      availableStock: inventory.availableStock + quantity,
      reservedStock: inventory.reservedStock - quantity,
    }, { transaction: txn });
    
    if (needsCommit) {
      await txn!.commit();
    }
    logger.info('Reserved stock released', { sellerProductId, quantity });
    return updated;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback();
    }
    logger.error('Error releasing reserved stock', { sellerProductId, quantity, error });
    throw error;
  }
};
