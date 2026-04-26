/**
 * Website Orders Module Types
 * Defines all DTOs and response types for order management
 */

export interface OrderItemRequest {
    productId: string;
    productVariantId: string;
    sku: string;
    quantity: number;
    price: number;
    discountedPrice: number;
    discountedPercent: number;
}

export interface ShippingAddressRequest {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface PlaceOrderRequest {
    items: OrderItemRequest[];
    subtotal: number;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    shippingCost?: number;
    shippingAddressId?: string;
    shippingAddress?: ShippingAddressRequest;
    paymentMethod: string;
    promoCode?: string;
    notes?: string;
}

export interface ConfirmPaymentRequest {
    paymentId: string;
    transactionId?: string;
}

export interface CancelOrderRequest {
    reason?: string;
}

export interface OrderItemResponse {
    id: string;
    orderId: string;
    productId: string;
    productVariantId: string;
    sku: string;
    quantity: number;
    price: number;
    discountedPrice: number;
    discountedPercent: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderResponse {
    id: string;
    orderNumber: string;
    customerId?: string;
    guestEmail?: string;
    guestPhone?: string;
    subtotal: number;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    shippingCost?: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    items: OrderItemResponse[];
    createdAt: string;
    updatedAt: string;
}

export interface OrderListResponse {
    success: boolean;
    data: {
        orders: OrderResponse[];
        total: number;
        limit: number;
        offset: number;
    };
}

export interface UpdateItemStatusRequest {
    status: string;
}
