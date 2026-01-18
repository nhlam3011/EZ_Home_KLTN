-- Add VIETQR to PaymentMethod enum (safe migration)
-- This migration is safe and will NOT delete data

-- Check if VIETQR already exists in enum, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'VIETQR' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')
    ) THEN
        -- Add VIETQR to enum
        ALTER TYPE "PaymentMethod" ADD VALUE 'VIETQR';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Value already exists, ignore
        NULL;
END $$;

-- Add columns if they don't exist (safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'paymentUrl'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "paymentUrl" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'qrCode'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "qrCode" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'qrString'
    ) THEN
        ALTER TABLE "Payment" ADD COLUMN "qrString" TEXT;
    END IF;
END $$;
