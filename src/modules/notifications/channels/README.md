# Notification Channels Organization

This directory contains all notification channel implementations. Each channel is independently organized for easy maintenance and management.

## 📁 Folder Structure

```
channels/
├── sms/                    # SMS Notifications via AWS SNS
│   ├── services/
│   │   ├── aws-sns.service.ts
│   │   └── index.ts
│   └── index.ts
├── whatsapp/               # WhatsApp Notifications via Meta API
│   ├── services/
│   │   ├── whatsapp.service.ts
│   │   └── index.ts
│   └── index.ts
├── email/                  # Email Notifications (Provider agnostic)
│   ├── services/
│   │   ├── email.service.ts
│   │   └── index.ts
│   └── index.ts
├── in-app/                 # In-App Notifications (Database stored)
│   ├── services/
│   │   ├── in-app.service.ts
│   │   └── index.ts
│   └── index.ts
└── index.ts                # Central export point
```

## 🔧 Channel Details

### SMS Channel (`sms/`)
**Service:** AWS SNS  
**Provider:** Amazon Web Services  
**Status:** Production Ready  
**Methods:**
- `sendSMS(phoneNumber, message, templateId?)` - Send SMS with optional template ID
- `sendEmail(email, subject, message, htmlContent?)` - Send email via SNS topic
- `validatePhoneNumber()` - Validate phone format (E.164)
- `isTransientError()` - Determine if error should retry
- `healthCheck()` - Verify SNS connectivity

**Configuration (`.env`):**
```
NOTIFICATION_CHANNEL=sms
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SMS_ORIGINATION_ID=your_origination_id
AWS_SNS_EMAIL_TOPIC_ARN=optional_email_topic_arn
AWS_SMS_ENTITY_ID=your_entity_id
```

### WhatsApp Channel (`whatsapp/`)
**Service:** Meta Cloud API v18.0  
**Provider:** Meta (Facebook)  
**Status:** Production Ready  
**Methods:**
- `sendMessage(phoneNumber, message, templateParams?)` - Send text message
- `sendTemplateMessage(phoneNumber, templateName, languageCode?, parameters?)` - Send approved template
- `validatePhoneNumber()` - Validate phone format (E.164)
- `isTransientError()` - Determine if error should retry
- `healthCheck()` - Verify WhatsApp API connectivity
- `getStatus()` - Get service configuration info

**Configuration (`.env`):**
```
NOTIFICATION_CHANNEL=whatsapp
WHATSAPP_BASE_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TOKEN=your_waba_token
```

### Email Channel (`email/`)
**Service:** Provider Agnostic Stub  
**Status:** Stub - Ready for Integration  
**Supported Providers:** SendGrid, AWS SES, Mailgun, etc.  
**Methods:**
- `sendEmail(email, subject, htmlContent, textContent?)` - Send email
- `validateEmail()` - Validate email format
- `healthCheck()` - Verify email service connectivity
- `getStatus()` - Get service configuration info

**Configuration (`.env`):**
```
NOTIFICATION_CHANNEL=email
EMAIL_PROVIDER=sendgrid|aws-ses|mailgun|custom
# Provider-specific configs here
```

**Integration Guide:**
1. Update `emailService` class with provider-specific implementation
2. Add provider credentials to `.env`
3. Test with `sendEmail()` method
4. Common providers: SendGrid, AWS SES, Nodemailer

### In-App Channel (`in-app/`)
**Service:** Database Stored Notifications  
**Status:** Stub - Ready for Database Integration  
**Methods:**
- `createNotification(userId, title, message, data?)` - Create in-app notification
- `markAsRead(notificationId, userId)` - Mark notification as read
- `deleteNotification(notificationId, userId)` - Delete notification
- `getUnreadNotifications(userId, limit?)` - Fetch unread notifications
- `healthCheck()` - Verify service status
- `getStatus()` - Get service configuration info

**Configuration (`.env`):**
```
NOTIFICATION_CHANNEL=in_app
IN_APP_NOTIFICATIONS_ENABLED=true
```

**Integration Guide:**
1. Create/update `Notification` model in database
2. Implement database queries in `inAppService`
3. Consider WebSocket integration for real-time notifications
4. Add API endpoints for fetching/managing notifications

