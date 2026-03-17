# SapPay E-Commerce Platform Architecture

## Executive Summary

A professional, scalable e-commerce platform with three core portals:
- **Website Frontend (B2C)** - Customer shopping experience
- **Seller Frontend** - Multi-vendor seller management
- **Admin Frontend** - Platform administration & analytics

---

## System Overview

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATIONS                     │
├──────────────────────┬──────────────────────┬────────────────┤
│  Website Frontend    │  Seller Frontend     │  Admin Frontend │
│  (B2C Customers)     │  (Sellers/Vendors)   │  (Admins)       │
└──────────────────────┴──────────────────────┴────────────────┘
                              │
                              ↓
              ┌───────────────────────────────┐
              │    Express + TypeScript API   │
              │       (Backend Server)        │
              └───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ↓                               ↓
         ┌─────────────┐              ┌──────────────┐
         │ PostgreSQL  │              │ Redis (Cache) │
         │  Database   │              │ & Sessions   │
         └─────────────┘              └──────────────┘
```

---

## Database Schema Design

### Core Entities

#### 1. **Users Table** (Enhanced)
```sql
-- Existing structure extended with role discrimination
- id: UUID (PK)
- email: STRING (UNIQUE)
- password: STRING (hashed)
- name: STRING
- phone: STRING
- role: ENUM (USER, SELLER, ADMIN) -- Extended from USER, ADMIN
- status: ENUM (ACTIVE, SUSPENDED, DELETED)
- metadata: JSON (preferences, settings)
- createdAt, updatedAt, deletedAt
```

#### 2. **Sellers Table** (NEW)
```sql
-- Complete seller profile & business info
- id: UUID (PK)
- userId: UUID (FK to Users) -- Links seller to user account
- businessName: STRING (UNIQUE)
- businessRegistrationNo: STRING (UNIQUE)
- businessType: ENUM (SOLE_PROPRIETOR, PARTNERSHIP, COMPANY)
- gstNumber: STRING
- businessAddress: STRING
- businessPhone: STRING
- ownerName: STRING
- ownerEmail: STRING
- bankAccountName: STRING
- bankAccountNumber: STRING
- bankIfscCode: STRING
- commissionRate: DECIMAL (%) -- Platform commission
- status: ENUM (PENDING, APPROVED, SUSPENDED, REJECTED)
- approvedAt: TIMESTAMP
- rejectedReason: TEXT
- onboardingStep: INT (0-100) -- Tracks onboarding progress
- metadata: JSON (banking details, documents, etc.)
- createdAt, updatedAt, deletedAt
```

#### 3. **Categories Table** (NEW)
```sql
-- Product taxonomy
- id: UUID (PK)
- name: STRING (UNIQUE)
- slug: STRING (UNIQUE)
- description: TEXT
- parentCategoryId: UUID (FK) -- For hierarchical categories
- image: STRING (URL)
- isActive: BOOLEAN
- displayOrder: INT
- createdAt, updatedAt
```

#### 4. **Products Table** (NEW)
```sql
-- Base product information (shared across sellers)
- id: UUID (PK)
- categoryId: UUID (FK)
- name: STRING
- slug: STRING (UNIQUE)
- description: TEXT
- images: JSON (array of image URLs)
- specifications: JSON (product specs)
- basePrice: DECIMAL (reference price)
- hsn_code: STRING (tax classification)
- gst_rate: DECIMAL (%)
- certifications: JSON (organic, etc.)
- status: ENUM (ACTIVE, INACTIVE)
- createdAt, updatedAt
```

#### 5. **SellerProducts Table** (NEW) ⭐ **CRITICAL**
```sql
-- Links sellers to products with seller-specific pricing & inventory
- id: UUID (PK)
- sellerId: UUID (FK)
- productId: UUID (FK)
- sellerSku: STRING
- sellerPrice: DECIMAL (seller's selling price)
- costPrice: DECIMAL (seller's cost)
- weight: DECIMAL (grams)
- dimensions: JSON
- warrantyMonths: INT
- status: ENUM (ACTIVE, INACTIVE, DISCONTINUED)
- createdAt, updatedAt
- UNIQUE CONSTRAINT: (sellerId, productId)
```

#### 6. **Inventory Table** (NEW) ⭐ **CRITICAL**
```sql
-- Real-time stock management per seller
- id: UUID (PK)
- sellerProductId: UUID (FK)
- totalStock: INT
- availableStock: INT
- reservedStock: INT (in pending orders)
- soldStock: INT (cumulative)
- reorderLevel: INT (alert threshold)
- lastRestockedAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### 7. **Orders Table** (NEW) ⭐ **CRITICAL**
```sql
-- Main order container (can have items from multiple sellers)
- id: UUID (PK)
- orderNumber: STRING (UNIQUE, generated)
- customerId: UUID (FK to Users)
- status: ENUM (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, FAILED)
- totalAmount: DECIMAL
- discountAmount: DECIMAL
- taxAmount: DECIMAL
- shippingCost: DECIMAL
- finalAmount: DECIMAL
- paymentStatus: ENUM (PENDING, COMPLETED, FAILED, REFUNDED)
- paymentMethod: STRING (CARD, UPI, NETBANKING, COD)
- shippingAddressId: UUID (FK)
- deliveryDate: DATE
- notes: TEXT
- createdAt, updatedAt, deliveredAt
```

#### 8. **OrderItems Table** (NEW) ⭐ **CRITICAL**
```sql
-- Individual items in an order (each item belongs to one seller)
- id: UUID (PK)
- orderId: UUID (FK)
- sellerId: UUID (FK) -- Which seller handles this item
- sellerProductId: UUID (FK)
- quantity: INT
- unitPrice: DECIMAL (price at time of order)
- subtotal: DECIMAL (quantity × unitPrice)
- taxAmount: DECIMAL
- itemTotal: DECIMAL
- status: ENUM (PENDING, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURNED)
- trackerNumber: STRING (shipping tracker)
- shippedAt: TIMESTAMP
- deliveredAt: TIMESTAMP
- createdAt, updatedAt
```

#### 9. **SellerDashboardMetrics Table** (NEW)
```sql
-- Cached metrics for seller dashboard (updated daily)
- id: UUID (PK)
- sellerId: UUID (FK)
- date: DATE
- totalOrders: INT
- totalRevenue: DECIMAL
- totalItems: INT
- averageOrderValue: DECIMAL
- conversionRate: DECIMAL
- topProducts: JSON (array of top selling products)
- createdAt
```

---

## Multi-Seller Order Routing Strategy ⭐ **KEY BUSINESS LOGIC**

### Scenario: Multiple Sellers Selling Same Product

**Example:** Almonds sold by Seller A & Seller B with different prices and stock levels

#### Option 1: **Multiple Variants in Cart** (Recommended for Early Stage)
- Customer sees all sellers' variants with different prices
- Customer chooses which seller's variant to add to cart
- Simple inventory management
- **Implementation:** Product page shows all sellers' options

#### Option 2: **Smart Routing (Professional Real-World)** ⭐
Used by platforms like Amazon, Flipkart, OYO

**Routing Priority:**
1. **Filter by availability** (has stock)
2. **Filter by service ability** (can ship to customer location)
3. **Sort by criteria:**
   - **Distance-based:** Seller closest to customer (fastest delivery)
   - **Price-based:** Lowest price (if equal distance)
   - **Rating-based:** Premium sellers (high ratings get priority)
   - **Stock level:** High stock sellers (less likely to cancel)

**Order Assignment Algorithm:**
```javascript
// Pseudo code
function assignOrderToSeller(product, qty, customerLocation) {
  let eligibleSellers = getEligibleSellers(product, qty, customerLocation);
  
  if (eligibleSellers.length === 0) {
    throw "Product not available for your location";
  }
  
  if (eligibleSellers.length === 1) {
    return eligibleSellers[0];
  }
  
  // Multiple sellers: apply routing logic
  let selectedSeller = eligibleSellers[0];
  
  if (platform.config.routingStrategy === "DISTANCE_THEN_PRICE") {
    selectedSeller = sortByDistance(eligibleSellers)[0];
    if (distance difference < 50km) {
      selectedSeller = sortByPrice(eligibleSellers)[0];
    }
  } else if (platform.config.routingStrategy === "PRIORITY_BASED") {
    selectedSeller = sortBySellerPriority(eligibleSellers)[0];
  }
  
  return selectedSeller;
}

// Order assignment when placed
function placeOrder(cart, paymentInfo, shippingAddress) {
  let order = createOrder(customer, paymentInfo, shippingAddress);
  
  // Group cart items by seller
  let itemGroupedBySeller = groupByProductSeller(cart);
  
  for (let [sellerId, items] of itemGroupedBySeller) {
    createOrderItem(order, sellerId, items);
    updateInventory(sellerId, items, RESERVED); // Block stock
    sendNotificationToSeller(order, sellerId); // Notify seller
  }
  
  return order;
}
```

#### Option 3: **Order Splitting** (Complex)
- Single order from customer
- System intelligently splits order items across sellers based on delivery time
- E.g., Customer orders Almonds + Sugar + Oil from 3 different sellers
- Each seller gets notification for assigned items
- **Pro:** Best for customer (single order experience)
- **Con:** Complex fulfillment, inventory management, and returns

---

## Feature Matrix

### Website Frontend (B2C Customer)

#### Authentication & Account
- [x] Sign Up (Email verification)
- [x] Sign In (Session-based)
- [x] Password Reset
- [x] Address Management (Multiple delivery addresses)
- [ ] Profile Management
- [ ] Wishlist

#### Shopping
- [ ] Browse Categories
- [ ] Product Search & Filters
- [ ] Product Details (all sellers' options for same product)
- [ ] Add to Cart
- [ ] View Cart
- [ ] Checkout (Address, Payment)
- [ ] Order Confirmation

#### Order Management
- [ ] View Orders History
- [ ] Track Order (Real-time status)
- [ ] Download Invoice
- [ ] Cancel Order
- [ ] Return/Refund Request

#### Notifications
- [ ] Order Status Updates (via Email/SMS)
- [ ] Shipping Updates
- [ ] Promotional Emails

---

### Seller Frontend

#### Onboarding Flow

**Step 1: Self-Registration OR Admin-Provided Credentials**
- Option A (Recommended): Seller self-registers with business email
- Option B: Admin creates seller account → Sends credentials via email
- Both approaches supported for flexibility

**Step 2: Seller Registration Form**
```json
{
  "businessName": "ABC Almonds Private Ltd",
  "businessRegistrationNumber": "12345678",
  "businessType": "COMPANY",
  "gstNumber": "27AAFCT5055K1Z5",
  "businessAddress": "123 Main St, City, State",
  "ownerName": "John Doe",
  "ownerEmail": "owner@abc.com",
  "bankAccountName": "ABC Almonds",
  "bankAccountNumber": "123456789",
  "bankIfscCode": "ICIC0000001",
  "documentUrls": [
    "gst_certificate.pdf",
    "registration_certificate.pdf",
    "business_address_proof.pdf"
  ]
}
```

**Step 3: Document Verification** (Admin Action)
- Admin reviews documents
- Approves or requests corrections
- Seller account becomes APPROVED
- Seller receives approval email with credentials

**Step 4: Seller Onboarding Complete**
- Seller can now manage products, inventory, orders

#### Dashboard
- [x] **Overview:** Sales, Orders, Revenue (Today/Week/Month/Year graphs)
- [x] **Orders:** List, Filter, Bulk Actions
- [x] **Products:** Add, Edit, Manage, Bulk Upload
- [x] **Inventory:** Stock Levels, Reorder Alerts, Movement History
- [x] **Customers:** Top Customers, Feedback/Reviews
- [x] **Payouts:** Earnings, Commission, Bank Details, Payout History
- [x] **Settings:** Profile, Bank Details, Shop Settings
- [x] **Support:** Help Center, Ticket System

#### Product Management
- Add Products (New or Existing)
- Edit Pricing & Stock
- Bulk Upload (CSV)
- SKU Management
- Product Status (Active/Inactive)

#### Inventory Management
- Real-time Stock Updates
- Reorder Automation
- Low Stock Alerts
- Stock Movement History
- Batch/Expiry Management

#### Order Management
- Order List with Advanced Filters
- Order Details & Customer Info
- Mark as Packed/Shipped
- Generate & Print Labels
- Shipment Tracking Integration
- Request Returns/Exchanges
- Reject/Cancel Orders with Reason

#### Analytics & Reports
- Sales by Time Period
- Top Products
- Customer Acquisition
- Return Rate
- Cancellation Rate
- Conversation Rate

---

### Admin Frontend

#### Dashboard
- [ ] **Platform Overview:**
  - Active Users, Active Sellers
  - Total Orders, Revenue
  - Growth Metrics
  - System Health

#### Customer Management
- [ ] **Customer List:** Search, Filter, Status
  - View Customer Profile
  - View Customer Orders
  - Email/SMS to Customer
  - Suspend/Ban Customer
  - View Feedback Given

#### Seller Management
- [ ] **Seller List:** Pending, Approved, Suspended
  - Seller Registration Approval (Document Verification)
  - View Seller Performance Metrics
  - Update Commission Rate
  - Suspend/Deactivate Seller
  - View Seller Payouts

#### Product Management
- [ ] **Product Catalog:**
  - Create Categories
  - View All Products (with seller mapping)
  - Product Status Management
  - Quality Flags (return rate, complaints)

#### Inventory Management
- [ ] **Stock Levels:** Real-time across all sellers
  - Stock Movement Reports
  - Seller-wise Inventory Status

#### Order Management
- [ ] **All Orders:** Filter by Status, Seller, Customer
  - Order Details
  - Payment Status Verification
  - Issue Resolution
  - Global Analytics

#### Finance & Payouts
- [ ] **Commission Settings:**
  - Category-wise Commission Rates
  - Seller-specific Commissions
- [ ] **Seller Payouts:**
  - Payout Schedule (Weekly/Monthly)
  - Payout Status Tracking
  - Payout Reports
- [ ] **Platform Revenue:** Charts & Reports

#### Support Management
- [ ] **Tickets:** Customer & Seller Support Tickets
- [ ] **Returns/Refunds:** Review & Approve
- [ ] **Disputes:** Seller-Customer Disputes

#### Configuration
- [ ] **Platform Settings:**
  - Shipping Zones
  - Delivery Time Standards
  - Payment Methods
  - Email Templates
  - Communication Preferences
- [ ] **Tax Settings:**
  - GST Rates by Category
  - GST Configurations
- [ ] **Users:** Admin account management

---

## Technical Implementation Plan

### Phase 1: Backend Database & Core Modules (Week 1-2)
✅ Create database migrations for:
- Sellers table
- Categories table
- Products table
- SellerProducts table (linking)
- Inventory table
- Orders table
- OrderItems table

✅ Create Backend Modules:
- `modules/sellers/` - Seller management
- `modules/products/` - Product catalog
- `modules/orders/` - Order management
- `modules/inventory/` - Stock management

### Phase 2: Authentication & Onboarding (Week 2-3)
✅ Extend User model to support SELLER role
✅ Seller registration endpoints
✅ Admin seller approval workflow
✅ Seller login & session

### Phase 3: Product & Inventory API (Week 3-4)
✅ Product endpoints (create, edit, search)
✅ Seller product linking
✅ Inventory management endpoints
✅ Stock reservation logic

### Phase 4: Order Processing Engine (Week 4-5)
✅ Order placement
✅ Multi-seller order assignment
✅ Inventory allocation
✅ Payment processing
✅ Order status management

### Phase 5: Frontend Applications (Week 5-8)
- Website Frontend: Shopping, Order Management
- Seller Frontend: Dashboard, Product Mgmt, Orders
- Admin Frontend: All management features

---

## Database Relationships & Integrity

```
Users (1) ──────────────── (1) Sellers
            userId

Users (1) ──────────────── (N) Orders
            customerId

Sellers (1) ──────────────── (N) SellerProducts
             sellerId

Products (1) ──────────────── (N) SellerProducts
             productId

SellerProducts (1) ──────────────── (N) Inventory
                    sellerProductId

Orders (1) ──────────────── (N) OrderItems
           orderId

Sellers (1) ──────────────── (N) OrderItems
           sellerId

SellerProducts (1) ──────────────── (N) OrderItems
               sellerProductId

Categories (1) ──────────────── (N) Products
              parentCategoryId
                              (recursive)
```

---

## Key Business Rules & Validations

### Seller Onboarding
- ✅ Email must be unique
- ✅ Business registration number must be verified
- ✅ GST number must be valid
- ✅ Bank details must be verified
- ✅ Documents are mandatory

### Product Management
- ✅ Seller cannot list product below cost price
- ✅ Product must belong to valid category
- ✅ Maximum 10 images per product
- ✅ Seller can only edit own products

### Inventory Management
- ✅ Available stock = Total - Reserved - Damaged
- ✅ Cannot sell more than available stock
- ✅ stock reservation removed if order cancelled within 24hrs
- ✅ Physical stock count in SellerProducts table

### Order Processing
- ✅ Order placed → Stock reserved (not deducted yet)
- ✅ Payment confirmed → Stock committed (deducted)
- ✅ Order cancelled/failed → Stock released back
- ✅ Multi-seller orders allowed
- ✅ Each order item assigned to one seller

### Commission & Payouts
- ✅ Commission deducted from seller earnings
- ✅ Payout only after order delivered
- ✅ Admin can set category-wise commission rates
- ✅ Seller can view commission breakdown

---

## Security Considerations

1. **Role-Based Access Control (RBAC)**
   - Admin: Full platform access
   - Seller: Only own data access
   - Customer: Only own order/address access

2. **Data Encryption**
   - Bank details should be encrypted at rest
   - Password hashing with bcrypt
   - API tokens for external integrations

3. **Audit Logs**
   - Track seller account modifications
   - Track order status changes
   - Track inventory movements
   - Track admin actions

4. **Rate Limiting**
   - Prevent spam/abuse
   - Order placement rate limit (per user, per IP)
   - API endpoints rate limiting

---

## Testing Strategy

- Unit tests for business logic (commission, routing, inventory)
- Integration tests for order flow
- E2E tests for complete scenarios
- Load testing for multi-seller order processing

---

## Performance Optimization

1. **Indexing Strategy**
   - Index on sellerId, productId in SellerProducts
   - Index on orderId in OrderItems
   - Index on customerId in Orders
   - Index on status fields for filtering

2. **Caching**
   - Cache product catalog (Redis)
   - Cache seller performance metrics
   - Cache category hierarchies

3. **Query Optimization**
   - Use select() to fetch only required fields
   - Eager loading for relationships
   - Pagination for large result sets

---

## Next Steps

1. Create detailed API documentation for each module
2. Design seller onboarding UX/UI
3. Design admin dashboard wireframes
4. Design website frontend shopping flow
5. Implement backend migrations & models
6. Start with Seller module implementation
