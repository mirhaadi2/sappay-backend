'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Create shipments table
            await queryInterface.createTable('shipments', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                },
                order_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'orders',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                upload_wbn: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                courier: {
                    type: Sequelize.ENUM('delhivery', 'other'),
                    allowNull: false,
                    defaultValue: 'delhivery',
                },
                status: {
                    type: Sequelize.ENUM('CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED', 'RTO'),
                    allowNull: false,
                    defaultValue: 'CREATED',
                },
                total_packages: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                total_cod_amount: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                cash_pickups_count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                package_count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                prepaid_count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                pickups_count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                replacement_count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                cash_pickups: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                cod_amount: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                cod_count: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                metadata: {
                    type: Sequelize.JSON,
                    allowNull: true,
                    defaultValue: {},
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
            }, { transaction });

            // Create shipment_packages table
            await queryInterface.createTable('shipment_packages', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                },
                shipment_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'shipments',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                waybill: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    unique: true,
                },
                refnum: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                client: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                payment: {
                    type: Sequelize.ENUM('COD', 'Prepaid'),
                    allowNull: false,
                },
                cod_amount: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                status: {
                    type: Sequelize.ENUM('Success', 'Failed', 'In Transit', 'Delivered', 'Cancelled', 'RTO'),
                    allowNull: false,
                    defaultValue: 'Success',
                },
                sort_code: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                },
                serviceable: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
                remarks: {
                    type: Sequelize.JSON,
                    allowNull: false,
                    defaultValue: [],
                },
                metadata: {
                    type: Sequelize.JSON,
                    allowNull: true,
                    defaultValue: {},
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
            }, { transaction });

            // Add indexes for better performance
            await queryInterface.addIndex('shipments', ['order_id'], { transaction });
            await queryInterface.addIndex('shipments', ['upload_wbn'], { transaction });
            await queryInterface.addIndex('shipment_packages', ['shipment_id'], { transaction });
            await queryInterface.addIndex('shipment_packages', ['waybill'], { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Drop tables in reverse order due to foreign key constraints
            await queryInterface.dropTable('shipment_packages', { transaction });
            await queryInterface.dropTable('shipments', { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};