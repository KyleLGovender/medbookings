/*
  Warnings:

  - You are about to drop the column `guestEmail` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `guestName` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `guestPhone` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `guestWhatsapp` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "guestEmail",
DROP COLUMN "guestName",
DROP COLUMN "guestPhone",
DROP COLUMN "guestWhatsapp",
ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientPhone" TEXT,
ADD COLUMN     "clientWhatsapp" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phoneVerified" TIMESTAMP(3),
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "whatsappVerified" TIMESTAMP(3);
