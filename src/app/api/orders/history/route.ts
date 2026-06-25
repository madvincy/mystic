// src/app/api/orders/history/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'



export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error, count } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, images),
          variant:product_variants(variant_value)
        )
      `)
      .eq('user_id', searchParams.get('user_id'))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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