-- AlterTable: Add paymentDueDate column (nullable first)
ALTER TABLE "Invoice" ADD COLUMN "paymentDueDate" TIMESTAMP(3);

-- Update existing invoices to have paymentDueDate = createdAt + 15 days
UPDATE "Invoice" 
SET "paymentDueDate" = "createdAt" + INTERVAL '15 days'
WHERE "paymentDueDate" IS NULL;

-- Make paymentDueDate NOT NULL after updating all rows
ALTER TABLE "Invoice" ALTER COLUMN "paymentDueDate" SET NOT NULL;
