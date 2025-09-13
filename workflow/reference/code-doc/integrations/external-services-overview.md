# External Services and Integrations Overview

## Introduction

MedBookings integrates with several external services to provide comprehensive healthcare booking functionality. This document covers all external integrations, their configurations, implementation patterns, and business logic.

## Integration Architecture

### Service Categories

```
External Services:
├── Authentication & OAuth
│   └── Google OAuth (NextAuth.js)
├── Communication Services
│   ├── SendGrid (Email)
│   ├── Twilio (SMS & WhatsApp)
│   └── Vercel Blob (File Storage)
├── Calendar Integration
│   ├── Google Calendar API
│   └── Google Meet Integration
├── Location Services
│   ├── Google Maps API
│   └── Google Places API
├── Payment Processing
│   └── Stripe (Payment & Subscriptions)
└── Development & Monitoring
    ├── Vercel (Hosting & Deployment)
    └── PostgreSQL (Database)
```

### Integration Patterns

1. **OAuth Flow**: Secure authentication and authorization
2. **API Wrappers**: Centralized service integration logic
3. **Webhook Handling**: Real-time event processing
4. **Error Handling**: Graceful degradation and retry logic
5. **Environment Configuration**: Secure credential management

## Core Integrations

## 1. Google Services Integration

### Google OAuth Authentication

**Purpose**: Secure user authentication and service authorization
**Implementation**: NextAuth.js with Google Provider
**Location**: `src/lib/auth.ts`

#### Configuration
```typescript
// NextAuth.js Google Provider Setup
GoogleProvider({
  clientId: env.GOOGLE_CLIENT_ID!,
  clientSecret: env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

#### Required Environment Variables
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_auth_secret
NEXTAUTH_URL=https://your-domain.com
```

#### Features
- **Single Sign-On**: Users authenticate with Google accounts
- **Offline Access**: Refresh tokens for background operations
- **Profile Integration**: Access to user's Google profile information
- **Service Authorization**: Calendar and Meet permissions

### Google Calendar Integration

**Purpose**: Bidirectional calendar synchronization and conflict management
**Implementation**: Google Calendar API v3
**Location**: `src/app/api/auth/google/calendar/`

#### OAuth Scopes Required
```javascript
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
```

#### Key Features

##### Bidirectional Sync
- **Import External Events**: Block availability based on existing calendar events
- **Export Bookings**: Create calendar events for confirmed bookings
- **Conflict Detection**: Prevent double-booking across calendars
- **Real-time Updates**: Webhook-based synchronization

##### Calendar Event Management
```typescript
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: 'hangoutsMeet' };
    };
  };
}
```

##### Google Meet Integration
- **Automatic Meet Links**: Generate Google Meet links for online appointments
- **Meeting Rooms**: Create dedicated meeting spaces
- **Calendar Integration**: Meet links embedded in calendar events

#### Implementation Pattern
```typescript
// Calendar Service Authentication
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.NEXTAUTH_URL}/api/auth/google/calendar/callback`
);

// Calendar API Usage
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
```

### Google Maps & Places Integration

**Purpose**: Location services for organizations and appointment venues
**Implementation**: Google Maps JavaScript API and Places API
**Location**: `src/features/organizations/components/google-maps-location-picker.tsx`

#### Features
- **Address Autocomplete**: Smart address input with suggestions
- **Location Validation**: Verify and standardize addresses
- **Geocoding**: Convert addresses to coordinates
- **Place Details**: Retrieve business information and photos

#### Implementation
```typescript
interface LocationData {
  name: string;
  formattedAddress: string;
  googlePlaceId: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  website?: string;
  businessHours?: string[];
}
```

## 2. Communication Services

### SendGrid Email Integration

**Purpose**: Transactional email delivery system
**Implementation**: SendGrid Web API v3
**Location**: `src/features/communications/lib/server-helper.ts`

#### Configuration
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(env.SENDGRID_API_KEY!);
```

#### Email Types

##### Transactional Emails
- **Booking Confirmations**: Appointment confirmation emails
- **Booking Reminders**: 24h and 2h before appointment
- **Booking Changes**: Updates and cancellations
- **System Notifications**: Account verification, password reset

##### Template System
```typescript
interface EmailTemplate {
  templateId: string;
  personalizations: Array<{
    to: Array<{ email: string; name?: string }>;
    dynamic_template_data: Record<string, any>;
  }>;
  from: { email: string; name: string };
  reply_to?: { email: string; name: string };
}
```

