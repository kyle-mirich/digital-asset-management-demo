-- Storage setup for VuoriFlow
-- Run this if you need to create the storage bucket and policies

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

-- Storage policies for the assets bucket
CREATE POLICY "Allow public read access to assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Allow authenticated users to upload assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Allow users to update their own assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'assets');

CREATE POLICY "Allow users to delete their own assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'assets');