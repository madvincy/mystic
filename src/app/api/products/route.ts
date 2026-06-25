// src/app/api/products/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const bestseller = searchParams.get('bestseller')
    const newArrival = searchParams.get('new')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*),
        variants:product_variants(*)
      `)
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category.slug', category)
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }
    if (bestseller === 'true') {
      query = query.eq('is_bestseller', true)
    }
    if (newArrival === 'true') {
      query = query.eq('is_new', true)
    }
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      count,
      limit,
      offset,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}