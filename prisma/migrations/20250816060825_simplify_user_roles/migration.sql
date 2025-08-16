/*
  Warnings:

  - The values [ADMIN,MANAGER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

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
CREATE TYPE "public"."UserRole_new" AS ENUM ('SUPER_ADMIN', 'USER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TABLE "public"."roles" ALTER COLUMN "name" TYPE "public"."UserRole_new" USING ("name"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;
