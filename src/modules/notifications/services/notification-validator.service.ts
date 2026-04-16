import { config } from '../../../config';
import logger from '../../../utils/logger';
// import { NotificationChannel } from '../types';


/**
 * Notification Validator Service
 * Validates that the active notification channel is properly configured
 * Prevents issues from missing or incomplete configuration
 */

export interface ValidationResult {
    isValid: boolean;
    activeChannel: NotificationChannel;
    errors: string[];
    warnings: string[];
    configStatus: {
        sms: { configured: boolean; errors: string[] };
        email: { configured: boolean; errors: string[] };
        whatsapp: { configured: boolean; errors: string[] };
        in_app: { configured: boolean; errors: string[] };
    };
}

/**
 * Validate SMS configuration
 */
const validateSmsConfig = (): { configured: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.aws.accessKeyId) {
        errors.push('AWS_ACCESS_KEY_ID is missing');
    }
    if (!config.aws.secretAccessKey) {
        errors.push('AWS_SECRET_ACCESS_KEY is missing');
    }
    if (!config.aws.region) {
        errors.push('AWS_REGION is missing');
    }
    if (!config.aws.smsOriginationId) {
        errors.push('AWS_SMS_ORIGINATION_ID is missing');
    }
    if (!config.aws.smsEntityId) {
        errors.push('AWS_SMS_ENTITY_ID is missing');
    }

    return {
        configured: errors.length === 0,
        errors,
    };
};

/**
 * Validate Email (SMTP) configuration
 */
const validateEmailConfig = (): { configured: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.email.smtpHost) {
        errors.push('SMTP_HOST is missing or invalid (should be hostname, not email)');
    } else if (config.email.smtpHost.includes('@')) {
        errors.push('SMTP_HOST appears to be an email address, should be a hostname (e.g., smtp.gmail.com)');
    }

    if (!config.email.smtpPort || config.email.smtpPort < 1 || config.email.smtpPort > 65535) {
        errors.push('SMTP_PORT is invalid or missing (should be 25, 465, 587, or 2587)');
    }

    if (!config.email.smtpUser) {
        errors.push('SMTP_USER is missing');
    }

    if (!config.email.smtpPassword) {
        errors.push('SMTP_PASSWORD is missing');
    }

    if (!config.email.fromEmail) {
        errors.push('SMTP_FROM_EMAIL is missing (fallback: SMTP_USER)');
    }

    return {
        configured: errors.length === 0,
        errors,
    };
};

/**
 * Validate WhatsApp configuration
 */
const validateWhatsappConfig = (): { configured: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.whatsapp.token) {
        errors.push('WHATSAPP_TOKEN is missing');
    }

    if (!config.whatsapp.phoneNumberId) {
        errors.push('WHATSAPP_PHONE_NUMBER_ID is missing');
    }

    if (!config.whatsapp.baseUrl) {
        errors.push('WHATSAPP_BASE_URL is missing');
    }

    return {
        configured: errors.length === 0,
        errors,
    };
};

/**
 * In-App notifications don't require external config
 */
const validateInAppConfig = (): { configured: boolean; errors: string[] } => {
    return {
        configured: true,
        errors: [],
    };
};

/**
 * Get the active notification channel
 */
const getActiveChannel = (): NotificationChannel => {
    const channel = config.notificationChannel?.toLowerCase();

    switch (channel) {
        case 'email':
            return NotificationChannel.EMAIL;
        case 'whatsapp':
            return NotificationChannel.WHATSAPP;
        case 'in_app':
            return NotificationChannel.IN_APP;
        case 'sms':
        default:
            return NotificationChannel.SMS;
    }
};

/**
 * Comprehensive validation of all notification channels
 */
export const validateAllChannels = (): ValidationResult => {
    const activeChannel = getActiveChannel();
    const errors: string[] = [];
    const warnings: string[] = [];

    const smsConfig = validateSmsConfig();
    const emailConfig = validateEmailConfig();
    const whatsappConfig = validateWhatsappConfig();
    const inAppConfig = validateInAppConfig();

    // Check if active channel is configured
    switch (activeChannel) {
        case NotificationChannel.SMS: {
            if (!smsConfig.configured) {
                errors.push(`Active channel SMS is not properly configured: ${smsConfig.errors.join(', ')}`);
            } else {
                logger.info('✓ SMS configuration is valid');
            }
            break;
        }
        case NotificationChannel.EMAIL: {
            if (!emailConfig.configured) {
                errors.push(`Active channel EMAIL is not properly configured: ${emailConfig.errors.join(', ')}`);
            } else {
                logger.info('✓ Email (SMTP) configuration is valid');
            }
            break;
        }
        case NotificationChannel.WHATSAPP: {
            if (!whatsappConfig.configured) {
                errors.push(`Active channel WHATSAPP is not properly configured: ${whatsappConfig.errors.join(', ')}`);
            } else {
                logger.info('✓ WhatsApp configuration is valid');
            }
            break;
        }
        case NotificationChannel.IN_APP: {
            logger.info('✓ In-App notifications enabled (no external config required)');
            break;
        }
    }

    // Warn about other inactive channels
    if (activeChannel !== NotificationChannel.SMS) {
        if (smsConfig.configured) {
            warnings.push('SMS is configured but not active (NOTIFICATION_CHANNEL=sms to activate)');
        }
    }
    if (activeChannel !== NotificationChannel.EMAIL) {
        if (emailConfig.configured) {
            warnings.push('Email is configured but not active (NOTIFICATION_CHANNEL=email to activate)');
        }
    }
    if (activeChannel !== NotificationChannel.WHATSAPP) {
        if (whatsappConfig.configured) {
            warnings.push('WhatsApp is configured but not active (NOTIFICATION_CHANNEL=whatsapp to activate)');
        }
    }

    const isValid = errors.length === 0;

    if (!isValid) {
        logger.error('❌ Notification system validation failed', { errors });
    }

    return {
        isValid,
        activeChannel,
        errors,
        warnings,
        configStatus: {
            sms: smsConfig,
            email: emailConfig,
            whatsapp: whatsappConfig,
            in_app: inAppConfig,
        },
    };
};

/**
 * Quick check - is a specific channel configured?
 */
export const isChannelConfigured = (channel: NotificationChannel): boolean => {
    switch (channel) {
        case NotificationChannel.SMS:
            return validateSmsConfig().configured;
        case NotificationChannel.EMAIL:
            return validateEmailConfig().configured;
        case NotificationChannel.WHATSAPP:
            return validateWhatsappConfig().configured;
        case NotificationChannel.IN_APP:
            return true; // Always available
        default:
            return false;
    }
};

/**
 * Validate and throw error if active channel is not configured
 */
export const validateActiveChannel = (): void => {
    const validation = validateAllChannels();

    if (!validation.isValid) {
        const errorMessage = `Notification system not properly configured. Errors: ${validation.errors.join('; ')}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
};

// Export NotificationChannel enum for convenience
export enum NotificationChannel {
    SMS = 'sms',
    EMAIL = 'email',
    WHATSAPP = 'whatsapp',
    IN_APP = 'in_app',
}
