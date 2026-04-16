import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { config } from '../../../../../config';
import logger from '../../../../../utils/logger';

// Configuration
const snsClient = new SNSClient({
    region: config.aws.region || 'ap-south-1',
});
const entityId = config.aws.smsEntityId || '';
const maxRetries = 3;
const retryDelay = 1000; // ms

// Verify AWS credentials are configured
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    logger.warn('AWS credentials not found in environment. SMS notifications may not work. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
}

/**
 * Validate phone number format
 * Should start with '+' and contain only digits
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
        'ThrottlingException',
        'TooManyRequestsException',
        'RequestLimitExceeded',
        'Timeout',
        'TimeoutError',
        'NetworkingError',
    ];

    return (
        transientCodes.includes(error.Code) ||
        error.statusCode === 429 ||
        error.statusCode === 503 ||
        error.statusCode === 504
    );
};

/**
 * Delay utility for retry backoff
 */
const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Send SMS using AWS SNS with template
 * @param phoneNumber - Recipient phone number with country code (e.g., +919876543210)
 * @param message - SMS message content
 * @param templateId - AWS template ID for template-based SMS
 * @param retryCount - Current retry count
 * @returns Message ID on success, null on failure
 */
export const sendSMS = async (
    phoneNumber: string,
    message: string,
    templateId?: string,
    retryCount: number = 0
): Promise<string | null> => {
    try {
        // Validate phone number format
        if (!validatePhoneNumber(phoneNumber)) {
            logger.error('Invalid phone number format', { phoneNumber });
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        const publishParams = {
            PhoneNumber: phoneNumber,
            Message: message,
            MessageAttributes: {
                'AWS.MM.SMS.OriginationIdentity': {
                    DataType: 'String',
                    StringValue: process.env.AWS_SMS_ORIGINATION_ID || '',
                },
                ...(templateId && {
                    'AWS.MM.SMS.TemplateId': {
                        DataType: 'String',
                        StringValue: templateId,
                    },
                }),
                ...(entityId && {
                    'AWS.MM.SMS.EntityId': {
                        DataType: 'String',
                        StringValue: entityId,
                    },
                }),
            },
        };

        const command = new PublishCommand(publishParams);
        const response = await snsClient.send(command);

        logger.info('SMS sent successfully', {
            phoneNumber,
            messageId: response.MessageId,
        });

        return response.MessageId || null;
    } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';

        // Retry logic for transient errors
        if (retryCount < maxRetries && isTransientError(error)) {
            logger.warn('Transient error, retrying...', {
                phoneNumber,
                attempt: retryCount + 1,
                error: errorMessage,
            });
            await delay(retryDelay * (retryCount + 1));
            return sendSMS(phoneNumber, message, templateId, retryCount + 1);
        }

        logger.error('Failed to send SMS', {
            phoneNumber,
            error: errorMessage,
            errorCode: error.Code,
            statusCode: error.$metadata?.httpStatusCode,
        });

        throw new Error(`Failed to send SMS: ${errorMessage}`);
    }
};

/**
 * Send email notification using AWS SNS
 * Note: SNS can send emails if configured in the account
 */
export const sendEmail = async (
    email: string,
    subject: string,
    message: string,
    htmlContent?: string
): Promise<string | null> => {
    try {
        const publishParams = {
            TopicArn: process.env.AWS_SNS_EMAIL_TOPIC_ARN || '',
            Subject: subject,
            Message: message,
            ...(htmlContent && {
                MessageStructure: 'json',
                Message: JSON.stringify({
                    default: message,
                    html: htmlContent,
                }),
            }),
        };

        const command = new PublishCommand(publishParams);
        const response = await snsClient.send(command);

        logger.info('Email sent via SNS', {
            email,
            messageId: response.MessageId,
        });

        return response.MessageId || null;
    } catch (error: any) {
        logger.error('Failed to send email via SNS', {
            email,
            error: error.message,
        });
        throw error;
    }
};

/**
 * AWS SNS Service - Function-based API
 */
export const awsSNSService = {
    sendSMS,
    sendEmail,
};
