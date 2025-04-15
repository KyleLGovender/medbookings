-- CreateEnum
CREATE TYPE "MeetSessionStatus" AS ENUM ('SCHEDULED', 'STARTED', 'ENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "meetLink" TEXT;

-- AlterTable
ALTER TABLE "CalendarIntegration" ADD COLUMN     "googleEmail" TEXT,
ADD COLUMN     "grantedScopes" TEXT[],
ADD COLUMN     "meetSettings" JSONB;

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

-- CreateIndex
CREATE UNIQUE INDEX "MeetSession_bookingId_key" ON "MeetSession"("bookingId");

-- AddForeignKey
ALTER TABLE "MeetSession" ADD CONSTRAINT "MeetSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
