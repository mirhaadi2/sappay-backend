import { Inventory } from './inventory.model';
import { SellerProduct } from '../products/seller-product.model';
import { AppError } from '../../utils/AppError';
import { sequelize } from '../../db/sequelize';

export const createInventory = async (data: any) => {
  return await Inventory.create(data);
};

export const findBySellerProductId = async (sellerProductId: string) => {
  return await Inventory.findOne({ where: { sellerProductId } });
};

export const updateInventory = async (id: string, data: any) => {
  const inventory = await Inventory.findByPk(id);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');
  return await inventory.update(data);
};

export const getSellerInventory = async (sellerId: string, filters: any = {}) => {
  const { limit = 20, offset = 0 } = filters;

  // Join Inventory with SellerProduct to get seller-specific inventory
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
    JOIN seller_products sp ON i.seller_product_id = sp.id
    JOIN products p ON sp.product_id = p.id
    WHERE sp.seller_id = :sellerId
    ORDER BY i.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const countQuery = `
    SELECT COUNT(*) as count
    FROM inventory i
    JOIN seller_products sp ON i.seller_product_id = sp.id
    WHERE sp.seller_id = :sellerId
  `;

  try {
    const rows = await sequelize.query(query, {
      replacements: { sellerId, limit: parseInt(limit), offset: parseInt(offset) },
      type: 'SELECT',
    });

    const countResult: any = await sequelize.query(countQuery, {
      replacements: { sellerId },
      type: 'SELECT',
    });

    return {
      rows,
      count: countResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error fetching seller inventory:', error);
    throw new AppError('InternalError', 500, 'Failed to fetch seller inventory');
  }
};

export const decrementStock = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

  if (inventory.availableStock < quantity) {
    throw new AppError('BadRequest', 400, 'Insufficient stock');
  }

  return await inventory.update({
    availableStock: inventory.availableStock - quantity,
    soldStock: inventory.soldStock + quantity,
  });
};

export const reserveStockRepo = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

  if (inventory.availableStock < quantity) {
    throw new AppError('BadRequest', 400, 'Insufficient stock');
  }

  return await inventory.update({
    availableStock: inventory.availableStock - quantity,
    reservedStock: inventory.reservedStock + quantity,
  });
};

export const releaseReservedStock = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

  return await inventory.update({
    availableStock: inventory.availableStock + quantity,
    reservedStock: inventory.reservedStock - quantity,
  });
};
