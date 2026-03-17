# API Endpoints Reference

Complete listing of all e-commerce platform API endpoints.

## Authentication Endpoints

### Login
- **POST** `/api/auth/login`
- Request: `{ email, password }`
- Response: `{ success, user, sessionId }`

### Register
- **POST** `/api/auth/register`
- Request: `{ email, password, phone, name }`
- Response: `{ success, user, message }`

### Verify Email
- **POST** `/api/auth/verify-email`
- Request: `{ email, otp }`
- Response: `{ success, message }`

### Get Current User
- **GET** `/api/auth/me`
- Response: `{ success, user }`

---

## Seller Endpoints

### Register as Seller
- **POST** `/api/sellers/register`
- Auth: Required
- Request: `{ businessName, businessRegistrationNo, businessType, businessAddress, businessPhone, ownerName, ownerEmail, bankAccountName, bankAccountNumber, bankIfscCode, gstNumber? }`
- Response: `{ success, data: { id, status, onboardingStep } }`

### Get Seller Profile
- **GET** `/api/sellers/:id`
- Response: `{ success, data: { id, businessName, businessType, status, commissionRate, approvedAt } }`

### Update Seller Profile
- **PUT** `/api/sellers/:id`
- Auth: Required (Seller)
- Request: `{ businessAddress?, businessPhone?, bankAccountName?, bankAccountNumber?, bankIfscCode?, ownerName?, ownerEmail? }`
- Response: `{ success, data: updatedProfile }`

### Get Seller Dashboard
- **GET** `/api/sellers/:id/dashboard`
- Auth: Required (Seller)
- Response: `{ success, data: { seller, stats, onboardingStatus } }`

### List All Sellers (Admin)
- **GET** `/api/sellers?status=PENDING&limit=20&offset=0&sortBy=recent`
- Response: `{ success, data: [...], pagination: { total, limit, offset } }`

### Approve Seller (Admin)
- **POST** `/api/sellers/:id/approve`
- Response: `{ success, data: { id, status, message } }`

### Reject Seller (Admin)
- **POST** `/api/sellers/:id/reject`
- Request: `{ reason }`
- Response: `{ success, data: { id, status } }`

### Suspend Seller (Admin)
- **POST** `/api/sellers/:id/suspend`
- Request: `{ reason }`
- Response: `{ success, data: { id, status } }`

---

## Address Endpoints

### Create Address
- **POST** `/api/addresses`
- Auth: Required
- Request: `{ type, name?, addressLine1, addressLine2?, city, state, postalCode, country, phone, isDefault? }`
- Response: `{ success, data: address, message }`

### Get All Addresses
- **GET** `/api/addresses`
- Auth: Required
- Response: `{ success, data: [...], count }`

### Get Default Address
- **GET** `/api/addresses/default`
- Auth: Required
- Response: `{ success, data: address }`

### Get Address by ID
- **GET** `/api/addresses/:id`
- Auth: Required
- Response: `{ success, data: address }`

### Update Address
- **PUT** `/api/addresses/:id`
- Auth: Required
- Request: `{ type?, name?, addressLine1?, addressLine2?, city?, state?, postalCode?, country?, phone? }`
- Response: `{ success, data: updatedAddress, message }`

### Delete Address
- **DELETE** `/api/addresses/:id`
- Auth: Required
- Response: `{ success, message }`

### Set Default Address
- **POST** `/api/addresses/:id/set-default`
- Auth: Required
- Response: `{ success, data: address, message }`

---

## Product Endpoints

### Create Product (Admin)
- **POST** `/api/products`
- Auth: Required (Admin)
- Request: `{ name, slug, categoryId, description?, gst_rate?, images? }`
- Response: `{ success, data: product }`

### List products
- **GET** `/api/products/search?q=laptop&category=electronics&minPrice=10000&maxPrice=100000&limit=20&offset=0`
- Response: `{ success, data: [...], pagination }`

### Get Product Details
- **GET** `/api/products/:id`
- Response: `{ success, data: { ...product, sellers: [...] } }`

### Get Categories
- **GET** `/api/products/categories?isActive=true&limit=100`
- Response: `{ success, data: [...] }`

