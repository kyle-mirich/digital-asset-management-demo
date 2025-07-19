-- Add gender_category column to assets table
-- This migration adds support for categorizing assets as 'mens', 'womens', or 'unisex'

ALTER TABLE assets 
ADD COLUMN gender_category VARCHAR(10) DEFAULT 'unisex' CHECK (gender_category IN ('mens', 'womens', 'unisex'));

-- Update existing assets to have 'unisex' as default
UPDATE assets SET gender_category = 'unisex' WHERE gender_category IS NULL;

-- Make gender_category column NOT NULL after setting defaults
ALTER TABLE assets ALTER COLUMN gender_category SET NOT NULL;

-- Create index for better query performance on gender_category
CREATE INDEX idx_assets_gender_category ON assets(gender_category);

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assets' AND column_name = 'gender_category';