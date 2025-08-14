/*
  Warnings:

  - You are about to drop the column `endDate` on the `production_list` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `production_list` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `production_list` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."production_list" DROP COLUMN "endDate",
DROP COLUMN "notes",
DROP COLUMN "startDate";
