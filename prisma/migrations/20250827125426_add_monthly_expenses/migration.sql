/*
  Warnings:

  - You are about to drop the column `balanceQty` on the `daily_production_reports` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `production_list` table. All the data in the column will be lost.
  - You are about to drop the `daily_salaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_rates` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[date,styleNo,lineNo]` on the table `daily_production_reports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- DropIndex
DROP INDEX "public"."daily_production_reports_date_styleNo_key";

-- AlterTable
ALTER TABLE "public"."daily_production_reports" DROP COLUMN "balanceQty",
ADD COLUMN     "netAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."production_list" DROP COLUMN "quantity",
ADD COLUMN     "quantities" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "totalQty" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."daily_salaries";

-- DropTable
DROP TABLE "public"."salary_rates";

-- DropEnum
DROP TYPE "public"."SalaryRateType";

-- CreateTable
CREATE TABLE "public"."monthly_expenses" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_expenses_month_year_category_key" ON "public"."monthly_expenses"("month", "year", "category");

-- CreateIndex
CREATE UNIQUE INDEX "daily_production_reports_date_styleNo_lineNo_key" ON "public"."daily_production_reports"("date", "styleNo", "lineNo");
