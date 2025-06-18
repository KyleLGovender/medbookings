/*
  Warnings:

  - You are about to drop the column `city` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Location` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Location_city_country_idx";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "city",
DROP COLUMN "country";

-- CreateIndex
CREATE INDEX "Location_searchTerms_idx" ON "Location"("searchTerms");
