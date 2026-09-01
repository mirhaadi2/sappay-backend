import { Inventory } from './model';
import { SellerProduct } from '../../admin/products/seller-product/model';
import { AppError } from '../../../utils/AppError';
import { sequelize } from '../../../db/sequelize';
import { QueryTypes, Transaction } from 'sequelize';
import logger from '../../../utils/logger';
import { InventoryHistory } from './histories';
import { ProductVariant } from '../../admin/products/product-variant/model';

export const findInventoryByProductId = async (productId: string, transaction?: Transaction) => {
    return await Inventory.findOne({
        where: { productId },
        ...(transaction ? { transaction } : {}),
    });
};

export const getProductVariantWeightInfo = async (
    productVariantId: string,
    transaction?: Transaction,
) => {
    return ProductVariant.findByPk(productVariantId, {
        attributes: ['weight', 'weightUnit'],
        raw: true,
        transaction,
    });
};

export const createInventory = async (data: any, transaction?: any) => {
    const inventory = await Inventory.create(data, { transaction });
    logger.info('Inventory created', { inventoryId: inventory?.dataValues?.id });
    return inventory;
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
            }),
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

export const decrementStock = async (
    productId: string,
    productVariantId: string,
    quantity: number,
    transaction?: Transaction,
) => {
    let txn = transaction;
    const needsCommit = !transaction; // Only commit if we created the transaction

    try {
        if (needsCommit) {
            txn = await sequelize.transaction();
        }

        const inventory = await Inventory.findOne({
            where: { productId },
            transaction: txn,
        });
        if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

        const productVariant = await ProductVariant.findByPk(productVariantId, {
            attributes: ['weight', 'weightUnit'],
            raw: true,
            transaction: txn,
        });
        if (!productVariant) throw new AppError('NotFound', 404, 'Product variant not found');

        const unitMultiplier = productVariant.weightUnit?.toUpperCase() === 'G' ? 0.001 : 1;
        const weightPerUnitKg = parseFloat(String(productVariant.weight || '0')) * unitMultiplier;
        const totalWeightToDecrement = weightPerUnitKg * quantity;

        // Parse current values to numbers
        const currentTotal = parseFloat(String(inventory.totalStock));
        const currentAvailable = parseFloat(String(inventory.availableStock));
        const currentReserved = parseFloat(String(inventory.reservedStock));
        const currentSold = parseFloat(String(inventory.soldStock));

        const reservedQty = Math.min(currentReserved, totalWeightToDecrement);
        const directQty = totalWeightToDecrement - reservedQty;

        if (currentAvailable < directQty) {
            throw new AppError('BadRequest', 400, 'Insufficient stock');
        }

        const updated = await inventory.update(
            {
                totalStock: Math.max(0, currentTotal - totalWeightToDecrement),
                availableStock: currentAvailable - directQty,
                reservedStock: Math.max(0, currentReserved - reservedQty),
                soldStock: currentSold + totalWeightToDecrement,
            },
            { transaction: txn },
        );

        if (needsCommit) {
            await txn!.commit();
        }
        logger.info('Stock decremented', {
            productId,
            productVariantId,
            quantity,
            totalWeightToDecrement,
            reservedQty,
            directQty,
            totalStock: updated.totalStock,
            availableStock: updated.availableStock,
            reservedStock: updated.reservedStock,
            soldStock: updated.soldStock,
        });
        return updated;
    } catch (error) {
        if (needsCommit && txn) {
            await txn.rollback();
        }
        logger.error('Error decrementing stock', {
            productId,
            productVariantId,
            quantity,
            error,
        });
        throw error;
    }
};

