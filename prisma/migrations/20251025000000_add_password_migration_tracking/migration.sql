-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordMigratedAt" TIMESTAMP(3);

-- AddComment
COMMENT ON COLUMN "User"."passwordMigratedAt" IS 'Timestamp when password was migrated from SHA-256 to bcrypt. NULL means still using SHA-256 or OAuth user.';
