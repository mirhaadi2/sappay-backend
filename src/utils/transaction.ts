import { Transaction } from 'sequelize';
import { sequelize } from '../db/sequelize';

export async function withTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    const transaction = await sequelize.transaction();

    try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback().catch((rollbackError: any) => {
            console.error('Error rolling back transaction', { error: rollbackError });
        });
        throw error;
    }
}
