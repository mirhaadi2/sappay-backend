# 📱 Notification System - Single Channel Mode

## ⚠️ Architecture: Single Channel Only

This notification system uses **ONE active notification channel at a time**. Choose your channel via `NOTIFICATION_CHANNEL` in `.env`:

- `sms` - SMS via AWS SNS
- `email` - Email via SMTP  
- `whatsapp` - WhatsApp via Meta Cloud API ⭐ NEW
- `in_app` - In-App notifications via Database

### Key Features

✅ **Single-Channel Architecture** - Only ONE channel active per environment
✅ **Easy Channel Switching** - Change channels by updating `.env`
✅ **Template-Based Messaging** - Dynamic placeholders ({{otp}}, {{orderId}}, etc.)
✅ **4 Channel Support** - SMS, Email, WhatsApp, In-App
✅ **User Preferences** - Opt-in/out for notification types
✅ **Do Not Disturb** - Respect user quiet hours
✅ **Audit Logging** - Complete notification history
✅ **Per-Channel Validation** - Clear error messages for missing config
✅ **Error Handling** - Comprehensive logging and retry logic

---

## Architecture

### Core Components

```
notifications/
├── models.ts                           # Database models
├── types.ts                            # TypeScript interfaces and enums
├── controller.ts                       # API endpoint handlers
├── routes.ts                           # API routes
├── index.ts                            # Module exports
├── IMPLEMENTATION_GUIDE.ts             # Integration guide
├── README.md                           # This file
└── services/
    ├── notification.service.ts         # Core notification logic
    ├── aws-sns.service.ts              # AWS SNS integration
    └── notification-emitter.ts         # Event emitter & triggers
```

### Database Schema

#### `notification_templates`
Stores notification templates for each event type and channel.

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| eventType | string | Type of event (order_placed, signup_success, etc.) |
| channel | enum | Notification channel (sms, email, whatsapp, in_app) |
| title | string | Notification title/subject |
| body | text | Notification message body with placeholders |
| platformsAllowed | json | Platforms where template is active (Portal, Seller, Admin, Website) |
| channelTemplateId | string | AWS SNS template ID for template-based SMS |
| placeholders | json | List of placeholders used in title/body |
| isActive | boolean | Whether template is active |

#### `notification_history`
Audit log of all sent notifications for compliance and debugging.

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| userId | UUID | Recipient user ID |
| eventType | string | Type of notification sent |
| channel | enum | Channel used (sms, email, etc.) |
| recipient | string | Phone number or email address |
| status | enum | sent\|failed\|pending\|delivered\|bounced |
| messageId | string | Provider's message ID (AWS SNS ID, etc.) |
| message | text | Actual message sent |
| errorMessage | text | Error details if failed |
| metadata | json | Additional context |
| sentAt | datetime | When notification was sent |
| deliveredAt | datetime | When notification was delivered |

#### `user_notification_preferences`
User-specific notification preferences and settings.

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| userId | UUID | User who owns these preferences (unique) |
| channelsEnabled | json | Per-channel opt-in status |
| dndEnabled | boolean | Do Not Disturb mode enabled |
| dndStartTime | string | DND start time (HH:mm) |
| dndEndTime | string | DND end time (HH:mm) |
| eventPreferences | json | Per-event type opt-in status |

---

## Event Types

### User Events

```typescript
SIGNUP_SUCCESS        // User account created
LOGIN_OTP            // Login OTP sent
SIGNUP_OTP           // Signup OTP sent
UPDATE_PHONE_OTP     // Phone update OTP
PASSWORD_RESET       // Password reset initiated
ACCOUNT_LOCKED       // Account security lockout
```

### Order Events

```typescript
ORDER_PLACED         // Customer placed order
ORDER_CONFIRMED      // Seller/system confirmed order
ORDER_PROCESSING     // Order being prepared
ORDER_PACKED         // Order packed and ready
ORDER_SHIPPED        // Order handed to courier
ORDER_OUT_FOR_DELIVERY   // With last-mile delivery
ORDER_DELIVERED      // Delivered to customer
ORDER_CANCELLED      // Order cancelled by user/system
ORDER_FAILED         // Order processing failed
ORDER_RTO            // Return to Origin initiated
```

