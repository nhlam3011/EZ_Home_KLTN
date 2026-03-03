/*
  Warnings:

  - You are about to drop the column `paymentUrl` on the `Payment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "overdueAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "overdueInvoices" TEXT;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "images" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentUrl";

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "amenities" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ContractRenewalRequest" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newEndDate" TIMESTAMP(3) NOT NULL,
    "status" "RenewalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "processedBy" INTEGER,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractRenewalRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContractRenewalRequest" ADD CONSTRAINT "ContractRenewalRequest_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRenewalRequest" ADD CONSTRAINT "ContractRenewalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
