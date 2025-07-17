-- Product-Oriented Database Schema Updates for VuoriFlow
-- Run this in your Supabase SQL Editor to add Product-centric functionality

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('shirt', 'pants', 'shorts', 'tank', 'jacket', 'hoodie', 'accessories', 'other')),
  status TEXT CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users (id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add product_id to assets table
ALTER TABLE assets ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at);
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

-- Add helpful comments
COMMENT ON TABLE products IS 'Products table for organizing digital assets by product (e.g., The Ultralight Tank)';
COMMENT ON COLUMN products.category IS 'Product category: shirt, pants, shorts, tank, jacket, hoodie, accessories, other';
COMMENT ON COLUMN assets.product_id IS 'Optional reference to product this asset belongs to. NULL for unassigned assets.';