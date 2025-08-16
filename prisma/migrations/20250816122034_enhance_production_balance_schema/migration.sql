/*
  Migration to enhance ProductionBalance schema with line tracking and hourly production
  This migration handles existing data by providing default values and then cleaning up
*/

-- DropIndex (remove old unique constraint)
DROP INDEX "public"."production_balances_styleNo_key";

-- Step 1: Add new columns with default values for existing data
ALTER TABLE "public"."production_balances" 
ADD COLUMN "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "hourlyProduction" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "lineNo" TEXT DEFAULT 'LINE-001',
ADD COLUMN "lineTarget" INTEGER DEFAULT 0;

-- Step 2: Update existing data with meaningful defaults from related targets if available
UPDATE "public"."production_balances" 
SET 
  "date" = CURRENT_DATE,
  "lineNo" = COALESCE(
    (SELECT DISTINCT "lineNo" FROM "public"."targets" WHERE "targets"."styleNo" = "production_balances"."styleNo" LIMIT 1), 
    'LINE-001'
  ),
  "lineTarget" = COALESCE(
    (SELECT "lineTarget" FROM "public"."targets" WHERE "targets"."styleNo" = "production_balances"."styleNo" LIMIT 1), 
    "totalTarget"
  )
WHERE "date" IS NULL OR "lineNo" IS NULL OR "lineTarget" IS NULL;

-- Step 3: Make the columns required (NOT NULL)
ALTER TABLE "public"."production_balances" 
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "lineNo" SET NOT NULL,
ALTER COLUMN "lineTarget" SET NOT NULL;

-- Step 4: Remove default values now that existing data is updated
ALTER TABLE "public"."production_balances" 
ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "lineNo" DROP DEFAULT,
ALTER COLUMN "lineTarget" DROP DEFAULT;

-- CreateIndex (new unique constraint)
CREATE UNIQUE INDEX "production_balances_styleNo_lineNo_date_key" ON "public"."production_balances"("styleNo", "lineNo", "date");
