// src/app/api/products/search/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        sale_price,
        images,
        category:categories(name)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}