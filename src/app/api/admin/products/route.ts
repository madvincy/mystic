// src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*),
        variants:product_variants(*)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category.slug', category)
    }
    if (status) {
      query = query.eq('stock_status', status)
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