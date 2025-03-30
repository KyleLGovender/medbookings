-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "email" TEXT NOT NULL DEFAULT 'default@example.com',
ADD COLUMN     "whatsapp" TEXT NOT NULL DEFAULT '+1234567890';
