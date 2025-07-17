-- Products Schema Addition for VuoriFlow
-- Run this in your Supabase SQL Editor to add Products functionality

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category TEXT,
  brand TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  tags TEXT[],
  created_by UUID REFERENCES auth.users (id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add product_id to assets table
ALTER TABLE assets ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_assets_product_id ON assets(product_id);

-- Create updated_at trigger for products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products access
CREATE POLICY "Users can view all products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own products" ON products
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own products" ON products
    FOR DELETE USING (auth.uid() = created_by);

-- Update existing assets policies to allow product assignment
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;

CREATE POLICY "Allow all to insert assets" ON assets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update assets" ON assets
    FOR UPDATE USING (true);