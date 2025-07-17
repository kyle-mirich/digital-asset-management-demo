import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name for assets
export const ASSETS_BUCKET = 'assets'

// Helper function to get public URL for uploaded files
export const getPublicUrl = (filePath: string) => {
  const { data } = supabase.storage
    .from(ASSETS_BUCKET)
    .getPublicUrl(filePath)
  return data.publicUrl
}

// Helper function to upload file to Supabase Storage
export const uploadFile = async (file: File, fileName: string) => {
  const { data, error } = await supabase.storage
    .from(ASSETS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    throw error
  }
  
  return data
}

// Helper function to delete file from Supabase Storage
export const deleteFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from(ASSETS_BUCKET)
    .remove([filePath])
  
  if (error) {
    throw error
  }
}