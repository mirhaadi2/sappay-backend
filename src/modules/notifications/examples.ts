/**
 * ============================================================================
 * Notification Usage Examples - SINGLE CHANNEL MODE
 * ============================================================================
 * ⚠️ IMPORTANT: Only ONE notification channel works at a time!
 * Set NOTIFICATION_CHANNEL in .env to: sms | email | whatsapp | in_app
 * 
 * This file contains practical examples of how to send notifications.
 * The active channel is determined by NOTIFICATION_CHANNEL in .env
 */

import { sendNotification } from './services/notification.service';
import { NotificationEventType } from './types';

/**
 * EXAMPLE 1: Send OTP (Works with active channel only)
 */
export async function sendOTP(userId: string, phoneNumber: string, email: string, otp: string) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.LOGIN_OTP,
      payload: {
        userId,
        phoneNumber,
        email,
        otp,
        platform: 'Portal',
      },
      priority: 'high', // OTP is time-sensitive
    });

    console.log('OTP sent via active channel:', result.status);
    return result;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw error;
  }
}

/**
 * EXAMPLE 2: Send Order Confirmation (Via active channel)
 */
export async function sendOrderConfirmation(
  userId: string,
  phoneNumber: string,
  email: string,
  orderData: { orderId: string; orderNumber: string; totalAmount: number }
) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.ORDER_CONFIRMED,
      payload: {
        userId,
        phoneNumber,
        email,
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount,
        platform: 'Portal',
      },
      priority: 'normal',
    });

    console.log('Order confirmation sent:', result.status);
    return result;
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    throw error;
  }
}

/**
 * EXAMPLE 3: Send Order Shipped (Via active channel)
 */
export async function sendOrderShipped(
  userId: string,
  phoneNumber: string,
  email: string,
  trackingUrl: string
) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.ORDER_SHIPPED,
      payload: {
        userId,
        phoneNumber,
        email,
        trackingUrl,
        platform: 'Portal',
      },
      priority: 'normal',
    });

    console.log('Shipment notification sent:', result.status);
    return result;
  } catch (error) {
    console.error('Failed to send shipment notification:', error);
    throw error;
  }
}

/**
 * EXAMPLE 4: Send Password Reset (Via active channel)
 */
export async function sendPasswordReset(
  userId: string,
  phoneNumber: string,
  email: string,
  resetLink: string
) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.PASSWORD_RESET,
      payload: {
        userId,
        phoneNumber,
        email,
        resetLink,
        platform: 'Portal',
      },
      priority: 'high',
    });

    return result;
  } catch (error) {
    console.error('Failed to send password reset:', error);
    throw error;
  }
}

/**
 * EXAMPLE 5: Send Promotional Message (Via active channel)
 */
export async function sendPromotion(
  userId: string,
  phoneNumber: string,
  email: string,
  promoCode: string,
  discount: number
) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.SPECIAL_OFFER,
      payload: {
        userId,
        phoneNumber,
        email,
        promoCode,
        discount,
        platform: 'Portal',
      },
      priority: 'low',
    });

    return result;
  } catch (error) {
    console.error('Failed to send promotional message:', error);
    throw error;
  }
}

/**
 * EXAMPLE 6: Send Seller Approval (Via active channel)
 */
export async function sendSellerApproval(
  userId: string,
  phoneNumber: string,
  email: string,
  sellerName: string
) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.SELLER_APPROVED,
      payload: {
        userId,
        phoneNumber,
        email,
        sellerName,
        platform: 'Portal',
      },
      priority: 'high',
    });

    return result;
  } catch (error) {
    console.error('Failed to send seller approval:', error);
    throw error;
  }
}

/**
 * EXAMPLE 7: Send Payment Success (Via active channel)
 */
export async function sendPaymentSuccess(
  userId: string,
  phoneNumber: string,
  email: string,
  amount: number,
  transactionId: string
) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.PAYMENT_SUCCESSFUL,
      payload: {
        userId,
        phoneNumber,
        email,
        amount,
        transactionId,
        platform: 'Portal',
      },
      priority: 'high',
    });

    return result;
  } catch (error) {
    console.error('Failed to send payment success:', error);
    throw error;
  }
}

/**
 * EXAMPLE 8: Send Account Locked (Via active channel)
 */
export async function sendAccountLocked(
  userId: string,
  phoneNumber: string,
  email: string
) {
  try {
    const result = await sendNotification({
      eventType: NotificationEventType.ACCOUNT_LOCKED,
      payload: {
        userId,
        phoneNumber,
        email,
        platform: 'Portal',
      },
      priority: 'high',
    });

    return result;
  } catch (error) {
    console.error('Failed to send account locked notification:', error);
    throw error;
  }
}

// ============================================================================
// NOTES FOR DEVELOPERS
// ============================================================================

/**
 * SINGLE CHANNEL MODE CONFIGURATION:
 * 
 * Set ONE of these in your .env file:
 * 
 * 1. SMS Channel (AWS SNS)
 *    NOTIFICATION_CHANNEL=sms
 *    Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SMS_ORIGINATION_ID
 * 
 * 2. Email Channel (SMTP)
 *    NOTIFICATION_CHANNEL=email
 *    Requires: SMTP_HOST, SMTP_PORT, SMTP_PASSWORD
 * 
 * 3. WhatsApp Channel (Meta Cloud API)
 *    NOTIFICATION_CHANNEL=whatsapp
 *    Requires: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 * 
 * 4. In-App Channel (Database)
 *    NOTIFICATION_CHANNEL=in_app
 *    No external credentials needed
 * 
 * ⚠️ Default is SMS if not specified
 * ⚠️ Only ONE channel can be active at a time
 */

/**
 * QUICK REFERENCE:
 * 
 * To change channels, just update .env and restart the backend:
 * 
 *   Old: NOTIFICATION_CHANNEL=sms
 *   New: NOTIFICATION_CHANNEL=whatsapp
 *   
 *   npm run dev (restart required)
 * 
 * All existing code continues to work - just the channel changes!
 */

export default {
  sendOTP,
  sendOrderConfirmation,
  sendOrderShipped,
  sendPasswordReset,
  sendPromotion,
  sendSellerApproval,
  sendPaymentSuccess,
  sendAccountLocked,
};
