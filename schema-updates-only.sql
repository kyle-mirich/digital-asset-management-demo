-- Schema Updates ONLY (skip existing tables)
-- Run this in your Supabase SQL Editor

-- Update products table to include workflow statuses (skip if constraint already exists)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
        ALTER TABLE products ADD CONSTRAINT products_status_check 
          CHECK (status IN ('draft', 'in_review', 'approved', 'archived'));
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Products status constraint already exists or error: %', SQLERRM;
    END;
END $$;

-- Update assets table to allow filename editing (skip if column exists)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS original_filename TEXT;
        UPDATE assets SET original_filename = filename WHERE original_filename IS NULL;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Assets original_filename column already exists or error: %', SQLERRM;
    END;
END $$;

-- Create tags table for autocomplete (skip if exists)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for tags (skip if exist)
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- Create product checklist items table (skip if exists)
CREATE TABLE IF NOT EXISTS product_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create asset checklist items table (skip if exists)
CREATE TABLE IF NOT EXISTS asset_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for checklists (skip if exist)
CREATE INDEX IF NOT EXISTS idx_product_checklist_product_id ON product_checklist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_asset_checklist_asset_id ON asset_checklist_items(asset_id);

-- Enable RLS for new tables (skip if already enabled)
DO $$ 
BEGIN
    ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE product_checklist_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE asset_checklist_items ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- Create policies for tags (skip if exist)
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Anyone can view tags" already exists';
    END;
    
    BEGIN
        CREATE POLICY "Authenticated users can insert tags" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Authenticated users can insert tags" already exists';
    END;
    
    BEGIN
        CREATE POLICY "Authenticated users can update tags" ON tags FOR UPDATE USING (auth.role() = 'authenticated');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Authenticated users can update tags" already exists';
    END;
END $$;

-- Create policies for product checklists (skip if exist)
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Users can view product checklists" ON product_checklist_items FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can view product checklists" already exists';
    END;
    
    BEGIN
        CREATE POLICY "Users can manage product checklists" ON product_checklist_items FOR ALL USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can manage product checklists" already exists';
    END;
END $$;

-- Create policies for asset checklists (skip if exist)
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Users can view asset checklists" ON asset_checklist_items FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can view asset checklists" already exists';
    END;
    
    BEGIN
        CREATE POLICY "Users can manage asset checklists" ON asset_checklist_items FOR ALL USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Users can manage asset checklists" already exists';
    END;
END $$;

-- Create updated_at triggers (create function first if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (skip if exist)
DO $$ 
BEGIN
    BEGIN
        CREATE TRIGGER update_product_checklist_updated_at
            BEFORE UPDATE ON product_checklist_items
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger update_product_checklist_updated_at already exists';
    END;
    
    BEGIN
        CREATE TRIGGER update_asset_checklist_updated_at
            BEFORE UPDATE ON asset_checklist_items
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger update_asset_checklist_updated_at already exists';
    END;
END $$;

-- Function to automatically increment tag usage
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_name TEXT)
RETURNS UUID AS $$
DECLARE
    tag_id UUID;
BEGIN
    -- Try to update existing tag
    UPDATE tags SET usage_count = usage_count + 1 
    WHERE name = tag_name 
    RETURNING id INTO tag_id;
    
    -- If tag doesn't exist, create it
    IF tag_id IS NULL THEN
        INSERT INTO tags (name, usage_count) 
        VALUES (tag_name, 1) 
        RETURNING id INTO tag_id;
    END IF;
    
    RETURN tag_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-promote to in_review when checklist is complete
CREATE OR REPLACE FUNCTION check_and_promote_status()
RETURNS TRIGGER AS $$
DECLARE
    total_required INTEGER;
    completed_required INTEGER;
    current_status TEXT;
    record_id UUID;
    table_name TEXT;
