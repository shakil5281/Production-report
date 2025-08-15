/*
  Warnings:

  - The values [MANAGER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PermissionType" ADD VALUE 'CREATE_CUTTING';
ALTER TYPE "public"."PermissionType" ADD VALUE 'READ_CUTTING';
ALTER TYPE "public"."PermissionType" ADD VALUE 'UPDATE_CUTTING';
ALTER TYPE "public"."PermissionType" ADD VALUE 'DELETE_CUTTING';
ALTER TYPE "public"."PermissionType" ADD VALUE 'CREATE_CASHBOOK';
ALTER TYPE "public"."PermissionType" ADD VALUE 'READ_CASHBOOK';
ALTER TYPE "public"."PermissionType" ADD VALUE 'UPDATE_CASHBOOK';
ALTER TYPE "public"."PermissionType" ADD VALUE 'DELETE_CASHBOOK';
ALTER TYPE "public"."PermissionType" ADD VALUE 'CREATE_EXPENSE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'READ_EXPENSE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'UPDATE_EXPENSE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'DELETE_EXPENSE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'CREATE_TARGET';
ALTER TYPE "public"."PermissionType" ADD VALUE 'READ_TARGET';
ALTER TYPE "public"."PermissionType" ADD VALUE 'UPDATE_TARGET';
ALTER TYPE "public"."PermissionType" ADD VALUE 'DELETE_TARGET';
ALTER TYPE "public"."PermissionType" ADD VALUE 'CREATE_LINE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'READ_LINE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'UPDATE_LINE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'DELETE_LINE';
ALTER TYPE "public"."PermissionType" ADD VALUE 'CREATE_SHIPMENT';
ALTER TYPE "public"."PermissionType" ADD VALUE 'READ_SHIPMENT';
ALTER TYPE "public"."PermissionType" ADD VALUE 'UPDATE_SHIPMENT';
ALTER TYPE "public"."PermissionType" ADD VALUE 'DELETE_SHIPMENT';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TABLE "public"."roles" ALTER COLUMN "name" TYPE "public"."UserRole_new" USING ("name"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- CreateTable
CREATE TABLE "public"."navigation_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."navigation_permissions" (
    "id" TEXT NOT NULL,
    "navigationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "canAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigation_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "navigation_items_url_key" ON "public"."navigation_items"("url");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_permissions_navigationId_roleId_key" ON "public"."navigation_permissions"("navigationId", "roleId");

-- AddForeignKey
ALTER TABLE "public"."navigation_items" ADD CONSTRAINT "navigation_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."navigation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."navigation_permissions" ADD CONSTRAINT "navigation_permissions_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES "public"."navigation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."navigation_permissions" ADD CONSTRAINT "navigation_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
