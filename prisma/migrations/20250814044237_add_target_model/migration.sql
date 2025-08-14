-- CreateTable
CREATE TABLE "public"."targets" (
    "id" TEXT NOT NULL,
    "lineNo" TEXT NOT NULL,
    "styleNo" TEXT NOT NULL,
    "lineTarget" INTEGER NOT NULL,
    "inTime" TIMESTAMP(3) NOT NULL,
    "outTime" TIMESTAMP(3) NOT NULL,
    "hourlyProduction" INTEGER NOT NULL DEFAULT 0,
    "totalProduction" INTEGER NOT NULL DEFAULT 0,
    "averageProduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."targets" ADD CONSTRAINT "targets_styleNo_fkey" FOREIGN KEY ("styleNo") REFERENCES "public"."production_list"("styleNo") ON DELETE CASCADE ON UPDATE CASCADE;