### Payment Events

```typescript
PAYMENT_SUCCESSFUL   // Payment received
PAYMENT_FAILED       // Payment declined/failed
REFUND_INITIATED     // Refund process started
REFUND_COMPLETED     // Refund processed
```

### Seller Events

```typescript
SELLER_APPROVED      // Seller account approved
SELLER_REJECTED      // Seller account rejected
PRODUCT_LISTED       // Product published
```

### Promotional Events

```typescript
PROMO_AVAILABLE      // Promotion available for user
SPECIAL_OFFER        // Special offer notification
```

---

## Channels

### SMS
- **Provider**: AWS SNS
- **Best For**: Time-sensitive notifications (OTP, order status)
- **Cost**: ~₹0.50-2 per SMS (varies by provider)
- **Latency**: 2-10 seconds
- **DLT Compliance**: Entity ID and template registration required

### Email
- **Provider**: Nodemailer / SendGrid (configurable)
- **Best For**: Detailed information, HTML content
- **Cost**: Free to ~$0.10 per email
- **Latency**: 5-30 seconds
- **Use Cases**: Order confirmation, receipts, newsletters

### WhatsApp
- **Provider**: WhatsApp Business API
- **Best For**: Rich media, interactive messages
- **Cost**: ~₹1-2 per message
- **Latency**: 5-15 seconds
- **Compliance**: Pre-approved templates required

### In-App
- **Storage**: Database
- **Best For**: Non-urgent updates, rich formatting
- **Latency**: Immediate (on next app sync)
- **Advantages**: Free, no external dependency

---

## Integration Guide

### 1. Initialize in Application Startup

```typescript
// src/app.ts
import { notificationRoutes, NotificationTemplate } from './modules/notifications';

// Add notification routes
app.use('/api/notifications', notificationRoutes);

// Optional: Sync notification tables on startup
await NotificationTemplate.sync();
```

### 2. Emit Events From Modules

```typescript
import { notificationEmitter } from './modules/notifications/services/notification-emitter';

// On user signup
notificationEmitter.emit('user.signup_success', {
  userId: user.id,
  email: user.email,
  phoneNumber: user.phone,
  firstName: user.name,
  platform: 'Portal'
});

// On order status change
notificationEmitter.emit('order.shipped', {
  customerId: order.customerId,
  phoneNumber: customer.phone,
  firstName: customer.name,
  orderId: order.id,
  orderNumber: order.orderNumber,
  trackingNumber: order.trackingNumber,
  carrierName: 'DHL'
});
```

### 3. Create Notification Templates

```bash
# Via API
POST /api/notifications/admin/templates
{
  "eventType": "order_shipped",
  "channel": "sms",
  "title": "Order {{orderNumber}} Shipped",
  "body": "Your order has shipped! Track: {{trackingLink}}",
  "placeholders": ["orderNumber", "trackingLink"],
  "platformsAllowed": ["Portal", "Website"],
  "isActive": true
}
```

### 4. Configure AWS SNS

```bash
# .env file
AWS_REGION=ap-south-1
AWS_SMS_ENTITY_ID=your_entity_id
AWS_SNS_EMAIL_TOPIC_ARN=arn:aws:sns:ap-south-1:xxx:email-topic
AWS_SMS_ORIGINATION_ID=your_origination_id
```

---

## API Endpoints

### User Endpoints

#### Get Notification History
```
GET /api/notifications/history?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": { "total": 150, "page": 1, "limit": 20, "pages": 8 }
  }
}
```

#### Get Notification Statistics
```
GET /api/notifications/stats?startDate=2026-04-01&endDate=2026-04-11
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 250,
    "sent": 245,
    "failed": 3,
    "pending": 2,
    "successRate": 98
  }
}
```

#### Get User Preferences
```
GET /api/notifications/preferences
```