#### Features
- **Dynamic Templates**: Variable substitution in email templates
- **Delivery Tracking**: Open rates, click tracking, bounce handling
- **Personalization**: User-specific content and branding
- **Batch Sending**: Efficient bulk email delivery

### Twilio Communication Platform

**Purpose**: SMS and WhatsApp messaging for notifications
**Implementation**: Twilio REST API
**Location**: `src/features/communications/lib/server-helper.ts`

#### Configuration
```typescript
import twilio from 'twilio';

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
```

#### SMS Messaging
- **Appointment Reminders**: Automated SMS reminders
- **Booking Confirmations**: Instant SMS confirmations
- **Status Updates**: Real-time notification of changes
- **Two-Way SMS**: Support for reply handling

#### WhatsApp Business Integration
```typescript
// WhatsApp Template Message
await twilioClient.messages.create({
  from: `whatsapp:${TwilioWhatsappNumber}`,
  contentSid: 'HX7b7542c849bf762b63fc38dcb069f6f1',
  contentVariables: JSON.stringify({
    1: providerName,
    2: appointmentTime,
    3: patientName,
    4: bookingId,
  }),
  to: `whatsapp:${recipientNumber}`,
});
```

##### WhatsApp Features
- **Rich Media Messages**: Images, documents, vCards
- **Template Messages**: Pre-approved message templates
- **Interactive Messages**: Buttons, quick replies, lists
- **Business Profile**: Professional business presence

#### Message Types

##### Provider Notifications
- **New Booking**: Immediate notification of new appointments
- **Booking Confirmation**: Provider confirmation with patient details
- **Schedule Reminders**: Availability and scheduling prompts

##### Patient Communications
- **Booking Confirmations**: Appointment details and instructions
- **Appointment Reminders**: Scheduled reminder messages
- **Status Updates**: Changes, cancellations, or confirmations

#### vCard Integration
```typescript
// Generate vCard for contact sharing
import vCardsJS from 'vcards-js';

const vCard = vCardsJS();
vCard.firstName = patientName;
vCard.workPhone = patientPhone;
vCard.email = patientEmail;

// Upload to Vercel Blob and share via WhatsApp
const { url } = await put(`vcards/patient-${bookingId}.vcf`, vCard.getFormattedString(), {
  access: 'public',
  contentType: 'text/vcard',
});
```

## 3. File Storage and CDN

### Vercel Blob Storage

**Purpose**: File storage for documents, images, and generated content
**Implementation**: Vercel Blob API
**Usage**: Document storage, vCard generation, image hosting

#### Features
- **Public/Private Storage**: Flexible access control
- **CDN Distribution**: Global content delivery
- **File Versioning**: Version control for documents
- **Automatic Optimization**: Image and document optimization

#### Implementation
```typescript
import { put, del } from '@vercel/blob';

// Upload file
const { url } = await put('documents/provider-license.pdf', fileBuffer, {
  access: 'private',
  contentType: 'application/pdf',
});

// Generate public vCard
const { url: vCardUrl } = await put(`vcards/contact-${id}.vcf`, vCardContent, {
  access: 'public',
  contentType: 'text/vcard',
});
```

## 4. Payment Processing

### Stripe Integration

**Purpose**: Payment processing and subscription management
**Implementation**: Stripe API v3
**Status**: Configured but not fully implemented

#### Planned Features
- **Subscription Billing**: Monthly/annual subscription plans
- **Usage-Based Billing**: Pay-per-slot or pay-per-booking
- **Payment Processing**: Secure card processing
- **Billing Management**: Invoices, receipts, payment history

#### Configuration Structure
```typescript
interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  products: {
    basicPlan: string;
    proPlan: string;
    enterprisePlan: string;
  };
}
```

## 5. Development and Infrastructure

### Vercel Platform

**Purpose**: Hosting, deployment, and serverless functions
**Features**:
- **Next.js Hosting**: Optimized Next.js deployment
- **Serverless Functions**: API route handling
- **Edge Functions**: Global request processing
- **Preview Deployments**: Branch-based previews
- **Analytics**: Performance monitoring

### PostgreSQL Database

**Purpose**: Primary data storage via Prisma ORM
**Features**:
- **Connection Pooling**: Efficient database connections
- **Read Replicas**: Scalable read operations
- **Backup Management**: Automated backup and recovery
- **Performance Monitoring**: Query performance tracking

## Integration Security

### Authentication & Authorization

