-- Fix RLS policies to allow uploads without authentication
-- This is for demo purposes - in production you'd want proper auth

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all assets" ON assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;

-- Create more permissive policies for demo
CREATE POLICY "Allow all to view assets" ON assets
    FOR SELECT USING (true);

CREATE POLICY "Allow all to insert assets" ON assets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update assets" ON assets
    FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete assets" ON assets
    FOR DELETE USING (true);

-- Also update storage policies to be more permissive
DROP POLICY IF EXISTS "Allow public read access to assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own assets" ON storage.objects;

-- Create permissive storage policies
CREATE POLICY "Allow all to read assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Allow all to upload assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Allow all to update assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'assets');

CREATE POLICY "Allow all to delete assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'assets');