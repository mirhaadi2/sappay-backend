import { config } from '../../../../../config';
import logger from '../../../../../utils/logger';

/**
 * WhatsApp Business API Service for sending messages via WhatsApp
 * Uses Meta/Facebook's WhatsApp Cloud API
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

// Configuration
const phoneNumberId = config.whatsapp.phoneNumberId || '';
const wabaToken = config.whatsapp.token || '';
const apiVersion = 'v18.0';
const maxRetries = 3;
const retryDelay = 1000; // ms
const baseUrl = config.whatsapp.baseUrl || 'https://graph.facebook.com/v18.0';

// Validate WhatsApp configuration
if (!wabaToken || !phoneNumberId) {
    logger.warn('WhatsApp credentials not configured. WhatsApp notifications will not work. Set WHATSAPP_BASE_URL, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_TOKEN in .env file');
}

/**
 * Make HTTP request to WhatsApp API using fetch
 */
const makeRequest = async (
    method: string,
    endpoint: string,
    data?: any
): Promise<any> => {
    const url = `${baseUrl}/${apiVersion}/${phoneNumberId}${endpoint}`;
    
    const options: RequestInit = {
        method,
        headers: {
            'Authorization': `Bearer ${wabaToken}`,
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                data: responseData,
            };
        }

        return responseData;
    } catch (error: any) {
        logger.error('WhatsApp API Request Error', {
            method,
            endpoint,
            status: error.status,
            error: error.message || JSON.stringify(error),
        });
        throw error;
    }
};

/**
 * Validate phone number format
 * WhatsApp requires E.164 format: + followed by 1-15 digits
 */
const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^\+\d{1,15}$/;
    return phoneRegex.test(phoneNumber);
};

/**
 * Check if error is transient (should retry)
 */
const isTransientError = (error: any): boolean => {
    const transientCodes = [
        'TooManyRequestsException',
        'ThrottlingException',
        'RequestLimitExceeded',
        100, // Temporary error
        131026, // Too many API requests too rapidly
        131009, // Media download error
    ];

    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.error?.code;

    return (
        transientCodes.includes(errorCode) ||
        transientCodes.includes(statusCode) ||
        statusCode === 429 ||
        statusCode === 503 ||
        statusCode === 504 ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT'
    );
};

/**
 * Delay utility for retry backoff
 */
const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Send a text message via WhatsApp
 * @param phoneNumber - Recipient phone number with country code (e.g., +919876543210)
 * @param message - Message content
 * @param templateParams - Optional template parameters for template-based messages
 * @param retryCount - Current retry count (internal use)
 * @returns Message ID on success, null on failure
 */
export const sendMessage = async (
    phoneNumber: string,
    message: string,
    templateParams?: string[],
    retryCount: number = 0
): Promise<string | null> => {
    try {
        // Validate phone number
        if (!validatePhoneNumber(phoneNumber)) {
            logger.error('Invalid phone number format for WhatsApp', { phoneNumber });
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        // Ensure message is not empty
        if (!message || message.trim().length === 0) {
            throw new Error('Message content cannot be empty');
        }

        // Ensure message doesn't exceed WhatsApp limit (4096 characters)
        if (message.length > 4096) {
            logger.warn('WhatsApp message truncated (exceeds 4096 character limit)', {
                phoneNumber,
                originalLength: message.length,
            });
            message = message.substring(0, 4093) + '...';
        }

        const payload = {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: {
                preview_url: true,
                body: message,
            },
        };

        const response = await makeRequest('POST', '/messages', payload);
        const messageId = response?.messages?.[0]?.id;

        logger.info('WhatsApp message sent successfully', {
            phoneNumber,
            messageId,
        });

        return messageId || null;
    } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        const errorCode = error.data?.error?.code;
        const errorDetails = error.data?.error?.message;

        // Retry logic for transient errors
        if (retryCount < maxRetries && isTransientError(error)) {
            logger.warn('WhatsApp transient error, retrying...', {
                phoneNumber,
                attempt: retryCount + 1,
                error: errorMessage,
                errorCode,
            });
            await delay(retryDelay * (retryCount + 1));
            return sendMessage(phoneNumber, message, templateParams, retryCount + 1);
        }

        logger.error('Failed to send WhatsApp message', {
            phoneNumber,
            error: errorMessage,
            errorCode,
            errorDetails,
            statusCode: error.status,
        });

        throw new Error(`Failed to send WhatsApp message: ${errorDetails || errorMessage}`);
    }
};

/**
 * Send a template-based WhatsApp message
 * Templates are pre-approved by Meta and allow for dynamic parameters
 * @param phoneNumber - Recipient phone number
 * @param templateName - Name of the WhatsApp template
 * @param languageCode - Language code (e.g., 'en', 'en_US')
 * @param parameters - Array of parameter values to fill template placeholders
 * @returns Message ID on success, null on failure
 */
export const sendTemplateMessage = async (
    phoneNumber: string,
    templateName: string,
    languageCode: string = 'en',
    parameters?: string[],
    retryCount: number = 0
): Promise<string | null> => {
    try {
        // Validate phone number
        if (!validatePhoneNumber(phoneNumber)) {
            logger.error('Invalid phone number format for WhatsApp', { phoneNumber });
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        // Validate template name
        if (!templateName || templateName.trim().length === 0) {
            throw new Error('Template name cannot be empty');
        }

        const payload = {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                },
                ...(parameters && parameters.length > 0 && {
                    components: [
                        {
                            type: 'body',
                            parameters: parameters.map((param) => ({
                                type: 'text',
                                text: param,
                            })),
                        },
                    ],
                }),
            },
        };

        const response = await makeRequest('POST', '/messages', payload);
        const messageId = response?.messages?.[0]?.id;

        logger.info('WhatsApp template message sent successfully', {
            phoneNumber,
            templateName,
            messageId,
        });

        return messageId || null;
    } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        const errorCode = error.data?.error?.code;
        const errorDetails = error.data?.error?.message;

        // Retry logic for transient errors
        if (retryCount < maxRetries && isTransientError(error)) {
            logger.warn('WhatsApp transient error, retrying...', {
                phoneNumber,
                templateName,
                attempt: retryCount + 1,
                error: errorMessage,
            });
            await delay(retryDelay * (retryCount + 1));
            return sendTemplateMessage(phoneNumber, templateName, languageCode, parameters, retryCount + 1);
        }

        logger.error('Failed to send WhatsApp template message', {
            phoneNumber,
            templateName,
            error: errorMessage,
            errorCode,
            errorDetails,
            statusCode: error.status,
        });

        throw new Error(`Failed to send WhatsApp template message: ${errorDetails || errorMessage}`);
    }
};

/**
 * Health check - verify WhatsApp API connectivity
 */
export const healthCheck = async (): Promise<boolean> => {
    try {
        const response = await makeRequest('GET', '');
        return true;
    } catch (error: any) {
        logger.error('WhatsApp health check failed', {
            error: error.message,
            status: error.status,
        });
        return false;
    }
};

/**
 * Get service status
 */
export const getStatus = (): {
    isConfigured: boolean;
    baseUrl: string;
    phoneNumberId: string;
} => {
    return {
        isConfigured: !!(wabaToken && phoneNumberId),
        baseUrl: config.whatsapp.baseUrl || 'Not configured',
        phoneNumberId: phoneNumberId ? `***${phoneNumberId.slice(-4)}` : 'Not configured',
    };
};

/**
 * WhatsApp Service - Function-based API
 */
export const whatsappService = {
    sendMessage,
    sendTemplateMessage,
    healthCheck,
    getStatus,
};
