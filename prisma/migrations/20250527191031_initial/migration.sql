-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ServiceProviderStatus" AS ENUM ('PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'TRIAL', 'TRIAL_EXPIRED', 'ACTIVE', 'PAYMENT_OVERDUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('BASE', 'WEBSITE_HOSTING', 'REVIEW_PROMOTION', 'PREMIUM_ANALYTICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Languages" AS ENUM ('English', 'IsiZulu', 'IsiXhosa', 'Afrikaans', 'Sepedi', 'Setswana', 'Sesotho', 'IsiNdebele', 'SiSwati', 'Tshivenda', 'Xitsonga', 'Portuguese', 'French', 'Hindi', 'German', 'Mandarin');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('MEDICAL_AID_ONLY', 'PRIVATE_ONLY', 'MEDICAL_AID_AND_PRIVATE', 'ALL');

-- CreateEnum
CREATE TYPE "OrganizationBillingModel" AS ENUM ('CONSOLIDATED', 'PER_LOCATION', 'HYBRID');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'TRIAL', 'TRIAL_EXPIRED', 'ACTIVE', 'PAYMENT_OVERDUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "OrganizationPermission" AS ENUM ('MANAGE_PROVIDERS', 'MANAGE_BOOKINGS', 'MANAGE_LOCATIONS', 'MANAGE_STAFF', 'VIEW_ANALYTICS', 'MANAGE_BILLING', 'RESPOND_TO_MESSAGES', 'MANAGE_AVAILABILITY');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MembershipChangeType" AS ENUM ('CREATED', 'ROLE_CHANGED', 'PERMISSIONS_CHANGED', 'STATUS_CHANGED', 'DELETED', 'INVITATION_SENT', 'INVITATION_ACCEPTED', 'INVITATION_REJECTED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BillingEntity" AS ENUM ('ORGANIZATION', 'LOCATION', 'PROVIDER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "RequirementValidationType" AS ENUM ('BOOLEAN', 'DOCUMENT', 'TEXT', 'DATE', 'FUTURE_DATE', 'PAST_DATE', 'NUMBER', 'PREDEFINED_LIST');

-- CreateEnum
CREATE TYPE "RequirementsValidationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'BLOCKED', 'INVALID');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_REMINDER', 'BOOKING_CANCELLATION', 'BOOKING_MODIFICATION');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CalendarEventSyncStatus" AS ENUM ('SYNCED', 'PENDING_SYNC', 'SYNC_FAILED', 'CONFLICT_DETECTED', 'EXTERNAL_DELETED');