#### Update User Preferences
```
PUT /api/notifications/preferences
{
  "channelsEnabled": { "sms": true, "email": false, "whatsapp": true, "in_app": true },
  "dndEnabled": true,
  "dndStartTime": "22:00",
  "dndEndTime": "08:00",
  "eventPreferences": { "order_placed": true, "promo_available": false }
}
```

### Admin Endpoints

#### Get All Templates
```
GET /api/notifications/admin/templates?eventType=order_shipped
```

#### Create Template
```
POST /api/notifications/admin/templates
```

#### Update Template
```
PUT /api/notifications/admin/templates/:templateId
```

#### Delete Template
```
DELETE /api/notifications/admin/templates/:templateId
```

---

## Placeholder System

Placeholders are automatically replaced in templates with actual data:

### Syntax
- Named: `{{fieldName}}`
- Array: `{{0}}`, `{{1}}`, etc.

### Available Placeholders
| Placeholder | Value |
|------------|-------|
| `{{firstName}}` | User's first name |
| `{{lastName}}` | User's last name |
| `{{email}}` | User's email |
| `{{phoneNumber}}` | User's phone number |
| `{{orderNumber}}` | Order reference number |
| `{{amount}}` | Order/payment amount |
| `{{trackingNumber}}` | Courier tracking number |
| `{{carrierName}}` | Delivery carrier name |
| `{{customData.*}}` | Any custom data passed in event |

### Example
Template: `"Hi {{firstName}}, your order {{orderNumber}} is worth ₹{{amount}}"`
Data: `{ firstName: "John", orderNumber: "ORD-2026-001", amount: 5000 }`
Result: `"Hi John, your order ORD-2026-001 is worth ₹5000"`

---

## Retry Logic & Error Handling

### Transient Errors (Auto-Retry)
- ThrottlingException
- TooManyRequestsException
- Timeout / NetworkingError
- HTTP 429, 503, 504

**Retry Strategy**: Exponential backoff (1s, 2s, 4s) up to 3 times

### Permanent Errors (No Retry)
- Invalid phone number format
- Number not on DND list
- Missing required fields
- Template not found

### Error Logging
All errors are logged with:
- User ID
- Event type
- Channel
- Error message
- Timestamp
- Retry attempt count

---

## Performance Considerations

### Scalability Features

1. **Database Indexes**
   - `notification_history(userId, createdAt)` - For user queries
   - `notification_history(eventType, status)` - For analytics
   - `notification_templates(eventType)` - For template lookups

2. **Async Processing**
   - All notifications sent asynchronously
   - Non-blocking event emission
   - Queue support ready (can integrate Bull, RabbitMQ)

3. **Caching Opportunities**
   - Cache templates in memory (refresh hourly)
   - Cache user preferences (TTL: 30 minutes)
   - Batch SMS sending for promotional campaigns

### Monitoring Queries

```sql
-- Get notification stats by event type
SELECT eventType, COUNT(*) as count, 
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM notification_history
WHERE createdAt > NOW() - INTERVAL '24 hours'
GROUP BY eventType;

-- Find failed notifications needing manual review
SELECT * FROM notification_history
WHERE status = 'failed'
AND createdAt > NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;

-- Get user engagement metrics
SELECT COUNT(DISTINCT userId) as unique_recipients,
       COUNT(*) as total_sent
FROM notification_history
WHERE createdAt > NOW() - INTERVAL '30 days';
```

---

## Testing

### Manual Testing

```typescript
import { notificationEmitter } from './modules/notifications/services/notification-emitter';

// Test SMS notification
notificationEmitter.emit('order.placed', {
  customerId: 'test-user-id',
  phoneNumber: '+919876543210',
  firstName: 'Test',
  orderId: 'test-order-id',
  orderNumber: 'TEST-001',
  amount: 1000,
  itemCount: 2
});
```

### Checking Notification Status

```bash
# View notification history
curl http://localhost:3000/api/notifications/history

# Check stats
curl http://localhost:3000/api/notifications/stats

# Verify templates
curl http://localhost:3000/api/notifications/admin/templates
```

