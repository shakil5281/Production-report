-- CreateTable
CREATE TABLE "public"."daily_production_reports" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "styleNo" TEXT NOT NULL,
    "targetQty" INTEGER NOT NULL,
    "actualQty" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "balanceQty" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_production_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."production_balances" (
    "id" TEXT NOT NULL,
    "styleNo" TEXT NOT NULL,
    "currentBalance" INTEGER NOT NULL DEFAULT 0,
    "totalTarget" INTEGER NOT NULL DEFAULT 0,
    "totalProduced" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_production_reports_date_styleNo_key" ON "public"."daily_production_reports"("date", "styleNo");

-- CreateIndex
CREATE UNIQUE INDEX "production_balances_styleNo_key" ON "public"."production_balances"("styleNo");

-- AddForeignKey
ALTER TABLE "public"."daily_production_reports" ADD CONSTRAINT "daily_production_reports_styleNo_fkey" FOREIGN KEY ("styleNo") REFERENCES "public"."production_list"("styleNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_balances" ADD CONSTRAINT "production_balances_styleNo_fkey" FOREIGN KEY ("styleNo") REFERENCES "public"."production_list"("styleNo") ON DELETE CASCADE ON UPDATE CASCADE;
