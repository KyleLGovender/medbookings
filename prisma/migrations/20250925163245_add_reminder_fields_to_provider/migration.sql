-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "reminderChannels" TEXT[] DEFAULT ARRAY['email', 'sms']::TEXT[],
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderHours" INTEGER NOT NULL DEFAULT 24;