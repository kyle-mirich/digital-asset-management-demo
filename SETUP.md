# VuoriFlow Setup Guide

## Prerequisites

1. **Node.js 18+** and npm
2. **Supabase Account** (free tier is sufficient)

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be fully provisioned

### 2. Set up the Database

1. Go to the SQL Editor in your Supabase dashboard
2. Run the contents of `schema.sql` to create the assets table

### 3. Set up Storage

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `assets`
3. Set the bucket to **Public** (for file access)
4. Configure bucket policies for public read access

### 4. Get Your Supabase Credentials

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the **Project URL** and **anon public key**

## Local Development Setup

### 1. Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Update the values with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

## Supabase Storage Bucket Setup

The application requires a storage bucket named `assets` to be created in your Supabase project.

### Storage Bucket Configuration:

1. **Bucket Name**: `assets`
2. **Public Access**: Enabled
3. **File Size Limit**: 50MB (recommended)

### RLS Policies for Storage:

```sql
-- Allow public access to view files
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Features

- ✅ **Asset Upload**: Drag & drop or click to upload images/videos
- ✅ **Status Management**: Draft → In Review → Approved → Archived
- ✅ **Quality Control**: Interactive QC checklist
- ✅ **Filtering & Search**: Filter by status, campaign, tags, or search
- ✅ **Metadata Management**: Tags, campaigns, notes
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Animations**: Smooth transitions and hover effects

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Home page with asset grid
│   ├── upload/page.tsx       # Upload page
│   ├── asset/[id]/page.tsx   # Asset detail page
│   └── api/
│       └── assets/           # API routes
├── components/
│   ├── AssetCard.tsx         # Asset card component
│   ├── UploadForm.tsx        # File upload form
│   ├── FilterPanel.tsx       # Filtering interface
│   ├── QCChecklist.tsx       # Quality control checklist
│   └── StatusDropdown.tsx    # Status management
├── lib/
│   └── supabase.ts           # Supabase client
└── types/
    └── asset.ts              # TypeScript definitions
```

## Troubleshooting

### Common Issues:

1. **"supabaseUrl is required" Error**:
   - Ensure `.env.local` exists with correct Supabase credentials
   - Restart the development server after adding env vars

2. **Upload Failed Error**:
   - Check if the `assets` storage bucket exists in Supabase
   - Verify bucket is set to public access
   - Ensure RLS policies are configured correctly

3. **Database Connection Issues**:
   - Verify the `assets` table exists (run `schema.sql`)
   - Check Supabase project is active and accessible

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (recommended):
   ```bash
   npx vercel --prod
   ```

3. **Set environment variables** in your deployment platform

## Support

For issues with:
- **Supabase**: Check [Supabase documentation](https://supabase.com/docs)
- **Next.js**: Check [Next.js documentation](https://nextjs.org/docs)
- **Application**: Review the error messages in browser console