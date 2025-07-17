import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const campaign = searchParams.get('campaign')
    const tags = searchParams.get('tags')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    let query = supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (campaign) {
      query = query.eq('campaign', campaign)
    }
    
    if (tags) {
      const tagList = tags.split(',')
      query = query.overlaps('tags', tagList)
    }
    
    if (search) {
      query = query.or(`filename.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    // Pagination
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || '20') - 1)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('assets')
      .insert(body)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}