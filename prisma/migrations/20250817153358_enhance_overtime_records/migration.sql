/*
  Warnings:

  - You are about to drop the `production_balances` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE', 'OVERTIME');

-- CreateEnum
CREATE TYPE "public"."Department" AS ENUM ('CUTTING', 'SEWING', 'FINISHING', 'QUALITY', 'ADMIN', 'MAINTENANCE', 'SECURITY', 'STORE', 'ACCOUNTS', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "public"."ShiftType" AS ENUM ('DAY_SHIFT', 'NIGHT_SHIFT', 'GENERAL_SHIFT');

-- CreateEnum
CREATE TYPE "public"."ManpowerItemType" AS ENUM ('SECTION', 'SUBSECTION', 'LINE', 'TOTAL');

-- CreateEnum
CREATE TYPE "public"."SalaryRateType" AS ENUM ('REGULAR', 'OVERTIME');

-- DropForeignKey
ALTER TABLE "public"."production_balances" DROP CONSTRAINT "production_balances_styleNo_fkey";

-- DropTable
DROP TABLE "public"."production_balances";

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" "public"."Department" NOT NULL,
    "designation" TEXT NOT NULL,
    "shiftType" "public"."ShiftType" NOT NULL DEFAULT 'DAY_SHIFT',
    "salary" DECIMAL(65,30),
    "joiningDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "inTime" TEXT,
    "outTime" TEXT,
    "workHours" DECIMAL(65,30),
    "overtime" DECIMAL(65,30),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manpower_summary" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "section" TEXT NOT NULL,
    "subsection" TEXT,
    "lineNumber" TEXT,
    "itemType" "public"."ManpowerItemType" NOT NULL,
    "present" INTEGER NOT NULL DEFAULT 0,
    "absent" INTEGER NOT NULL DEFAULT 0,
    "leave" INTEGER NOT NULL DEFAULT 0,
    "others" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manpower_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."overtime_records" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "section" TEXT NOT NULL,
    "presentWorkers" INTEGER NOT NULL DEFAULT 0,
    "totalWorkers" INTEGER NOT NULL DEFAULT 0,
    "overtimeDetails" JSONB,
    "totalOtHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_rates" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "rateType" "public"."SalaryRateType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_salaries" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "section" TEXT NOT NULL,
    "workerCount" INTEGER NOT NULL DEFAULT 0,
    "regularRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "regularAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."monthly_attendance_report" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "department" "public"."Department" NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL DEFAULT 0,
    "totalPresent" INTEGER NOT NULL DEFAULT 0,
    "totalAbsent" INTEGER NOT NULL DEFAULT 0,
    "totalLeave" INTEGER NOT NULL DEFAULT 0,
    "totalOvertime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "averageAttendance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_attendance_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeId_key" ON "public"."employees"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_attendance_date_employeeId_key" ON "public"."daily_attendance"("date", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "manpower_summary_date_section_subsection_lineNumber_key" ON "public"."manpower_summary"("date", "section", "subsection", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "overtime_records_date_section_key" ON "public"."overtime_records"("date", "section");

-- CreateIndex
CREATE UNIQUE INDEX "salary_rates_section_rateType_effectiveDate_key" ON "public"."salary_rates"("section", "rateType", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_salaries_date_section_key" ON "public"."daily_salaries"("date", "section");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_attendance_report_month_year_department_key" ON "public"."monthly_attendance_report"("month", "year", "department");

-- AddForeignKey
ALTER TABLE "public"."daily_attendance" ADD CONSTRAINT "daily_attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manpower_summary" ADD CONSTRAINT "manpower_summary_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."manpower_summary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
