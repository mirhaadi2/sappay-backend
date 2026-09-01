import axios from 'axios';
import crypto from 'crypto';
import { AppError } from '../../utils/AppError';
import { config } from '../../config';

export const createRazorpayOrder = async (
    paymentMethod: string,
    amountInPaise: number,
    receipt: string,
) => {
    if (!config.payment.provider || config.payment.provider === 'none') {
        throw new AppError(
            'ServiceUnavailable',
            503,
            'Payment gateway is not configured. Set PAYMENT_PROVIDER, PAYMENT_API_KEY, and PAYMENT_API_SECRET in .env',
        );
    }

    if (!config.payment.apiKey || !config.payment.apiSecret) {
        throw new AppError(
            'ServiceUnavailable',
            503,
            'Payment provider credentials are missing. Set PAYMENT_API_KEY and PAYMENT_API_SECRET in .env',
        );
    }

    const auth = Buffer.from(`${config.payment.apiKey}:${config.payment.apiSecret}`).toString(
        'base64',
    );

    const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            payment_capture: 1,
            notes: { paymentMethod },
        },
        {
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        },
    );

    return {
        provider: 'razorpay',
        gatewayOrderId: response.data?.id,
        publicKey: config.payment.apiKey,
        rawResponse: response.data,
    };
};

export const verifyRazorpayCheckoutSignature = (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
) => {
    if (!config.payment.apiSecret) {
        throw new AppError('ServiceUnavailable', 503, 'Payment gateway secret is not configured');
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', config.payment.apiSecret)
        .update(payload)
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        throw new AppError('BadRequest', 400, 'Invalid Razorpay payment signature');
    }
};

export const verifyRazorpayWebhookSignature = (rawBody: string, signature: string) => {
    const expectedSignature = crypto
        .createHmac('sha256', config.payment.webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        throw new AppError('BadRequest', 400, 'Invalid Razorpay webhook signature');
    }
};