export const decrementStockByProductId = async (
    productId: string,
    productVariantId: string,
    quantity: number,
    transaction?: Transaction,
) => {
    let txn = transaction;
    const needsCommit = !transaction; // Only commit if we created the transaction

    try {
        if (needsCommit) {
            txn = await sequelize.transaction();
        }

        const inventory = await Inventory.findOne({
            where: { productId },
            transaction: txn,
        });
        if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

        const productVariant = await ProductVariant.findByPk(productVariantId, {
            attributes: ['weight', 'weightUnit'],
            raw: true,
            transaction: txn,
        });
        if (!productVariant) throw new AppError('NotFound', 404, 'Product variant not found');

        const unitMultiplier = productVariant.weightUnit?.toUpperCase() === 'G' ? 0.001 : 1;
        const weightPerUnitKg = parseFloat(String(productVariant.weight || '0')) * unitMultiplier;
        const totalWeightToDecrement = weightPerUnitKg * quantity;

        // Parse current values to numbers
        const currentTotal = parseFloat(String(inventory?.dataValues?.totalStock));
        const currentAvailable = parseFloat(String(inventory?.dataValues?.availableStock));
        const currentReserved = parseFloat(String(inventory?.dataValues?.reservedStock));
        const currentSold = parseFloat(String(inventory?.dataValues?.soldStock));

        const reservedQty = Math.min(currentReserved, totalWeightToDecrement);
        const directQty = totalWeightToDecrement - reservedQty;

        if (currentAvailable < directQty) {
            throw new AppError('BadRequest', 400, 'Insufficient stock');
        }

        const updated = await inventory.update(
            {
                totalStock: Math.max(0, currentTotal - totalWeightToDecrement),
                availableStock: currentAvailable - directQty,
                reservedStock: Math.max(0, currentReserved - reservedQty),
                soldStock: currentSold + totalWeightToDecrement,
            },
            { transaction: txn },
        );

        await InventoryHistory.create(
            {
                inventoryId: inventory.dataValues.id,
                productId: inventory?.dataValues?.productId,
                type: 'RESERVED_RELEASED',
                quantity: -totalWeightToDecrement,
                previousStock: currentTotal,
                newStock: Math.max(0, currentTotal - totalWeightToDecrement),
                reference: `Decrement by productId. Reserved: ${reservedQty}, Direct: ${directQty}`,
                notes: `Stock decremented by productId. Reserved: ${reservedQty}, Direct: ${directQty}`,
            },
            { transaction },
        );

        if (needsCommit) {
            await txn!.commit();
        }
        logger.info('Stock decremented', {
            productId,
            productVariantId,
            quantity,
            totalWeightToDecrement,
            reservedQty,
            directQty,
            totalStock: updated?.dataValues?.totalStock,
            availableStock: updated?.dataValues?.availableStock,
            reservedStock: updated?.dataValues?.reservedStock,
            soldStock: updated?.dataValues?.soldStock,
        });
        return updated;
    } catch (error) {
        if (needsCommit && txn) {
            await txn.rollback();
        }
        logger.error('Error decrementing stock', {
            productId,
            productVariantId,
            quantity,
            error,
        });
        throw error;
    }
};

export const reserveStockByProductIdRepo = async (
    productId: string,
    productVariantId: string,
    quantity: number,
    transaction?: Transaction,
) => {
    const inventory = await Inventory.findOne({
        where: { productId },
        transaction,
    });

    if (!inventory) throw new AppError('NotFound', 404, 'Inventory record not found');

    const productVariant = await ProductVariant.findByPk(productVariantId, {
        attributes: ['weight', 'weightUnit'],
        raw: true,
        transaction,
    });

    if (!productVariant) throw new AppError('NotFound', 404, 'Product variant not found');

    // 1. Convert DB values (Strings) to Numbers for math
    // We use parseFloat because DECIMAL comes back as a string from the DB
    const currentAvailable = parseFloat(
        (inventory?.availableStock || inventory?.dataValues?.availableStock) as any,
    );
    const currentReserved = parseFloat(
        (inventory?.reservedStock || inventory?.dataValues?.reservedStock) as any,
    );

    // 2. Calculate Weight Logic
    const unitMultiplier = productVariant.weightUnit?.toUpperCase() === 'G' ? 0.001 : 1;
    const weightPerUnitKg = parseFloat(String(productVariant.weight || '0')) * unitMultiplier;

    const totalWeightToReserve = weightPerUnitKg * quantity;

    // 3. Validation
    if (currentAvailable < totalWeightToReserve) {
        throw new AppError(
            'BadRequest',
            400,
            `Insufficient stock. Need ${totalWeightToReserve}kg but only ${currentAvailable}kg available.`,
        );
    }

    // 4. Update using calculated numbers
    // Sequelize will handle converting these numbers back to strings for the SQL query
    await inventory.update(
        {
            availableStock: currentAvailable - totalWeightToReserve,
            reservedStock: currentReserved + totalWeightToReserve,
        },
        { transaction },
    );

    // 5. History Logging
    await InventoryHistory.create(
        {
            inventoryId: inventory?.id || inventory?.dataValues?.id,
            productId: inventory?.productId || inventory?.dataValues?.productId,
            type: 'STOCK_RESERVED',
            quantity: -totalWeightToReserve,
            previousStock: currentAvailable,
            newStock: currentAvailable - totalWeightToReserve,
            notes: `Reserved ${quantity} units of ${productVariant.weight}${productVariant.weightUnit} (Total: ${totalWeightToReserve}kg)`,
        },
        { transaction },
    );
};

