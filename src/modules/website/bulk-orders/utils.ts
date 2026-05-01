import { sequelize } from '../../../db/sequelize';
import { QueryTypes } from 'sequelize';

/**
 * Generate the next bulk order number
 * Format: BULK1000001, BULK1000002, etc.
 */
export const generateBulkOrderNumber = async (): Promise<string> => {
    const START_NUMBER = 1000000;
    const PREFIX = "BULK";

    // Get the last bulk order number
    const lastBulkOrder = await sequelize.query(
        'SELECT bulk_order_number FROM bulk_orders WHERE bulk_order_number IS NOT NULL ORDER BY bulk_order_number DESC LIMIT 1',
        { type: QueryTypes.SELECT }
    );

    let nextNumber: number;

    if (!lastBulkOrder || lastBulkOrder.length === 0) {
        nextNumber = START_NUMBER + 1;
    } else {
        const lastBulkOrderNumber = (lastBulkOrder[0] as any).bulk_order_number;
        const lastNumericPart = parseInt(lastBulkOrderNumber.replace(/\D/g, ""), 10);
        nextNumber = isNaN(lastNumericPart) ? START_NUMBER + 1 : lastNumericPart + 1;
    }

    return `${PREFIX}${nextNumber}`;
};