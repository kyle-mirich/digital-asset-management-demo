import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const campaign = formData.get('campaign') as string
    const tags = formData.get('tags') as string
    const notes = formData.get('notes') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${cleanName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(fileName)

    // Create asset record in database
    const assetData = {
      filename: file.name,
      file_url: publicUrl,
      filetype: file.type,
      filesize: file.size,
      campaign: campaign || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      notes: notes || null,
      status: 'draft'
    }

    const { data: asset, error: dbError } = await supabase
      .from('assets')
      .insert(assetData)
      .select()
      .single()

    if (dbError) {
      // If database insert fails, clean up the uploaded file
      await supabase.storage
        .from('assets')
        .remove([fileName])
      
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data: asset }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}