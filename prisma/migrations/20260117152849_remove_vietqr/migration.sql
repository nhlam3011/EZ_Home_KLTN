/*
  Warnings:

  - The values [VNPAY,VIETQR] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `paymentUrl` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `qrCode` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `qrString` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'BANK_TRANSFER');
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentUrl",
DROP COLUMN "qrCode",
DROP COLUMN "qrString";
