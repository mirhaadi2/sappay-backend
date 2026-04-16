'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Step 1: Make customer_id nullable
            await queryInterface.changeColumn(
                'orders',
                'customer_id',
                {
                    type: Sequelize.UUID,
                    allowNull: true, // Changed from false to true
                    references: {
                        model: 'customers',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
                { transaction }
            );

            // Step 2: Add guest_email column
            await queryInterface.addColumn(
                'orders',
                'guest_email',
                {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                },
                { transaction }
            );

            // Step 3: Add guest_phone column
            await queryInterface.addColumn(
                'orders',
                'guest_phone',
                {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                },
                { transaction }
            );

            // Step 4: Add index on guest_email for query performance
            await queryInterface.addIndex(
                'orders',
                ['guest_email'],
                {
                    name: 'idx_orders_guest_email',
                    transaction,
                }
            );

            // Step 5: Add index on guest_phone for query performance
            await queryInterface.addIndex(
                'orders',
                ['guest_phone'],
                {
                    name: 'idx_orders_guest_phone',
                    transaction,
                }
            );

            // Step 6: Add composite index on (customer_id, guest_email) for efficient lookups
            await queryInterface.addIndex(
                'orders',
                ['customer_id', 'guest_email'],
                {
                    name: 'idx_orders_customer_or_guest',
                    transaction,
                }
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
            // Revert: Remove indices
            await queryInterface.removeIndex(
                'orders',
                'idx_orders_customer_or_guest',
                { transaction }
            );

            await queryInterface.removeIndex(
                'orders',
                'idx_orders_guest_phone',
                { transaction }
            );

            await queryInterface.removeIndex(
                'orders',
                'idx_orders_guest_email',
                { transaction }
            );

            // Revert: Remove guest_phone column
            await queryInterface.removeColumn(
                'orders',
                'guest_phone',
                { transaction }
            );

            // Revert: Remove guest_email column
            await queryInterface.removeColumn(
                'orders',
                'guest_email',
                { transaction }
            );

            // Revert: Make customer_id non-nullable again
            await queryInterface.changeColumn(
                'orders',
                'customer_id',
                {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'customers',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
                { transaction }
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
};