export const reserveStockRepo = async (
    sellerProductId: string,
    productVariantId: string,
    quantity: number,
    transaction?: Transaction,
) => {
    let txn = transaction;
    const needsCommit = !transaction; // Only commit if we created the transaction

    try {
        if (needsCommit) {
            txn = await sequelize.transaction();
        }

        const inventory = await Inventory.findOne({
            where: { sellerProductId },
            transaction: txn,
        });
        if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

        const productVariant = await ProductVariant.findByPk(productVariantId, {
            attributes: ['weight', 'weightUnit'],
            raw: true,
            transaction: txn,
        });
        if (!productVariant) throw new AppError('NotFound', 404, 'Product variant not found');

        const unitMultiplier = productVariant.weightUnit?.toUpperCase() === 'G' ? 0.001 : 1;
        const weightPerUnitKg = parseFloat(String(productVariant.weight || '0')) * unitMultiplier;
        const totalWeightToReserve = weightPerUnitKg * quantity;

        // Parse current values to numbers
        const currentAvailable = parseFloat(String(inventory.availableStock));
        const currentReserved = parseFloat(String(inventory.reservedStock));

        if (currentAvailable < totalWeightToReserve) {
            throw new AppError('BadRequest', 400, 'Insufficient stock');
        }

        const updated = await inventory.update(
            {
                availableStock: currentAvailable - totalWeightToReserve,
                reservedStock: currentReserved + totalWeightToReserve,
            },
            { transaction: txn },
        );

        if (needsCommit) {
            await txn!.commit();
        }
        logger.info('Stock reserved', {
            sellerProductId,
            productVariantId,
            quantity,
            totalWeightToReserve,
        });
        return updated;
    } catch (error) {
        if (needsCommit && txn) {
            await txn.rollback();
        }
        logger.error('Error reserving stock', {
            sellerProductId,
            productVariantId,
            quantity,
            error,
        });
        throw error;
    }
};

export const releaseReservedStock = async (
    productId: string,
    productVariantId: string,
    quantity: number,
    transaction?: Transaction,
) => {
    let txn = transaction;
    const needsCommit = !transaction; // Only commit if we created the transaction

    try {
        if (needsCommit) {
            txn = await sequelize.transaction();
        }

        const inventory = await Inventory.findOne({
            where: { productId },
            transaction: txn,
        });
        if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

        const productVariant = await ProductVariant.findByPk(productVariantId, {
            attributes: ['weight', 'weightUnit'],
            raw: true,
            transaction: txn,
        });
        if (!productVariant) throw new AppError('NotFound', 404, 'Product variant not found');

        const unitMultiplier = productVariant.weightUnit?.toUpperCase() === 'G' ? 0.001 : 1;
        const weightPerUnitKg = parseFloat(String(productVariant.weight || '0')) * unitMultiplier;
        const totalWeightToRelease = weightPerUnitKg * quantity;

        // Parse current values to numbers
        const currentAvailable = parseFloat(String(inventory.availableStock));
        const currentReserved = parseFloat(String(inventory.reservedStock));

        const updated = await inventory.update(
            {
                availableStock: currentAvailable + totalWeightToRelease,
                reservedStock: currentReserved - totalWeightToRelease,
            },
            { transaction: txn },
        );

        if (needsCommit) {
            await txn!.commit();
        }
        logger.info('Reserved stock released', {
            productId,
            productVariantId,
            quantity,
            totalWeightToRelease,
        });
        return updated;
    } catch (error) {
        if (needsCommit && txn) {
            await txn.rollback();
        }
        logger.error('Error releasing reserved stock', {
            productId,
            productVariantId,
            quantity,
            error,
        });
        throw error;
    }
};
