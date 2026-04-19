'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Create bulk_orders table
            await queryInterface.createTable(
                'bulk_orders',
                {
                    id: {
                        type: Sequelize.UUID,
                        defaultValue: Sequelize.UUIDV4,
                        primaryKey: true,
                    },
                    company_name: {
                        type: Sequelize.STRING(255),
                        allowNull: false,
                    },
                    contact_person: {
                        type: Sequelize.STRING(255),
                        allowNull: false,
                    },
                    phone: {
                        type: Sequelize.STRING(20),
                        allowNull: false,
                    },
                    email: {
                        type: Sequelize.STRING(255),
                        allowNull: false,
                    },
                    product: {
                        type: Sequelize.TEXT,
                        allowNull: false,
                    },
                    estimated_quantity: {
                        type: Sequelize.STRING(255),
                        allowNull: false,
                    },
                    additional_requirements: {
                        type: Sequelize.TEXT,
                        allowNull: true,
                    },
                    status: {
                        type: Sequelize.ENUM('pending', 'contacted', 'quoted', 'converted', 'closed'),
                        defaultValue: 'pending',
                        allowNull: false,
                    },
                    created_at: {
                        type: Sequelize.DATE,
                        allowNull: false,
                        defaultValue: Sequelize.NOW,
                    },
                    updated_at: {
                        type: Sequelize.DATE,
                        allowNull: false,
                        defaultValue: Sequelize.NOW,
                    },
                    deleted_at: {
                        type: Sequelize.DATE,
                        allowNull: true,
                    },
                },
                { transaction }
            );

            // Add index on email for quick lookups
            await queryInterface.addIndex('bulk_orders', ['email'], {
                transaction,
            });

            // Add index on company_name for searching
            await queryInterface.addIndex('bulk_orders', ['company_name'], {
                transaction,
            });

            // Add index on status for filtering
            await queryInterface.addIndex('bulk_orders', ['status'], {
                transaction,
            });

            // Add index on created_at for sorting
            await queryInterface.addIndex('bulk_orders', ['created_at'], {
                transaction,
            });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.dropTable('bulk_orders', { transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
};