-- CreateEnum
CREATE TYPE "CalendarSyncDirection" AS ENUM ('IMPORT_ONLY', 'EXPORT_ONLY', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "CalendarSyncOperationType" AS ENUM ('FULL_SYNC', 'INCREMENTAL_SYNC', 'WEBHOOK_SYNC', 'MANUAL_SYNC', 'CONFLICT_RESOLUTION');

-- CreateEnum
CREATE TYPE "CalendarSyncSource" AS ENUM ('MEDBOOKINGS', 'GOOGLE_CALENDAR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CalendarSyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'CONFLICT_DETECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CalendarEntityType" AS ENUM ('BOOKING', 'CALENDAR_EVENT', 'AVAILABILITY_SLOT');

-- CreateEnum
CREATE TYPE "ConflictResolution" AS ENUM ('GOOGLE_WINS', 'MEDBOOKINGS_WINS', 'MANUAL_REVIEW', 'LATEST_WINS');

-- CreateEnum
CREATE TYPE "MeetSessionStatus" AS ENUM ('SCHEDULED', 'STARTED', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'FLAGGED', 'SYNCED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "whatsapp" TEXT,
    "whatsappVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProviderType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProviderType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceProviderTypeId" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT NOT NULL,
    "languages" "Languages"[],
    "website" TEXT,
    "email" TEXT NOT NULL DEFAULT 'default@example.com',
    "whatsapp" TEXT NOT NULL DEFAULT '+1234567890',
    "status" "ServiceProviderStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "trialStarted" TIMESTAMP(3),
    "trialEnded" TIMESTAMP(3),
    "trialStatus" "TrialStatus",
    "paymentMethodAdded" BOOLEAN NOT NULL DEFAULT false,
    "trialReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "trialConversionDate" TIMESTAMP(3),
    "selfPaidBookingsEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "billingModel" "OrganizationBillingModel" NOT NULL DEFAULT 'CONSOLIDATED',
    "trialStarted" TIMESTAMP(3),
    "trialEnded" TIMESTAMP(3),
    "trialStatus" "TrialStatus",
    "paymentMethodAdded" BOOLEAN NOT NULL DEFAULT false,
    "trialReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "trialConversionDate" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "permissions" "OrganizationPermission"[],
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "membershipId" TEXT,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "permissions" "OrganizationPermission"[],
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembershipHistory" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "changeType" "MembershipChangeType" NOT NULL,
    "oldRole" "OrganizationRole",
    "newRole" "OrganizationRole",
    "oldPermissions" "OrganizationPermission"[],
    "newPermissions" "OrganizationPermission"[],
    "oldStatus" "MembershipStatus",
    "newStatus" "MembershipStatus",
    "changedById" TEXT NOT NULL,
    "changeReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMembershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "formattedAddress" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "addressComponents" JSONB NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'South Africa',
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProviderConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "defaultBilledBy" "BillingEntity" NOT NULL DEFAULT 'ORGANIZATION',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationProviderConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "locationId" TEXT,
    "serviceProviderId" TEXT,
    "status" "SubscriptionStatus" NOT NULL,
    "type" "SubscriptionType" NOT NULL DEFAULT 'BASE',
    "planId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentMonthSlots" INTEGER NOT NULL DEFAULT 0,
    "billingCycleStart" TIMESTAMP(3) NOT NULL,
    "billingCycleEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "interval" "BillingInterval" NOT NULL,
    "includedSlots" INTEGER NOT NULL DEFAULT 30,
    "tierPricing" JSONB NOT NULL,
    "features" JSONB,
    "maxProviders" INTEGER,
    "maxLocations" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "slotDate" TIMESTAMP(3) NOT NULL,
    "slotStatus" "SlotStatus" NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tierUsed" INTEGER NOT NULL,
    "priceCharged" DECIMAL(10,2) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "baseAmount" DECIMAL(10,2),
    "usageAmount" DECIMAL(10,2),
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "stripePaymentId" TEXT,
    "stripeInvoiceId" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "slotsCovered" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "validationType" "RequirementValidationType" NOT NULL,
    "validationConfig" JSONB,
    "displayPriority" INTEGER NOT NULL DEFAULT 0,
    "serviceProviderTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementSubmission" (
    "id" TEXT NOT NULL,
    "requirementTypeId" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "status" "RequirementsValidationStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT,
    "documentMetadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceProviderTypeId" TEXT NOT NULL,
    "displayPriority" INTEGER NOT NULL DEFAULT 0,
    "defaultDuration" INTEGER NOT NULL,
    "defaultPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAvailabilityConfig" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isOnlineAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isInPerson" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAvailabilityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "organizationId" TEXT,
    "locationId" TEXT,
    "connectionId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByMembershipId" TEXT,
    "isProviderCreated" BOOLEAN NOT NULL DEFAULT false,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "billingEntity" "BillingEntity",
    "defaultSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculatedAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceConfigId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "lastCalculated" TIMESTAMP(3) NOT NULL,
    "billedToSubscriptionId" TEXT,
    "blockedByEventId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalculatedAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "slotId" TEXT,
    "createdById" TEXT,
    "createdByMembershipId" TEXT,
    "isProviderCreated" BOOLEAN NOT NULL DEFAULT false,
    "isGuestBooking" BOOLEAN NOT NULL DEFAULT false,
    "isGuestSelfBooking" BOOLEAN NOT NULL DEFAULT false,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "clientId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "guestWhatsapp" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isOnline" BOOLEAN NOT NULL,
    "isInPerson" BOOLEAN NOT NULL DEFAULT false,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "meetLink" TEXT,
    "calendarEventId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    "whatsappNumber" TEXT,
    "reminderHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "bookingReference" TEXT,
    "serviceProviderName" TEXT,
    "clientName" TEXT,
    "serviceName" TEXT,
    "appointmentTime" TIMESTAMP(3),
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarIntegration" (
    "id" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "calendarId" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "googleEmail" TEXT,
    "grantedScopes" TEXT[],
    "meetSettings" JSONB,
    "webhookChannelId" TEXT,
    "webhookResourceId" TEXT,
    "webhookExpiresAt" TIMESTAMP(3),
    "nextSyncToken" TEXT,
    "syncDirection" "CalendarSyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "blockingEventTypes" TEXT[],
    "autoCreateMeetLinks" BOOLEAN NOT NULL DEFAULT true,
    "backgroundSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "lastFullSyncAt" TIMESTAMP(3),
    "syncFailureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "calendarIntegrationId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "externalCalendarId" TEXT NOT NULL,
    "etag" TEXT,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT,
    "blocksAvailability" BOOLEAN NOT NULL DEFAULT true,
    "syncStatus" "CalendarEventSyncStatus" NOT NULL DEFAULT 'SYNCED',
    "lastModifiedInExternal" TIMESTAMP(3),
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails" TEXT,
    "conflictResolvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSyncOperation" (
    "id" TEXT NOT NULL,
    "calendarIntegrationId" TEXT NOT NULL,
    "operationType" "CalendarSyncOperationType" NOT NULL,
    "sourceSystem" "CalendarSyncSource" NOT NULL,
    "status" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING',
    "entityType" "CalendarEntityType" NOT NULL,
    "entityId" TEXT,
    "externalEventId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "conflictResolution" "ConflictResolution",
    "syncWindowStart" TIMESTAMP(3),
    "syncWindowEnd" TIMESTAMP(3),
    "eventsProcessed" INTEGER NOT NULL DEFAULT 0,
    "eventsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "eventsFailed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetSession" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "meetLink" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "joinCode" TEXT,
    "status" "MeetSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "response" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "googleReviewId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceToServiceProvider" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AvailabilityToServiceAvailabilityConfig" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProviderType_name_key" ON "ServiceProviderType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProvider_userId_key" ON "ServiceProvider"("userId");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_membershipId_key" ON "OrganizationInvitation"("membershipId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_idx" ON "OrganizationInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_token_idx" ON "OrganizationInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "OrganizationMembershipHistory_membershipId_createdAt_idx" ON "OrganizationMembershipHistory"("membershipId", "createdAt");

-- CreateIndex
CREATE INDEX "OrganizationMembershipHistory_changedById_createdAt_idx" ON "OrganizationMembershipHistory"("changedById", "createdAt");

-- CreateIndex
CREATE INDEX "OrganizationMembershipHistory_changeType_createdAt_idx" ON "OrganizationMembershipHistory"("changeType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Location_googlePlaceId_key" ON "Location"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");

-- CreateIndex
CREATE INDEX "Location_city_country_idx" ON "Location"("city", "country");

-- CreateIndex
CREATE INDEX "OrganizationProviderConnection_serviceProviderId_idx" ON "OrganizationProviderConnection"("serviceProviderId");

-- CreateIndex
CREATE INDEX "OrganizationProviderConnection_organizationId_idx" ON "OrganizationProviderConnection"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProviderConnection_organizationId_serviceProvid_key" ON "OrganizationProviderConnection"("organizationId", "serviceProviderId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_startDate_idx" ON "Subscription"("organizationId", "startDate");

-- CreateIndex
CREATE INDEX "UsageRecord_subscriptionId_billingCycle_idx" ON "UsageRecord"("subscriptionId", "billingCycle");

-- CreateIndex
CREATE INDEX "UsageRecord_processed_billingCycle_idx" ON "UsageRecord"("processed", "billingCycle");

-- CreateIndex
CREATE INDEX "UsageRecord_slotId_idx" ON "UsageRecord"("slotId");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_billingPeriodStart_idx" ON "Payment"("subscriptionId", "billingPeriodStart");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementSubmission_requirementTypeId_serviceProviderId_key" ON "RequirementSubmission"("requirementTypeId", "serviceProviderId");

-- CreateIndex
CREATE INDEX "Service_serviceProviderTypeId_displayPriority_idx" ON "Service"("serviceProviderTypeId", "displayPriority");

-- CreateIndex
CREATE INDEX "ServiceAvailabilityConfig_serviceProviderId_idx" ON "ServiceAvailabilityConfig"("serviceProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAvailabilityConfig_serviceId_serviceProviderId_key" ON "ServiceAvailabilityConfig"("serviceId", "serviceProviderId");

-- CreateIndex
CREATE INDEX "Availability_serviceProviderId_startTime_endTime_idx" ON "Availability"("serviceProviderId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Availability_organizationId_status_idx" ON "Availability"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Availability_connectionId_idx" ON "Availability"("connectionId");

-- CreateIndex
CREATE INDEX "Availability_billingEntity_organizationId_idx" ON "Availability"("billingEntity", "organizationId");

-- CreateIndex
CREATE INDEX "CalculatedAvailabilitySlot_availabilityId_serviceId_startTi_idx" ON "CalculatedAvailabilitySlot"("availabilityId", "serviceId", "startTime", "status");

-- CreateIndex
CREATE INDEX "CalculatedAvailabilitySlot_startTime_status_serviceId_idx" ON "CalculatedAvailabilitySlot"("startTime", "status", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");

-- CreateIndex
CREATE INDEX "Booking_slotId_status_idx" ON "Booking"("slotId", "status");

-- CreateIndex
CREATE INDEX "Booking_clientId_createdAt_idx" ON "Booking"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_createdByMembershipId_idx" ON "Booking"("createdByMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarIntegration_serviceProviderId_key" ON "CalendarIntegration"("serviceProviderId");

-- CreateIndex
CREATE INDEX "CalendarEvent_calendarIntegrationId_startTime_endTime_idx" ON "CalendarEvent"("calendarIntegrationId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_syncStatus_hasConflict_idx" ON "CalendarEvent"("syncStatus", "hasConflict");

-- CreateIndex
CREATE INDEX "CalendarEvent_lastSyncedAt_idx" ON "CalendarEvent"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_calendarIntegrationId_externalEventId_key" ON "CalendarEvent"("calendarIntegrationId", "externalEventId");

-- CreateIndex
CREATE INDEX "CalendarSyncOperation_calendarIntegrationId_status_idx" ON "CalendarSyncOperation"("calendarIntegrationId", "status");

-- CreateIndex
CREATE INDEX "CalendarSyncOperation_operationType_startedAt_idx" ON "CalendarSyncOperation"("operationType", "startedAt");

-- CreateIndex
CREATE INDEX "CalendarSyncOperation_status_retryCount_idx" ON "CalendarSyncOperation"("status", "retryCount");

-- CreateIndex
CREATE UNIQUE INDEX "MeetSession_bookingId_key" ON "MeetSession"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_serviceProviderId_status_idx" ON "Review"("serviceProviderId", "status");

-- CreateIndex
CREATE INDEX "Review_clientId_createdAt_idx" ON "Review"("clientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceToServiceProvider_AB_unique" ON "_ServiceToServiceProvider"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceToServiceProvider_B_index" ON "_ServiceToServiceProvider"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AvailabilityToServiceAvailabilityConfig_AB_unique" ON "_AvailabilityToServiceAvailabilityConfig"("A", "B");

-- CreateIndex
CREATE INDEX "_AvailabilityToServiceAvailabilityConfig_B_index" ON "_AvailabilityToServiceAvailabilityConfig"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_serviceProviderTypeId_fkey" FOREIGN KEY ("serviceProviderTypeId") REFERENCES "ServiceProviderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembershipHistory" ADD CONSTRAINT "OrganizationMembershipHistory_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembershipHistory" ADD CONSTRAINT "OrganizationMembershipHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProviderConnection" ADD CONSTRAINT "OrganizationProviderConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProviderConnection" ADD CONSTRAINT "OrganizationProviderConnection_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementType" ADD CONSTRAINT "RequirementType_serviceProviderTypeId_fkey" FOREIGN KEY ("serviceProviderTypeId") REFERENCES "ServiceProviderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementSubmission" ADD CONSTRAINT "RequirementSubmission_requirementTypeId_fkey" FOREIGN KEY ("requirementTypeId") REFERENCES "RequirementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementSubmission" ADD CONSTRAINT "RequirementSubmission_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementSubmission" ADD CONSTRAINT "RequirementSubmission_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_serviceProviderTypeId_fkey" FOREIGN KEY ("serviceProviderTypeId") REFERENCES "ServiceProviderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAvailabilityConfig" ADD CONSTRAINT "ServiceAvailabilityConfig_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAvailabilityConfig" ADD CONSTRAINT "ServiceAvailabilityConfig_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "OrganizationProviderConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_defaultSubscriptionId_fkey" FOREIGN KEY ("defaultSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatedAvailabilitySlot" ADD CONSTRAINT "CalculatedAvailabilitySlot_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatedAvailabilitySlot" ADD CONSTRAINT "CalculatedAvailabilitySlot_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatedAvailabilitySlot" ADD CONSTRAINT "CalculatedAvailabilitySlot_serviceConfigId_fkey" FOREIGN KEY ("serviceConfigId") REFERENCES "ServiceAvailabilityConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatedAvailabilitySlot" ADD CONSTRAINT "CalculatedAvailabilitySlot_billedToSubscriptionId_fkey" FOREIGN KEY ("billedToSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatedAvailabilitySlot" ADD CONSTRAINT "CalculatedAvailabilitySlot_blockedByEventId_fkey" FOREIGN KEY ("blockedByEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "CalculatedAvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarIntegration" ADD CONSTRAINT "CalendarIntegration_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarIntegrationId_fkey" FOREIGN KEY ("calendarIntegrationId") REFERENCES "CalendarIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncOperation" ADD CONSTRAINT "CalendarSyncOperation_calendarIntegrationId_fkey" FOREIGN KEY ("calendarIntegrationId") REFERENCES "CalendarIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetSession" ADD CONSTRAINT "MeetSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToServiceProvider" ADD CONSTRAINT "_ServiceToServiceProvider_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToServiceProvider" ADD CONSTRAINT "_ServiceToServiceProvider_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AvailabilityToServiceAvailabilityConfig" ADD CONSTRAINT "_AvailabilityToServiceAvailabilityConfig_A_fkey" FOREIGN KEY ("A") REFERENCES "Availability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AvailabilityToServiceAvailabilityConfig" ADD CONSTRAINT "_AvailabilityToServiceAvailabilityConfig_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceAvailabilityConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
