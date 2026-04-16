import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

export interface NotificationTemplateAttributes {
    id: string;
    eventType: string;
    channel: 'sms' | 'email' | 'whatsapp' | 'in_app';
    title: string;
    body: string;
    platformsAllowed: string[]; // ['Portal', 'Seller', 'Admin', 'Website']
    channelTemplateId?: string; // AWS template ID for SMS/WhatsApp
    placeholders: string[]; // ['name', 'orderId', 'amount']
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

type NotificationTemplateCreationAttributes = Optional<
    NotificationTemplateAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class NotificationTemplate
    extends Model<NotificationTemplateAttributes, NotificationTemplateCreationAttributes>
    implements NotificationTemplateAttributes {
    public id!: string;
    public eventType!: string;
    public channel!: 'sms' | 'email' | 'whatsapp' | 'in_app';
    public title!: string;
    public body!: string;
    public platformsAllowed!: string[];
    public channelTemplateId?: string;
    public placeholders!: string[];
    public isActive!: boolean;
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;
}

NotificationTemplate.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        eventType: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'event_type'
        },
        channel: {
            type: DataTypes.ENUM('sms', 'email', 'whatsapp', 'in_app'),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        platformsAllowed: {
            type: DataTypes.JSON,
            defaultValue: ['Portal', 'Seller', 'Admin', 'Website'],
            field: 'platforms_allowed'
        },
        channelTemplateId: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'channel_template_id'
        },
        placeholders: {
            type: DataTypes.JSON,
            defaultValue: [],
            field: 'placeholders'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'deleted_at'
        },
    },
    {
        sequelize,
        tableName: 'notification_templates',
        timestamps: true,
        paranoid: true, // enables soft deletes
        indexes: [
            {
                fields: ['event_type', 'channel'],
            },
        ]
    }
);

export interface NotificationHistoryAttributes {
    id: string;
    userId: string;
    eventType: string;
    channel: 'sms' | 'email' | 'whatsapp' | 'in_app';
    recipient: string; // phone number or email
    status: 'sent' | 'failed' | 'pending' | 'delivered' | 'bounced';
    messageId?: string;
    message: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
    sentAt: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

type NotificationHistoryCreationAttributes = Optional<
    NotificationHistoryAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class NotificationHistory
    extends Model<NotificationHistoryAttributes, NotificationHistoryCreationAttributes>
    implements NotificationHistoryAttributes {
    public id!: string;
    public userId!: string;
    public eventType!: string;
    public channel!: 'sms' | 'email' | 'whatsapp' | 'in_app';
    public recipient!: string;
    public status!: 'sent' | 'failed' | 'pending' | 'delivered' | 'bounced';
    public messageId?: string;
    public message!: string;
    public errorMessage?: string;
    public metadata?: Record<string, any>;
    public sentAt!: Date;
    public deliveredAt?: Date;
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;
}

NotificationHistory.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id',
        },
        eventType: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'event_type',
        },
        channel: {
            type: DataTypes.ENUM('sms', 'email', 'whatsapp', 'in_app'),
            allowNull: false,
        },
        recipient: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('sent', 'failed', 'pending', 'delivered', 'bounced'),
            defaultValue: 'pending',
            field: 'status',
        },
        messageId: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'message_id',
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'error_message',
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        sentAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'sent_at',
        },
        deliveredAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'delivered_at',
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'deleted_at',
        },
    },
    {
        sequelize,
        tableName: 'notification_history',
        timestamps: true,
        paranoid: true, // enables soft deletes
        indexes: [
            {
                fields: ['userId', 'createdAt'],
            },
            {
                fields: ['eventType', 'status'],
            },
        ],
    }
);

export interface UserNotificationPreferencesAttributes {
    id: string;
    userId: string;
    channelsEnabled: {
        sms: boolean;
        email: boolean;
        whatsapp: boolean;
        in_app: boolean;
    };
    dndEnabled: boolean;
    dndStartTime?: string; // HH:mm format
    dndEndTime?: string; // HH:mm format
    eventPreferences: Record<string, boolean>; // eventType -> enabled
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

type UserNotificationPreferencesCreationAttributes = Optional<
    UserNotificationPreferencesAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class UserNotificationPreferences
    extends Model<
        UserNotificationPreferencesAttributes,
        UserNotificationPreferencesCreationAttributes
    >
    implements UserNotificationPreferencesAttributes {
    public id!: string;
    public userId!: string;
    public channelsEnabled!: {
        sms: boolean;
        email: boolean;
        whatsapp: boolean;
        in_app: boolean;
    };
    public dndEnabled!: boolean;
    public dndStartTime?: string;
    public dndEndTime?: string;
    public eventPreferences!: Record<string, boolean>;
    public createdAt!: Date;
    public updatedAt!: Date;
    public deletedAt?: Date | null;
}

UserNotificationPreferences.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            field: 'user_id',
        },
        channelsEnabled: {
            type: DataTypes.JSON,
            defaultValue: {
                sms: true,
                email: true,
                whatsapp: false,
                in_app: true,
            },
            field: 'channels_enabled',
        },
        dndEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'dnd_enabled',
        },
        dndStartTime: {
            type: DataTypes.STRING(5), // HH:mm format
            allowNull: true,
            field: 'dnd_start_time',
        },
        dndEndTime: {
            type: DataTypes.STRING(5),
            allowNull: true,
            field: 'dnd_end_time'
        },
        eventPreferences: {
            type: DataTypes.JSON,
            defaultValue: {},
            field: 'event_preferences',
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'deleted_at',
        },
    },
    {
        sequelize,
        tableName: 'user_notification_preferences',
        timestamps: true,
        paranoid: true, // enables soft deletes
        indexes: [
            {
                fields: ['userId'],
            },
        ],
    }
);
