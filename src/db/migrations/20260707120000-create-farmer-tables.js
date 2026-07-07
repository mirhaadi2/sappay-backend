module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('farmers', {
            id: { 
                type: Sequelize.UUID, 
                defaultValue: Sequelize.UUIDV4, 
                primaryKey: true, 
                unique: true 
            },
            full_name: { 
                type: Sequelize.STRING(255), 
                allowNull: false 
            },
            mobile_number: { 
                type: Sequelize.STRING(20), 
                allowNull: false, 
                unique: true 
            },
            email: { 
                type: Sequelize.STRING(255), 
                allowNull: true, 
                unique: true 
            },
            village: { 
                type: Sequelize.STRING(255), 
                allowNull: false 
            },
            district: { 
                type: Sequelize.STRING(255), 
                allowNull: false 
            },
            aadhaar_number: { 
                type: Sequelize.STRING(20), 
                allowNull: true, 
                unique: true 
            },
            password: { 
                type: Sequelize.STRING(255), 
                allowNull: true 
            },
            status: { 
                type: Sequelize.ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'), 
                allowNull: false, 
                defaultValue: 'PENDING' 
            },
            metadata: { 
                type: Sequelize.JSON, 
                allowNull: true, 
                defaultValue: {} 
            },
            created_at: { 
                type: Sequelize.DATE, 
                allowNull: false, 
                defaultValue: Sequelize.fn('NOW') 
            },
            updated_at: { 
                type: Sequelize.DATE, 
                allowNull: false, 
                defaultValue: Sequelize.fn('NOW') 
            },
            deleted_at: { 
                type: Sequelize.DATE, 
                allowNull: true }
            }
        );

        await queryInterface.addIndex('farmers', ['status']);
        await queryInterface.addIndex('farmers', ['district']);
        await queryInterface.addIndex('farmers', ['created_at']);

        await queryInterface.createTable('farmer_bank_details', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                unique: true
            },
            farmer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: 'farmers',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            account_holder_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            account_number: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            ifsc_code: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            bank_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW')
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        await queryInterface.addIndex('farmer_bank_details', ['farmer_id']);
        await queryInterface.addIndex('farmer_bank_details', ['bank_name']);

        await queryInterface.createTable('farmer_products', {
            id: { 
                type: Sequelize.UUID, 
                defaultValue: Sequelize.UUIDV4, 
                primaryKey: true, 
                unique: true 
            },
            farmer_id: { 
                type: Sequelize.UUID, 
                allowNull: false, 
                references: { 
                    model: 'farmers', 
                    key: 'id' 
                }, 
                onDelete: 'CASCADE' 
            },
            name: { 
                type: Sequelize.STRING(255), 
                allowNull: false 
            },
            category: { 
                type: Sequelize.STRING(100), 
                allowNull: false 
            },
            unit: { 
                type: Sequelize.STRING(50), 
                allowNull: false 
            },
            price_per_unit: { 
                type: Sequelize.DECIMAL(10, 2), 
                allowNull: true 
            },
            description: { 
                type: Sequelize.TEXT, 
                allowNull: true 
            },
            is_active: { 
                type: Sequelize.BOOLEAN, 
                allowNull: false, 
                defaultValue: true 
            },
            created_at: { 
                type: Sequelize.DATE, 
                allowNull: false, 
                defaultValue: Sequelize.fn('NOW') 
            },
            updated_at: { 
                type: Sequelize.DATE, 
                allowNull: false, 
                defaultValue: Sequelize.fn('NOW') 
            },
            deleted_at: { 
                type: Sequelize.DATE, 
                allowNull: true 
            }
        });

        await queryInterface.addIndex('farmer_products', ['farmer_id']);
        await queryInterface.addIndex('farmer_products', ['category']);
        await queryInterface.addIndex('farmer_products', ['is_active']);

        await queryInterface.createTable('farmer_inventory', {
            id: { 
                type: Sequelize.UUID, 
                defaultValue: Sequelize.UUIDV4, 
                primaryKey: true, 
                unique: true 
            },
            farmer_id: { 
                type: Sequelize.UUID, 
                allowNull: false, 
                references: { 
                    model: 'farmers', 
                    key: 'id' 
                }, 
                onDelete: 'CASCADE' 
            },
            product_id: { 
                type: Sequelize.UUID, 
                allowNull: false, 
                references: { 
                    model: 'farmer_products', 
                    key: 'id' 
                }, 
                onDelete: 'CASCADE' 
            },
            quantity: { 
                type: Sequelize.DECIMAL(10, 2), 
                allowNull: false, 
                defaultValue: 0 
            },
            unit: { 
                type: Sequelize.STRING(50), 
                allowNull: false 
            },
            batch_number: { 
                type: Sequelize.STRING(100), 
                allowNull: true 
            },
            expiry_date: { 
                type: Sequelize.DATE, 
                allowNull: true 
            },
            created_at: { 
                type: Sequelize.DATE, 
                allowNull: false, 
                defaultValue: Sequelize.fn('NOW') 
            },
            updated_at: { 
                type: Sequelize.DATE, 
                allowNull: false, 
                defaultValue: Sequelize.fn('NOW') 
            },
            deleted_at: { 
                type: Sequelize.DATE, 
                allowNull: true 
            }
        });

        await queryInterface.addIndex('farmer_inventory', ['farmer_id']);
        await queryInterface.addIndex('farmer_inventory', ['product_id']);
        await queryInterface.addIndex('farmer_inventory', ['expiry_date']);

        await queryInterface.createTable('farmer_sales', {
            id: { 
                type: Sequelize.UUID, 
                defaultValue: Sequelize.UUIDV4, 
                primaryKey: true, 
                unique: true 
            },
            farmer_id: { 
                type: Sequelize.UUID, 
                allowNull: false, 
                references: { model: 'farmers', key: 'id' }, 
                onDelete: 'CASCADE' 
            },
            product_id: { 
                type: Sequelize.UUID, 
                allowNull: false, 
                references: { model: 'farmer_products', key: 'id' }, 
                onDelete: 'CASCADE' 
            },
            quantity: { 
                type: Sequelize.DECIMAL(10, 2), 
                allowNull: false 
            },
            unit_price: { 
                type: Sequelize.DECIMAL(10, 2), 
                allowNull: false 
            },
            total_amount: { 
                type: Sequelize.DECIMAL(10, 2), 
                allowNull: false 
            },
            sold_at: { 
                type: Sequelize.DATE, 
                allowNull: false 
            },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            deleted_at: { type: Sequelize.DATE, allowNull: true }
        });

        await queryInterface.addIndex('farmer_sales', ['farmer_id']);
        await queryInterface.addIndex('farmer_sales', ['product_id']);
        await queryInterface.addIndex('farmer_sales', ['sold_at']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('farmer_sales');
        await queryInterface.dropTable('farmer_inventory');
        await queryInterface.dropTable('farmer_products');
        await queryInterface.dropTable('farmer_bank_details');
        await queryInterface.dropTable('farmers');
    }
};
