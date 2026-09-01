# Sappey System Design Diagram

## Overview Diagram

```mermaid
flowchart LR
    subgraph Clients["Client Applications"]
        W["Website Frontend"]
        S["Seller Frontend"]
        A["Admin Frontend"]
        F["Farmer Onboarding App"]
    end

    subgraph Backend["Backend API Layer"]
        API["Express.js + TypeScript API"]
        AUTH["Auth / Session / JWT"]
        CUST["Customers / Guest Checkout"]
        PROD["Products / Catalog"]
        ORD["Orders / Payments / Shipping"]
        SELL["Sellers / Farmers"]
        ADMIN["Admin / Staff / Reports"]
        NOTIF["Notifications"]
        UPLOAD["Uploads / Media"]
    end

    subgraph Data["Application Data"]
        PG["PostgreSQL Database"]
        REDIS["Redis Cache / Sessions"]
    end

    subgraph Infra["External Infrastructure"]
        R2["Cloudflare R2 / AWS S3"]
        SMTP["SMTP Email"]
        SNS["AWS SNS SMS"]
        WA["WhatsApp API"]
        RZ["Razorpay"]
        DL["Delhivery"]
    end

    W --> API
    S --> API
    A --> API
    F --> API

    API --> AUTH
    API --> CUST
    API --> PROD
    API --> ORD
    API --> SELL
    API --> ADMIN
    API --> NOTIF
    API --> UPLOAD

    AUTH --> REDIS
    CUST --> PG
    PROD --> PG
    ORD --> PG
    SELL --> PG
    ADMIN --> PG
    NOTIF --> PG
    UPLOAD --> PG

    UPLOAD --> R2
    NOTIF --> SMTP
    NOTIF --> SNS
    NOTIF --> WA
    ORD --> RZ
    ORD --> DL
    AUTH --> REDIS
```

## Backend Layer Diagram

```mermaid
flowchart TB
    subgraph API["API Layer"]
        ROUTES["Routes"]
        CTRL["Controllers"]
    end

    subgraph App["Application Layer"]
        SVC["Services"]
        VALID["Business Rules / Validation"]
    end

    subgraph DataAccess["Data Access Layer"]
        REPO["Repositories"]
        MODEL["Sequelize Models"]
    end

    subgraph InfraLayer["Infrastructure Layer"]
        REDIS["Redis Infrastructure"]
        EMAIL["Email Infrastructure"]
        STORAGE["Storage Infrastructure"]
        INTEGR["Integrations"]
    end

    subgraph Stores["Storage Backends"]
        PG["PostgreSQL"]
        CACHE["Redis"]
    end

    ROUTES --> CTRL
    CTRL --> SVC
    SVC --> VALID
    SVC --> REPO
    REPO --> MODEL
    MODEL --> PG

    SVC --> REDIS
    SVC --> EMAIL
    SVC --> STORAGE
    SVC --> INTEGR

    REDIS --> CACHE
```

## Order Flow Diagram

```mermaid
sequenceDiagram
    participant U as Customer Website
    participant API as Backend API
    participant S as Order Service
    participant P as Product Repository
    participant DB as PostgreSQL
    participant R as Redis
    participant PAY as Razorpay
    participant SHIP as Delhivery

    U->>API: Place Order Request
    API->>S: Validate cart + shipping + payment
    S->>P: Check product availability
    P->>DB: Read product + inventory data
    S->>DB: Create order and order items
    S->>R: Cache or session data if required
    S->>PAY: Create Razorpay payment order
    PAY-->>S: Gateway order id
    S-->>API: Order created + payment session
    API-->>U: Order response

    U->>PAY: Complete checkout payment
    PAY-->>API: Payment callback / webhook
    API->>S: Confirm payment
    S->>DB: Update order status and payment status
    S->>SHIP: Create shipment if needed
    SHIP-->>S: Tracking data
    S-->>API: Payment confirmed
    API-->>U: Success response
```

## Storage and Email Architecture

```mermaid
flowchart LR
    subgraph App["Application"]
        IMG["Upload API"]
        EMAIL["Email Service"]
    end

    subgraph Infra["Infrastructure Layer"]
        CF["Cloudflare R2 / AWS S3 Adapter"]
        SMTP["Nodemailer / SMTP"]
        REDIS["Redis Client"]
    end

    subgraph Providers["Providers"]
        R2["Cloudflare R2 Bucket"]
        AWS["AWS S3 Bucket"]
        MAIL["SMTP Server"]
    end

    IMG --> CF
    CF --> R2
    CF --> AWS

    EMAIL --> SMTP
    SMTP --> MAIL

    App --> REDIS
    REDIS --> CACHE["Redis Instance"]
```

## Domain Modules Map

```mermaid
flowchart TB
    subgraph Customer["Customer Domain"]
        GUEST["Guest Checkout"]
        PROFILE["Customer Profile"]
        ADDRESS["Addresses"]
        REVIEWS["Reviews"]
    end

    subgraph ProductDomain["Product Domain"]
        CAT["Categories"]
        PROD["Products"]
        INV["Inventory"]
    end

    subgraph Commerce["Commerce Domain"]
        CART["Cart / Orders"]
        PROMO["Promotions / Coupons"]
        PAY["Payments"]
        SHIP["Shipping"]
    end

    subgraph SellerDomain["Seller / Farmer Domain"]
        SELLER["Seller Profiles"]
        FARMER["Farmer Onboarding"]
    end

    subgraph AdminDomain["Admin Domain"]
        ADM["Admin Dashboard"]
        REPORTS["Reports / Stats"]
    end

    GUEST --> CART
    PROFILE --> CART
    ADDRESS --> CART
    REVIEWS --> PROD

    CAT --> PROD
    PROD --> INV

    CART --> PAY
    CART --> SHIP
    PROMO --> CART

    SELLER --> PROD
    FARMER --> SELLER

    ADM --> REPORTS
    ADMIN --> ADM
```

## Product Fetch Behavior

- Product listing endpoints such as GET /products and GET /products/search use Redis caching in the repository layer to reduce repeated catalog queries.
- Product detail fetch endpoints such as GET /products/:id and GET /products/:slug are resolved directly from PostgreSQL through the repository, then image URLs are signed from Cloudflare R2 / S3 before returning the final payload.
- In other words, list-product reads are Redis-assisted, while single-product detail reads are direct database reads without Redis in the current implementation.

## Notes

- Frontend apps are separated by portal role: website, seller, admin, and farmer onboarding.
- Backend follows a layered architecture: routes, controllers, services, repositories, database models.
- Infrastructure code is centralized for Redis, email, storage, and external integrations.
- Payment and shipping integrations are isolated from business logic for easier scaling and maintenance.
