import { EventEmitter } from 'events';
import { notificationService } from './notification.service';
import { NotificationEventType, SendNotificationParams } from '../types';
import logger from '../../../utils/logger';

/**
 * Notification event emitter
 * Centralized event handling for all notification triggers
 * Usage: notificationEmitter.emit('event', data)
 */
class NotificationEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Setup event listeners for all notification events
   */
  private setupListeners() {
    // User events
    this.on('user.signup_success', this.handleSignupSuccess.bind(this));
    this.on('user.login_otp', this.handleLoginOtp.bind(this));
    this.on('user.password_reset', this.handlePasswordReset.bind(this));

    // Order events
    this.on('order.placed', this.handleOrderPlaced.bind(this));
    this.on('order.confirmed', this.handleOrderConfirmed.bind(this));
    this.on('order.processing', this.handleOrderProcessing.bind(this));
    this.on('order.shipped', this.handleOrderShipped.bind(this));
    this.on('order.delivered', this.handleOrderDelivered.bind(this));
    this.on('order.cancelled', this.handleOrderCancelled.bind(this));
    this.on('order.failed', this.handleOrderFailed.bind(this));

    // Payment events
    this.on('payment.successful', this.handlePaymentSuccessful.bind(this));
    this.on('payment.failed', this.handlePaymentFailed.bind(this));

    // Seller events
    this.on('seller.approved', this.handleSellerApproved.bind(this));
    this.on('seller.rejected', this.handleSellerRejected.bind(this));
  }

  /**
   * Handle signup success notification
   */
  private async handleSignupSuccess(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.SIGNUP_SUCCESS,
        payload: {
          userId: data.userId,
          email: data.email,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          platform: data.platform || 'Portal',
          customData: {
            accountCreatedAt: new Date(),
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling signup success event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle login OTP notification
   */
  private async handleLoginOtp(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.LOGIN_OTP,
        payload: {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          customData: {
            otp: data.otp,
            expiresIn: data.expiresIn,
          },
        },
        priority: 'high',
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling login OTP event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle password reset notification
   */
  private async handlePasswordReset(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.PASSWORD_RESET,
        payload: {
          userId: data.userId,
          email: data.email,
          firstName: data.firstName,
          customData: {
            resetLink: data.resetLink,
            expiresIn: '1 hour',
          },
        },
        priority: 'high',
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling password reset event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order placed notification
   */
  private async handleOrderPlaced(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_PLACED,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            amount: data.amount,
            itemCount: data.itemCount,
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order placed event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order confirmed notification
   */
  private async handleOrderConfirmed(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_CONFIRMED,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            estimatedDelivery: data.estimatedDelivery,
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order confirmed event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order processing notification
   */
  private async handleOrderProcessing(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_PROCESSING,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order processing event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order shipped notification
   */
  private async handleOrderShipped(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_SHIPPED,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            trackingNumber: data.trackingNumber,
            carrierName: data.carrierName,
            estimatedDelivery: data.estimatedDelivery,
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order shipped event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order out for delivery notification
   */
  async handleOrderOutForDelivery(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_OUT_FOR_DELIVERY,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            deliveryPersonName: data.deliveryPersonName,
            deliveryPersonPhone: data.deliveryPersonPhone,
          },
        },
        priority: 'high',
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order out for delivery event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order delivered notification
   */
  private async handleOrderDelivered(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_DELIVERED,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            deliveryDate: data.deliveryDate,
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order delivered event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order cancelled notification
   */
  private async handleOrderCancelled(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_CANCELLED,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            reason: data.reason,
            refund: data.refundAmount,
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order cancelled event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle order failed notification
   */
  private async handleOrderFailed(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.ORDER_FAILED,
        payload: {
          userId: data.customerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            reason: data.reason,
          },
        },
        priority: 'high',
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling order failed event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle payment successful notification
   */
  private async handlePaymentSuccessful(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.PAYMENT_SUCCESSFUL,
        payload: {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            amount: data.amount,
            transactionId: data.transactionId,
            method: data.paymentMethod,
          },
        },
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling payment successful event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle payment failed notification
   */
  private async handlePaymentFailed(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.PAYMENT_FAILED,
        payload: {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            orderId: data.orderId,
            amount: data.amount,
            reason: data.reason,
          },
        },
        priority: 'high',
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling payment failed event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle seller approved notification
   */
  private async handleSellerApproved(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.SELLER_APPROVED,
        payload: {
          userId: data.sellerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            sellerBusinessName: data.businessName,
            approvalDate: new Date(),
          },
        },
        priority: 'high',
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling seller approved event', { error: error?.message || String(error) });
    }
  }

  /**
   * Handle seller rejected notification
   */
  private async handleSellerRejected(data: any) {
    try {
      const params: SendNotificationParams = {
        eventType: NotificationEventType.SELLER_REJECTED,
        payload: {
          userId: data.sellerId,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          customData: {
            reason: data.reason,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@sappay.com',
          },
        },
        priority: 'high',
      };

      await notificationService.sendNotification(params);
    } catch (error: any) {
      logger.error('Error handling seller rejected event', { error: error?.message || String(error) });
    }
  }
}

/**
 * Singleton instance of notification event emitter
 * Usage across the application:
 * import { notificationEmitter } from '.../notification-emitter';
 * notificationEmitter.emit('order.placed', { customerId, amount, ... })
 */
export const notificationEmitter = new NotificationEventEmitter();
