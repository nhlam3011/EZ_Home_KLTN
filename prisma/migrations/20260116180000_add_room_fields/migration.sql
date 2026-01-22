-- Add room fields safely (check if columns exist first)
-- This migration is safe and will NOT fail if columns already exist

DO $$
BEGIN
    -- Add roomType column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Room' AND column_name = 'roomType'
    ) THEN
        ALTER TABLE "Room" ADD COLUMN "roomType" TEXT;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Room' AND column_name = 'description'
    ) THEN
        ALTER TABLE "Room" ADD COLUMN "description" TEXT;
    END IF;
    
    -- Add amenities column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Room' AND column_name = 'amenities'
    ) THEN
        ALTER TABLE "Room" ADD COLUMN "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;
