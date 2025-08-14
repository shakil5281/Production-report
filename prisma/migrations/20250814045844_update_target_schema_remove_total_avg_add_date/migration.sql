/*
  Warnings:

  - You are about to drop the column `averageProduction` on the `targets` table. All the data in the column will be lost.
  - You are about to drop the column `totalProduction` on the `targets` table. All the data in the column will be lost.
  - Added the required column `date` to the `targets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."targets" DROP COLUMN "averageProduction",
DROP COLUMN "totalProduction",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "inTime" SET DATA TYPE TEXT,
ALTER COLUMN "outTime" SET DATA TYPE TEXT;
