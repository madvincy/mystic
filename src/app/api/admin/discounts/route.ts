// src/app/api/admin/discounts/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'



export async function GET(request: Request) {
  try {
   

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const active = searchParams.get('active')

    let query = supabase
      .from('discounts')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (active === 'true') {
      query = query.eq('is_active', true)
    } else if (active === 'false') {
      query = query.eq('is_active', false)
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

export async function POST(request: Request) {
  try {
   

    const body = await request.json()
    const { name, description, discount_type, discount_value, code, min_order_amount, max_discount_amount, start_date, end_date, is_active, usage_limit } = body

    if (!name || !discount_type || !discount_value || !code || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('discounts')
      .insert({
        name,
        description: description || '',
        discount_type,
        discount_value,
        code: code.toUpperCase(),
        min_order_amount: min_order_amount || null,
        max_discount_amount: max_discount_amount || null,
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true,
        usage_limit: usage_limit || null,
        used_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'Discount created successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
   

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Discount ID is required' },
        { status: 400 }
      )
    }

    if (updates.code) {
      updates.code = updates.code.toUpperCase()
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('discounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'Discount updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
   

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Discount ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}