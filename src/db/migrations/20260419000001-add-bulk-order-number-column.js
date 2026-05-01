'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Add bulk_order_number column to bulk_orders table
            await queryInterface.addColumn(
                'bulk_orders',
                'bulk_order_number',
                {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    unique: true,
                    after: 'id', // Position after id column
                },
                { transaction }
            );

            // Generate bulk order numbers for existing records
            const START_NUMBER = 1000000;
            const PREFIX = "BULK";

            // Get all existing bulk orders ordered by creation date
            const existingOrders = await queryInterface.sequelize.query(
                'SELECT id FROM bulk_orders ORDER BY created_at ASC',
                { type: 'SELECT', transaction }
            );

            // Update each existing record with a bulk order number
            for (let i = 0; i < existingOrders.length; i++) {
                const orderId = existingOrders[i].id;
                const bulkOrderNumber = `${PREFIX}${START_NUMBER + i + 1}`;

                await queryInterface.sequelize.query(
                    'UPDATE bulk_orders SET bulk_order_number = $1 WHERE id = $2',
                    {
                        bind: [bulkOrderNumber, orderId],
                        type: 'UPDATE',
                        transaction
                    }
                );
            }

            // Make the column NOT NULL after populating existing data
            await queryInterface.changeColumn(
                'bulk_orders',
                'bulk_order_number',
                {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    unique: true,
                },
                { transaction }
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Remove the bulk_order_number column
            await queryInterface.removeColumn('bulk_orders', 'bulk_order_number', { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
};