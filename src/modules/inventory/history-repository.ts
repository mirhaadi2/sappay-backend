import InventoryHistory from './inventory-history.model';
import { AppError } from '../../utils/AppError';
import { sequelize } from '../../db/sequelize';
import { QueryTypes } from 'sequelize';

export const createHistoryRecord = async (data: any) => {
    return await InventoryHistory.create(data);
};

export const getInventoryHistory = async (
    sellerProductId: string,
    filters: any = {}
) => {
    const { limit = 50, offset = 0, type } = filters;

    const where: any = { sellerProductId };
    if (type) where.type = type;

    try {
        const records = await InventoryHistory.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            raw: true,
        });

        const count = await InventoryHistory.count({ where });

        return {
            rows: records,
            count,
            page: Math.floor(offset / limit) + 1,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    } catch (error) {
        console.error('Error fetching inventory history:', error);
        throw new AppError('InternalError', 500, 'Failed to fetch inventory history');
    }
};

export const getSellerInventoryHistory = async (
    sellerId: string,
    filters: any = {}
) => {
    const { limit = 50, offset = 0, type } = filters;

    const query = `
    SELECT 
      ih.id,
      ih.inventory_id as "inventoryId",
      ih.seller_product_id as "sellerProductId",
      ih.type,
      ih.quantity,
      ih.previous_stock as "previousStock",
      ih.new_stock as "newStock",
      ih.reference,
      ih.notes,
      ih.created_at as "createdAt",
      sp.id as "productId",
      p.name as "productName",
      sp.seller_sku as "sellerSku",
      sp.seller_price as "sellerPrice"
    FROM inventory_history ih
    JOIN seller_products sp ON ih.seller_product_id = sp.id
    JOIN products p ON sp.product_id = p.id
    WHERE sp.seller_id = :sellerId
    ${type ? 'AND ih.type = :type' : ''}
    ORDER BY ih.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

    const countQuery = `
    SELECT COUNT(*) as count
    FROM inventory_history ih
    JOIN seller_products sp ON ih.seller_product_id = sp.id
    WHERE sp.seller_id = :sellerId
    ${type ? 'AND ih.type = :type' : ''}
  `;

    try {
        const replacements: any = { sellerId, limit: parseInt(limit), offset: parseInt(offset) };
        if (type) replacements.type = type;

        const rows = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT,
        });

        const countResult: any = await sequelize.query(countQuery, {
            replacements,
            type: QueryTypes.SELECT,
        });

        return {
            inventoryHistories: rows,
            count: countResult[0]?.count || 0,
            page: Math.floor(offset / limit) + 1,
            limit,
            totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
        };
    } catch (error) {
        console.error('Error fetching seller inventory history:', error);
        throw new AppError('InternalError', 500, 'Failed to fetch inventory history');
    }
};
