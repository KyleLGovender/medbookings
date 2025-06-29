-- CreateEnum
CREATE TYPE "ProviderInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DELIVERY_FAILED');

-- CreateTable
CREATE TABLE "ProviderInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "customMessage" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "ProviderInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "connectionId" TEXT,
    "emailDeliveryStatus" TEXT DEFAULT 'PENDING',
    "lastEmailSentAt" TIMESTAMP(3),
    "emailAttempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProviderInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderInvitation_token_key" ON "ProviderInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderInvitation_connectionId_key" ON "ProviderInvitation"("connectionId");

-- CreateIndex
CREATE INDEX "ProviderInvitation_organizationId_idx" ON "ProviderInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "ProviderInvitation_email_idx" ON "ProviderInvitation"("email");

-- CreateIndex
CREATE INDEX "ProviderInvitation_token_idx" ON "ProviderInvitation"("token");

-- CreateIndex
CREATE INDEX "ProviderInvitation_status_idx" ON "ProviderInvitation"("status");

-- CreateIndex
CREATE INDEX "ProviderInvitation_expiresAt_idx" ON "ProviderInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "ProviderInvitation" ADD CONSTRAINT "ProviderInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderInvitation" ADD CONSTRAINT "ProviderInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderInvitation" ADD CONSTRAINT "ProviderInvitation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "OrganizationProviderConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