### Get Products by Category
- **GET** `/api/products/categories/:category/products?limit=20&offset=0`
- Response: `{ success, data: [...], pagination }`

### Add Product to Seller
- **POST** `/api/products/:productId/add-to-seller`
- Auth: Required (Seller)
- Request: `{ sellerPrice, costPrice }`
- Response: `{ success, data: sellerProduct }`

### Get Seller Products
- **GET** `/api/products/seller/products?limit=20&offset=0&status=ACTIVE`
- Auth: Required (Seller)
- Response: `{ success, data: [...], pagination }`

### Update Product Price
- **PUT** `/api/products/seller/:sellerProductId/price`
- Auth: Required (Seller)
- Request: `{ sellerPrice?, costPrice? }`
- Response: `{ success, data: updatedProduct }`

---

## Inventory Endpoints

### Get Inventory
- **GET** `/api/inventory/:id`
- Auth: Required (Seller)
- Response: `{ success, data: { id, totalStock, availableStock, reservedStock, soldStock } }`

### Update Stock
- **PUT** `/api/inventory/:id`
- Auth: Required (Seller)
- Request: `{ quantity }`
- Response: `{ success, data: updatedInventory }`

### Check Availability
- **GET** `/api/inventory/:id/check-availability?quantity=5`
- Response: `{ success, data: { available: boolean } }`

---

## Order Endpoints

### Place Order
- **POST** `/api/orders`
- Auth: Required (Customer)
- Request:
  ```json
  {
    "items": [
      { "sellerProductId": "xyz", "quantity": 2 }
    ],
    "shippingAddressId": "addr-123",
    "paymentMethod": "CREDIT_CARD"
  }
  ```
- Response: `{ success, data: { id, orderNumber, status, finalAmount } }`

### Get Customer Orders
- **GET** `/api/orders?status=PENDING&limit=20&offset=0`
- Auth: Required (Customer)
- Response: `{ success, data: [...], pagination }`

### Confirm Payment
- **POST** `/api/orders/:id/confirm-payment`
- Auth: Required
- Response: `{ success, data: { id, status, message } }`

### Cancel Order
- **POST** `/api/orders/:id/cancel`
- Auth: Required (Customer)
- Request: `{ reason }`
- Response: `{ success, data: { id, status } }`

### Get Seller Orders
- **GET** `/api/orders/seller/orders?status=CONFIRMED&limit=20`
- Auth: Required (Seller)
- Response: `{ success, data: [...], pagination }`

### Update Order Item Status
- **PUT** `/api/orders/:itemId/status`
- Auth: Required (Seller)
- Request: `{ status: "PACKED"|"SHIPPED"|"DELIVERED", trackerNumber? }`
- Status Transitions:
  - PENDING → CONFIRMED, CANCELLED
  - CONFIRMED → PACKED
  - PACKED → SHIPPED
  - SHIPPED → DELIVERED
- Response: `{ success, data: updatedItem }`

---

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": { "total": 100, "limit": 20, "offset": 0 }
}
```

### Error Response
```json
{
  "success": false,
  "error": "ErrorType",
  "statusCode": 400,
  "message": "Error description"
}
```

---

## Status Values

### Seller Status
- `PENDING` - Awaiting admin approval
- `APPROVED` - Active seller
- `REJECTED` - Registration rejected
- `SUSPENDED` - Account suspended

### Order Status
- `PENDING` - Order placed, awaiting payment
- `CONFIRMED` - Payment confirmed
- `CANCELLED` - Order cancelled

### Order Item Status
- `PENDING` - Item received by seller
- `CONFIRMED` - Order confirmed by seller
- `PACKED` - Item packed
- `SHIPPED` - Item shipped
- `DELIVERED` - Item delivered
- `CANCELLED` - Item cancelled

---

## Authentication

All endpoints marked with "Auth: Required" need session authentication. Include session cookie in requests.

**Session Format:**
```
Cookie: connect.sid=<session_id_from_login>
```

---

## Rate Limiting & Pagination

Default pagination:
- `limit`: 20
- `offset`: 0

Max results per request: 100

---

## Last Updated
March 2026
