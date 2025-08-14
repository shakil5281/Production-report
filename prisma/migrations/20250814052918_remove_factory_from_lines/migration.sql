/*
  Warnings:

  - You are about to drop the column `factoryId` on the `lines` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."lines" DROP CONSTRAINT "lines_factoryId_fkey";

-- AlterTable
ALTER TABLE "public"."lines" DROP COLUMN "factoryId";
