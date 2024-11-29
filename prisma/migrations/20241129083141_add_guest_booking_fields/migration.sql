-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_clientId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ADD COLUMN     "guestWhatsapp" TEXT,
ADD COLUMN     "notifyViaEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyViaSMS" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyViaWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