BEGIN
    -- Determine which table we're working with
    IF TG_TABLE_NAME = 'product_checklist_items' THEN
        record_id := NEW.product_id;
        table_name := 'products';
        
        -- Count required vs completed items for product
        SELECT COUNT(*) INTO total_required 
        FROM product_checklist_items 
        WHERE product_id = record_id AND is_required = true;
        
        SELECT COUNT(*) INTO completed_required 
        FROM product_checklist_items 
        WHERE product_id = record_id AND is_required = true AND is_completed = true;
        
        -- Get current status
        SELECT status INTO current_status FROM products WHERE id = record_id;
        
    ELSIF TG_TABLE_NAME = 'asset_checklist_items' THEN
        record_id := NEW.asset_id;
        table_name := 'assets';
        
        -- Count required vs completed items for asset
        SELECT COUNT(*) INTO total_required 
        FROM asset_checklist_items 
        WHERE asset_id = record_id AND is_required = true;
        
        SELECT COUNT(*) INTO completed_required 
        FROM asset_checklist_items 
        WHERE asset_id = record_id AND is_required = true AND is_completed = true;
        
        -- Get current status
        SELECT status INTO current_status FROM assets WHERE id = record_id;
    END IF;
    
    -- If all required items are completed and status is draft, promote to in_review
    IF total_required > 0 AND completed_required = total_required AND current_status = 'draft' THEN
        IF table_name = 'products' THEN
            UPDATE products SET status = 'in_review' WHERE id = record_id;
        ELSIF table_name = 'assets' THEN
            UPDATE assets SET status = 'in_review' WHERE id = record_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-promotion (skip if exist)
DO $$ 
BEGIN
    BEGIN
        CREATE TRIGGER product_checklist_auto_promote
            AFTER UPDATE ON product_checklist_items
            FOR EACH ROW
            WHEN (OLD.is_completed IS DISTINCT FROM NEW.is_completed)
            EXECUTE FUNCTION check_and_promote_status();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger product_checklist_auto_promote already exists';
    END;
    
    BEGIN
        CREATE TRIGGER asset_checklist_auto_promote
            AFTER UPDATE ON asset_checklist_items
            FOR EACH ROW
            WHEN (OLD.is_completed IS DISTINCT FROM NEW.is_completed)
            EXECUTE FUNCTION check_and_promote_status();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger asset_checklist_auto_promote already exists';
    END;
END $$;

-- Add some default checklist items for new products
CREATE OR REPLACE FUNCTION create_default_product_checklist()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default checklist items for new products
    INSERT INTO product_checklist_items (product_id, title, description, is_required, order_index) VALUES
    (NEW.id, 'Product specifications defined', 'All technical specifications and requirements documented', true, 1),
    (NEW.id, 'Design assets ready', 'All design files and visual assets prepared', true, 2),
    (NEW.id, 'Content review completed', 'Product description and marketing content reviewed', true, 3),
    (NEW.id, 'Legal compliance checked', 'Product meets all legal and regulatory requirements', true, 4),
    (NEW.id, 'Quality assurance passed', 'Product has passed quality control checks', false, 5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product checklist creation (skip if exist)
DO $$ 
BEGIN
    BEGIN
        CREATE TRIGGER create_product_checklist
            AFTER INSERT ON products
            FOR EACH ROW
            EXECUTE FUNCTION create_default_product_checklist();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger create_product_checklist already exists';
    END;
END $$;

-- Add some default checklist items for new assets
CREATE OR REPLACE FUNCTION create_default_asset_checklist()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default checklist items for new assets
    INSERT INTO asset_checklist_items (asset_id, title, description, is_required, order_index) VALUES
    (NEW.id, 'Image quality verified', 'Resolution, clarity, and technical quality confirmed', true, 1),
    (NEW.id, 'Brand guidelines compliance', 'Asset follows brand colors, fonts, and style guidelines', true, 2),
    (NEW.id, 'Content accuracy checked', 'All text, labels, and information is accurate', true, 3),
    (NEW.id, 'Rights and permissions cleared', 'Usage rights and permissions verified', true, 4),
    (NEW.id, 'Metadata completed', 'All required tags, descriptions, and metadata added', false, 5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for asset checklist creation (skip if exist)
DO $$ 
BEGIN
    BEGIN
        CREATE TRIGGER create_asset_checklist
            AFTER INSERT ON assets
            FOR EACH ROW
            EXECUTE FUNCTION create_default_asset_checklist();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger create_asset_checklist already exists';
    END;
END $$;

-- Add helpful comments
COMMENT ON TABLE tags IS 'Global tags table for autocomplete functionality';
COMMENT ON TABLE product_checklist_items IS 'Checklist items for product approval workflow';
COMMENT ON TABLE asset_checklist_items IS 'Checklist items for asset approval workflow';