-- AlterTable
ALTER TABLE "CalculatedAvailabilitySlot" ADD COLUMN     "blockedByOrgEventId" TEXT;

-- AlterTable
ALTER TABLE "CalendarIntegration" ADD COLUMN     "lastErrorType" TEXT,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OrganizationCalendarIntegration" (
    "id" TEXT NOT NULL,
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
    "nextRetryAt" TIMESTAMP(3),
    "lastErrorType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calendarProvider" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "OrganizationCalendarIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCalendarEvent" (
    "id" TEXT NOT NULL,
    "organizationCalendarIntegrationId" TEXT NOT NULL,
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

    CONSTRAINT "OrganizationCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCalendarSyncOperation" (
    "id" TEXT NOT NULL,
    "organizationCalendarIntegrationId" TEXT NOT NULL,
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

    CONSTRAINT "OrganizationCalendarSyncOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationCalendarIntegration_organizationId_idx" ON "OrganizationCalendarIntegration"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationCalendarIntegration_locationId_idx" ON "OrganizationCalendarIntegration"("locationId");

-- CreateIndex
CREATE INDEX "OrganizationCalendarIntegration_syncEnabled_backgroundSyncE_idx" ON "OrganizationCalendarIntegration"("syncEnabled", "backgroundSyncEnabled");

-- CreateIndex
CREATE INDEX "OrganizationCalendarIntegration_lastSyncedAt_idx" ON "OrganizationCalendarIntegration"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationCalendarIntegration_organizationId_locationId_key" ON "OrganizationCalendarIntegration"("organizationId", "locationId");

-- CreateIndex
CREATE INDEX "OrganizationCalendarEvent_organizationCalendarIntegrationId_idx" ON "OrganizationCalendarEvent"("organizationCalendarIntegrationId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "OrganizationCalendarEvent_syncStatus_hasConflict_idx" ON "OrganizationCalendarEvent"("syncStatus", "hasConflict");

-- CreateIndex
CREATE INDEX "OrganizationCalendarEvent_lastSyncedAt_idx" ON "OrganizationCalendarEvent"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationCalendarEvent_organizationCalendarIntegrationId_key" ON "OrganizationCalendarEvent"("organizationCalendarIntegrationId", "externalEventId");

-- CreateIndex
CREATE INDEX "OrganizationCalendarSyncOperation_organizationCalendarInteg_idx" ON "OrganizationCalendarSyncOperation"("organizationCalendarIntegrationId", "status");

-- CreateIndex
CREATE INDEX "OrganizationCalendarSyncOperation_operationType_startedAt_idx" ON "OrganizationCalendarSyncOperation"("operationType", "startedAt");

-- AddForeignKey
ALTER TABLE "CalculatedAvailabilitySlot" ADD CONSTRAINT "CalculatedAvailabilitySlot_blockedByOrgEventId_fkey" FOREIGN KEY ("blockedByOrgEventId") REFERENCES "OrganizationCalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCalendarIntegration" ADD CONSTRAINT "OrganizationCalendarIntegration_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCalendarIntegration" ADD CONSTRAINT "OrganizationCalendarIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCalendarEvent" ADD CONSTRAINT "OrganizationCalendarEvent_organizationCalendarIntegrationI_fkey" FOREIGN KEY ("organizationCalendarIntegrationId") REFERENCES "OrganizationCalendarIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCalendarSyncOperation" ADD CONSTRAINT "OrganizationCalendarSyncOperation_organizationCalendarInte_fkey" FOREIGN KEY ("organizationCalendarIntegrationId") REFERENCES "OrganizationCalendarIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
