export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
}

export enum NotificationEventType {
  // User events
  SIGNUP_SUCCESS = 'signup_success',
  LOGIN_OTP = 'login_otp',
  SIGNUP_OTP = 'signup_otp',
  UPDATE_PHONE_OTP = 'update_phone_otp',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_LOCKED = 'account_locked',

  // Order events
  ORDER_PLACED = 'order_placed',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PROCESSING = 'order_processing',
  ORDER_PACKED = 'order_packed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_OUT_FOR_DELIVERY = 'order_out_for_delivery',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_FAILED = 'order_failed',
  ORDER_RTO = 'order_rto',

  // Payment events
  PAYMENT_SUCCESSFUL = 'payment_successful',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_INITIATED = 'refund_initiated',
  REFUND_COMPLETED = 'refund_completed',

  // Seller events
  SELLER_APPROVED = 'seller_approved',
  SELLER_REJECTED = 'seller_rejected',
  PRODUCT_LISTED = 'product_listed',

  // Promotional
  PROMO_AVAILABLE = 'promo_available',
  SPECIAL_OFFER = 'special_offer',
}

export interface NotificationPayload {
  userId: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  amount?: number;
  transactionId?: string;
  otp?: string;
  resetLink?: string;
  promoCode?: string;
  discount?: number;
  sellerName?: string;
  trackingUrl?: string;
  platform?: 'Portal' | 'Seller' | 'Admin' | 'Website';
  [key: string]: any; // Allow any custom data
}

export interface NotificationPreferences {
  userId: string;
  dndEnabled: boolean;
  dndStartTime?: string; // HH:mm format
  dndEndTime?: string; // HH:mm format
  eventPreferences: Record<string, boolean>;
}

export interface SendNotificationParams {
  eventType: NotificationEventType;
  payload: NotificationPayload;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationResult {
  status: 'success' | 'partial' | 'failed';
  channels: {
    [key in NotificationChannel]?: {
      success: boolean;
      messageId?: string;
      error?: string;
    };
  };
  timestamp: Date;
}
