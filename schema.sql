-- VuoriFlow Database Schema
-- Digital Asset Management System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Assets table for storing digital asset metadata
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  filetype TEXT NOT NULL,
  filesize INTEGER NOT NULL,
  upload_time TIMESTAMP DEFAULT now(),
  status TEXT CHECK (status IN ('draft', 'in_review', 'approved', 'archived')) DEFAULT 'draft',
  uploader_id UUID REFERENCES auth.users (id),
  campaign TEXT,
  tags TEXT[],
  qc_passed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_uploader_id ON assets(uploader_id);
CREATE INDEX idx_assets_campaign ON assets(campaign);
CREATE INDEX idx_assets_upload_time ON assets(upload_time);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policies for asset access
CREATE POLICY "Users can view all assets" ON assets
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can update their own assets" ON assets
    FOR UPDATE USING (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own assets" ON assets
    FOR DELETE USING (auth.uid() = uploader_id);

-- Storage policies for the assets bucket
CREATE POLICY "Allow public read access to assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Allow authenticated users to upload assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Allow users to update their own assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'assets');

CREATE POLICY "Allow users to delete their own assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'assets');