-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Availability_status_idx" ON "Availability"("status");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "RequirementSubmission_providerId_idx" ON "RequirementSubmission"("providerId");

-- CreateIndex
CREATE INDEX "RequirementSubmission_status_idx" ON "RequirementSubmission"("status");

-- CreateIndex
CREATE INDEX "Subscription_providerId_idx" ON "Subscription"("providerId");

-- CreateIndex
CREATE INDEX "Subscription_locationId_idx" ON "Subscription"("locationId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
