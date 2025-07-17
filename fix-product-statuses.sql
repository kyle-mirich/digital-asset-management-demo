-- Fix Product Status Migration
-- Run this in your Supabase SQL Editor to fix existing product statuses

-- First, let's see what statuses currently exist
SELECT DISTINCT status FROM products;

-- Drop the old constraint first
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;

-- Update any old status values to new ones
UPDATE products SET status = 'approved' WHERE status = 'active';
UPDATE products SET status = 'draft' WHERE status = 'inactive';

-- Make sure all products have valid statuses, default invalid ones to 'draft'
UPDATE products SET status = 'draft' 
WHERE status NOT IN ('draft', 'in_review', 'approved', 'archived');

-- Add the new constraint with the updated values
ALTER TABLE products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('draft', 'in_review', 'approved', 'archived'));

-- Verify the changes
SELECT status, COUNT(*) as count FROM products GROUP BY status;