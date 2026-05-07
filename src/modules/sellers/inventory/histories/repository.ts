import { InventoryHistory } from './model';
import { AppError } from '../../../../utils/AppError';
import { sequelize } from '../../../../db/sequelize';
import { QueryTypes, Transaction } from 'sequelize';
import { buildPaginatedResponse } from '../../../shared/pagination';

export const createHistoryRecord = async (data: any, transaction?: Transaction) => {
    return await InventoryHistory.create(data, { transaction });
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
    // 1. Professional Sanitization
    const limit = Math.max(1, parseInt(filters.limit) || 10);
    const offset = Math.max(0, parseInt(filters.offset) || 0);
    const type = filters.type;

    // 2. Base Query Logic
    const typeFilter = type ? 'AND ih.type = :type' : '';

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
    ${typeFilter}
    ORDER BY ih.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

    const countQuery = `
    SELECT COUNT(*)::int as count
    FROM inventory_history ih
    JOIN seller_products sp ON ih.seller_product_id = sp.id
    WHERE sp.seller_id = :sellerId
    ${typeFilter}
  `;

    try {
        const replacements: any = { sellerId, limit, offset };
        if (type) replacements.type = type;

        // 3. Parallel Execution (Professional Level)
        const [rows, countResult] = await Promise.all([
            sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT,
                benchmark: true,
                logging: (sql, timing) => console.log(`[InventoryHistory] ${timing}ms: ${sql}`),
            }),
            sequelize.query(countQuery, {
                replacements,
                type: QueryTypes.SELECT,
            }),
        ]);

        const total = (countResult[0] as any)?.count || 0;

        // 4. Return structured response for Frontend Pagination
        return buildPaginatedResponse(rows, total, { page: Math.floor(offset / limit) + 1, limit, offset });
    } catch (error) {
        console.error('Error fetching seller inventory history:', error);
        // Directly rethrow or map to your custom AppError
        throw error;
    }
};
