'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Create notification_templates table
         */
        await queryInterface.createTable('notification_templates', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            event_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            channel: {
                type: Sequelize.ENUM('sms', 'email', 'whatsapp', 'in_app'),
                allowNull: false,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            body: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            platforms_allowed: {
                type: Sequelize.JSON,
                defaultValue: ['Portal', 'Seller', 'Admin', 'Website'],
            },
            channel_template_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            placeholders: {
                type: Sequelize.JSON,
                defaultValue: [],
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
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
        });

        // Index for event_type
        await queryInterface.addIndex('notification_templates', ['event_type']);

        /**
         * Create notification_history table
         */
        await queryInterface.createTable('notification_history', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            event_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            channel: {
                type: Sequelize.ENUM('sms', 'email', 'whatsapp', 'in_app'),
                allowNull: false,
            },
            recipient: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('sent', 'failed', 'pending', 'delivered', 'bounced'),
                defaultValue: 'pending',
            },
            message_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            sent_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            delivered_at: {
                type: Sequelize.DATE,
                allowNull: true,
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
        });

        // Optimized indexes for history
        await queryInterface.addIndex('notification_history', ['user_id', 'created_at']);
        await queryInterface.addIndex('notification_history', ['event_type', 'status']);

        /**
         * Create user_notification_preferences table
         */
        await queryInterface.createTable('user_notification_preferences', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
            },
            channels_enabled: {
                type: Sequelize.JSON,
                defaultValue: {
                    sms: true,
                    email: true,
                    whatsapp: false,
                    in_app: true,
                },
            },
            dnd_enabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            dnd_start_time: {
                type: Sequelize.STRING(5),
                allowNull: true,
            },
            dnd_end_time: {
                type: Sequelize.STRING(5),
                allowNull: true,
            },
            event_preferences: {
                type: Sequelize.JSON,
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
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex('user_notification_preferences', ['user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('user_notification_preferences');
        await queryInterface.dropTable('notification_history');
        await queryInterface.dropTable('notification_templates');

        // Drop ENUM types (needed for PostgreSQL to clean up fully)
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notification_templates_channel";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notification_history_channel";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notification_history_status";');
    },
};