---

## AWS SNS Configuration

### Prerequisites
1. AWS Account with SNS access
2. SMS origination ID registered
3. DLT entity and template approval for India (TRAI compliant)

### Setup Steps

1. **Register DLT Entity**
   - Entity name: Your business name
   - Entity category: Ecommerce, IT, etc.
   - Submit for verification (24-48 hours)

2. **Create SMS Template**
   - Template content with placeholders
   - Get template ID from AWS

3. **Configure Credentials**
   ```env
   AWS_REGION=ap-south-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_SMS_ENTITY_ID=entity_id
   AWS_SMS_ORIGINATION_ID=origination_id
   ```

### SNS Message Attributes

```typescript
MessageAttributes: {
  'AWS.MM.SMS.TemplateId': { 
    DataType: 'String', 
    StringValue: 'template_id' 
  },
  'AWS.MM.SMS.EntityId': { 
    DataType: 'String', 
    StringValue: 'entity_id' 
  }
}
```

---

## Compliance & Best Practices

### Legal Requirements (India)

- ✅ Entity and template registration with TRAI
- ✅ Do Not Disturb (DND) hours respect (9 PM - 9 AM)
- ✅ Opt-in management for users
- ✅ Sender ID must be registered
- ✅ Unsubscribe link in promotional SMS

### Best Practices

1. **Timing**
   - Send transactional notifications immediately (OTP, order status)
   - Send promotional SMS during business hours
   - Respect DND preferences

2. **Content**
   - Keep SMS under 160 characters (1 unit)
   - Clear call-to-action for promotions
   - Include support contact for complaints

3. **Frequency**
   - Order notifications: as they happen
   - Promotional: max 2-3 per week
   - OTP: only when requested by user

4. **Monitoring**
   - Track delivery rates (target > 95%)
   - Monitor bounce rates
   - Set alerts for high failure rates

---

## Troubleshooting

### Issue: SMS not sending

**Check:**
1. Phone number format: must be +91XXXXXXXXXX
2. AWS credentials valid: `aws sns describe-account-attributes`
3. Entity/template registered with TRAI
4. DLT verification status: check SMS delivery logs

### Issue: High failure rate

**Solution:**
1. Verify phone number validation logic
2. Check DND mode settings
3. Review AWS SNS throttling limits
4. Check error messages in notification_history table

### Issue: Notifications delayed

**Causes:**
1. AWS SNS throttling (handle with exponential backoff - already implemented)
2. Database query slowness (check indexes)
3. Network issues (logs in notification_history)

---

## Future Enhancements

### Roadmap

- [ ] **Message Queue Integration** - Bull/RabbitMQ for better scalability
- [ ] **AI-Based Timing** - Send at optimal times based on user behavior
- [ ] **A/B Testing** - Test different message variants
- [ ] **Analytics Dashboard** - Real-time notification metrics
- [ ] **Batch Processing** - Group similar notifications
- [ ] **Webhook Support** - Third-party provider integrations
- [ ] **Two-Way SMS** - Receive responses from customers
- [ ] **Rich Media** - Images, videos in WhatsApp/Email
- [ ] **Multi-Language** - Localized notifications
- [ ] **ML Spam Detection** - Filter spam/unwanted content

---

## Support & Documentation

### Files Reference

- **Implementation Guide**: `IMPLEMENTATION_GUIDE.ts` - Integration examples
- **Types**: `types.ts` - All TypeScript interfaces
- **Models**: `models.ts` - Database schema
- **Services**: `services/*.ts` - Core logic

### External Resources

- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [TRAI DND Guidelines](https://www.trai.gov.in/)
- [SMS Best Practices](https://docs.aws.amazon.com/sns/latest/dg/SMSMessages.html)

---

## License

This notification system is part of the SapPay platform and follows the project's license.

---

**Last Updated**: April 11, 2026
**Version**: 1.0.0
**Status**: Production-Ready