#### OAuth 2.0 Flow
1. **Authorization Request**: Redirect to provider
2. **User Consent**: User grants permissions
3. **Authorization Code**: Provider returns code
4. **Token Exchange**: Exchange code for access token
5. **API Access**: Use token for API calls

#### Token Management
```typescript
interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: 'Bearer';
  scope: string[];
}
```

### API Security

#### Environment Variables
All sensitive credentials stored as environment variables:
```bash
# Authentication
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=

# Communications
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Storage
BLOB_READ_WRITE_TOKEN=

# Database
DATABASE_URL=
```

#### Rate Limiting
- **API Quotas**: Respect third-party API limits
- **Request Throttling**: Prevent abuse and overuse
- **Retry Logic**: Exponential backoff for failed requests

#### Error Handling
```typescript
interface ServiceError {
  service: string;
  operation: string;
  error: Error;
  retryable: boolean;
  timestamp: Date;
}
```

## Webhook Management

### Google Calendar Webhooks
- **Event Changes**: Real-time calendar event notifications
- **Conflict Detection**: Automatic availability blocking
- **Sync Updates**: Bidirectional synchronization

### Twilio Status Callbacks
- **Message Status**: Delivery, read, and failure notifications
- **Error Handling**: Failed message retry logic
- **Analytics**: Message performance tracking

### Implementation Pattern
```typescript
// Webhook endpoint structure
export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-webhook-signature');
    if (!verifyWebhookSignature(signature, body)) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Process webhook event
    await processWebhookEvent(eventData);
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

## Monitoring and Observability

### Service Health Monitoring
- **API Availability**: Monitor third-party service uptime
- **Response Times**: Track API performance
- **Error Rates**: Monitor integration failure rates
- **Quota Usage**: Track API usage against limits

### Logging Strategy
```typescript
interface IntegrationLog {
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}
```

### Alerting
- **Service Outages**: Immediate notification of service failures
- **Quota Limits**: Alerts when approaching API limits
- **Error Spikes**: Notification of unusual error rates
- **Performance Degradation**: Slow response time alerts

## Development Guidelines

### Adding New Integrations

#### 1. Service Configuration
```typescript
// Add to environment schema
server: {
  // existing vars...
  NEW_SERVICE_API_KEY: z.string(),
  NEW_SERVICE_BASE_URL: z.string().url(),
}
```

#### 2. Create Service Client
```typescript
// src/lib/integrations/new-service.ts
class NewServiceClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: NewServiceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  async makeRequest(endpoint: string, options: RequestOptions) {
    // Implementation with error handling, retries, logging
  }
}
```

#### 3. Add Server Actions
```typescript
// src/features/[feature]/lib/actions.ts
export async function callNewService(data: ServiceData) {
  try {
    const client = new NewServiceClient(config);
    const result = await client.makeRequest('/endpoint', { data });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### 4. Add tRPC Endpoints
```typescript
// src/server/api/routers/[feature].ts
newServiceOperation: protectedProcedure
  .input(serviceInputSchema)
  .mutation(async ({ ctx, input }) => {
    const result = await callNewService(input);
    if (!result.success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: result.error,
      });
    }
    return result.data;
  })
```

### Testing Integrations

#### Mock Services
- **Development Environment**: Use mock services for development
- **Test Environment**: Sandbox APIs for testing
- **Integration Tests**: End-to-end testing with real APIs

#### Error Scenarios
- **Network Failures**: Test timeout and connection errors
- **API Errors**: Test 4xx and 5xx response handling
- **Rate Limiting**: Test quota exceeded scenarios
- **Authentication Failures**: Test token expiration and refresh

### Best Practices

#### 1. Error Handling
- **Graceful Degradation**: System continues to function with limited features
- **User-Friendly Messages**: Clear error messages for users
- **Automatic Retry**: Exponential backoff for transient errors

#### 2. Performance
- **Connection Pooling**: Reuse connections where possible
- **Caching**: Cache responses when appropriate
- **Batch Operations**: Combine multiple operations when supported

#### 3. Security
- **Credential Management**: Secure storage of API keys and tokens
- **Request Validation**: Validate all incoming webhook payloads
- **Access Control**: Limit API access to necessary scopes

#### 4. Monitoring
- **Comprehensive Logging**: Log all integration interactions
- **Metrics Collection**: Track performance and error metrics
- **Health Checks**: Regular verification of service availability

This comprehensive integration overview provides the foundation for understanding how MedBookings connects with external services and how to extend the platform with new integrations.