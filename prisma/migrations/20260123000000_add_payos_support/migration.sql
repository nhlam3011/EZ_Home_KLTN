-- Add PAYOS to PaymentMethod enum (safe migration)
-- This migration is safe and will NOT delete data

-- Check if PAYOS already exists in enum, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PAYOS' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')
    ) THEN
        -- Add PAYOS to enum
        ALTER TYPE "PaymentMethod" ADD VALUE 'PAYOS';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Value already exists, ignore
        NULL;
END $$;