## 🔄 How It Works

1. **Single Channel Mode:**
   - Only ONE channel is active at a time
   - Controlled by `NOTIFICATION_CHANNEL` environment variable
   - Set to: `sms`, `email`, `whatsapp`, or `in_app`

2. **Channel Selection:**
   - Happens at application startup (via `config/index.ts`)
   - Affects all notifications sent during the session
   - No runtime switching (restart required)

3. **Notification Flow:**
   ```
   sendNotification() 
   → Gets active channel from config
   → Loads template for event type + channel
   → Routes to appropriate service
   → Returns result with channel-specific details
   ```

## 📦 Imports

**From main notifications module:**
```typescript
import { awsSNSService, whatsappService, emailService, inAppService } from '@modules/notifications';
```

**From specific channel:**
```typescript
import { awsSNSService } from '@modules/notifications/channels/sms';
import { whatsappService } from '@modules/notifications/channels/whatsapp';
```

**Direct service access:**
```typescript
import { notificationService } from '@modules/notifications/services/notification.service';
```

## 🚀 Adding a New Channel

1. Create new folder: `channels/your-channel/`
2. Create service file: `channels/your-channel/services/your-channel.service.ts`
3. Create index files:
   - `channels/your-channel/services/index.ts`
   - `channels/your-channel/index.ts`
4. Implement required methods (based on other channel services)
5. Export service in `channels/index.ts`
6. Update `notification.service.ts` to support new channel
7. Add templates in database for new channel

## 🔍 Best Practices

- ✅ Each channel is self-contained and independent
- ✅ Use existing channel structure as template for new channels
- ✅ Implement health checks for reliability monitoring
- ✅ Add comprehensive error handling and logging
- ✅ Validate all inputs (phone numbers, emails, etc.)
- ✅ Implement retry logic with exponential backoff for transient errors
- ✅ Keep configuration secrets in `.env`, not in code
- ✅ Write unit tests for channel-specific logic

## 🧪 Testing a Channel

```typescript
// Import the channel service
import { whatsappService } from '@modules/notifications/channels/whatsapp';

// Test basic methods
const messageId = await whatsappService.sendMessage('+919876543210', 'Test message');
console.log('Message sent:', messageId);

// Check health
const isHealthy = await whatsappService.healthCheck();
console.log('Service healthy:', isHealthy);

// Get status
const status = whatsappService.getStatus();
console.log('Service status:', status);
```

## 📝 Channel Service Template

When creating a new channel, follow this template:

```typescript
import logger from '../../../../../utils/logger';

class YourChannelService {
    constructor() {
        // Initialize service
    }

    async send(recipient: string, message: string): Promise<string | null> {
        try {
            // Validate input
            // Make API call
            // Log success
            return messageId;
        } catch (error: any) {
            // Log error
            throw error;
        }
    }

    private validate(input: string): boolean {
        // Validate format
        return true;
    }

    private isTransientError(error: any): boolean {
        // Check if error is transient (should retry)
        return false;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async healthCheck(): Promise<boolean> {
        try {
            // Test service connectivity
            return true;
        } catch (error: any) {
            logger.error('Health check failed', { error: error.message });
            return false;
        }
    }

    getStatus(): any {
        return {
            isConfigured: true,
            // Add relevant status info
        };
    }
}

export const yourChannelService = new YourChannelService();
```

## 📊 Channel Comparison

| Feature | SMS | WhatsApp | Email | In-App |
|---------|-----|----------|-------|--------|
| Speed | Fast | Medium | Slow | Instant |
| Cost | Medium | Low | Low | Free |
| Provider | AWS SNS | Meta | Configurable | Database |
| Status | ✅ Active | ✅ Active | 🔧 Stub | 🔧 Stub |
| Retry Logic | ✅ Yes | ✅ Yes | ⚠️ Partial | ⚠️ Partial |
| Real-time | ❌ No | ✅ Yes | ❌ No | ✅ Yes |

## 🔗 Related Files

- **Main notification service:** `../services/notification.service.ts`
- **Notification types:** `../types.ts`
- **Configuration:** `../../../config/index.ts`
- **Database models:** `../models.ts`
- **Examples:** `../examples.ts`

---

For questions or to add a new channel, refer to existing implementations as templates!
