/*
  Warnings:

  - You are about to drop the column `actualQty` on the `daily_production_reports` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `daily_production_reports` table. All the data in the column will be lost.
  - You are about to drop the column `remainingQty` on the `daily_production_reports` table. All the data in the column will be lost.
  - Added the required column `productionQty` to the `daily_production_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `daily_production_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Handle existing data properly
-- First add new columns with default values
ALTER TABLE "public"."daily_production_reports" 
ADD COLUMN "lineNo" TEXT,
ADD COLUMN "productionQty" INTEGER DEFAULT 0,
ADD COLUMN "unitPrice" DECIMAL(65,30) DEFAULT 0;

-- Copy data from old columns to new columns
UPDATE "public"."daily_production_reports" 
SET "productionQty" = COALESCE("actualQty", 0),
    "unitPrice" = COALESCE("price", 0);

-- Drop old columns
ALTER TABLE "public"."daily_production_reports" 
DROP COLUMN "actualQty",
DROP COLUMN "price", 
DROP COLUMN "remainingQty";

-- Make new columns NOT NULL after data migration
ALTER TABLE "public"."daily_production_reports"
ALTER COLUMN "productionQty" SET NOT NULL,
ALTER COLUMN "unitPrice" SET NOT NULL,
ALTER COLUMN "balanceQty" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."production_balances" ALTER COLUMN "totalTarget" DROP DEFAULT;
