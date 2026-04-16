/**
 * Guest Checkout Types
 */

export interface SendOTPRequest {
  contact: string; // email, phone, or whatsapp number
  contactType: 'email' | 'phone' | 'whatsapp'; // determined by NOTIFICATION_CHANNEL
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}

export interface VerifyOTPRequest {
  contact: string;
  contactType: 'email' | 'phone' | 'whatsapp';
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  guestToken: string; // JWT token for guest checkout
  message: string;
}

export interface FindCustomerByContactRequest {
  contact: string;
  contactType: 'email' | 'phone' | 'whatsapp';
}

export interface FindCustomerByContactResponse {
  success: boolean;
  customer: {
    id: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    name?: string;
    orderCount: number;
  } | null;
  addresses: Array<{
    id: string;
    name?: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
}

export interface GuestCheckoutData {
  contact: string;
  contactType: 'email' | 'phone' | 'whatsapp';
  isGuest: true;
}

export interface GuestOrderRequest {
  guestToken: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost?: number;
  shippingAddress: GuestShippingAddress;
  paymentMethod: 'card' | 'cod' | 'upi' | 'netbanking';
  promotionId?: string;
  promotionDetails?: {
    id: string;
    title: string;
    type: string;
    discount: number;
  };
}

export interface GuestShippingAddress {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  productVariantId: string;
  sku: string;
  quantity: number;
  price?: number;
  discountedPrice?: number;
  discountedPercent?: number;
}
