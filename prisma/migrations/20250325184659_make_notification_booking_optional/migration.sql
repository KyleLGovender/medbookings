-- DropForeignKey
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_bookingId_fkey";

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "appointmentTime" TIMESTAMP(3),
ADD COLUMN     "bookingReference" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "serviceName" TEXT,
ADD COLUMN     "serviceProviderName" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
