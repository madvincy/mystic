// src/app/api/admin/flash-sales/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const active = searchParams.get('active')

    let query = supabase
      .from('flash_sales')
      .select(`
        *,
        products:flash_sale_products(
          *,
          product:products(*),
          variant:product_variants(*)
        )
      `, { count: 'exact' })
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
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, start_time, end_time, is_active, products } = body

    if (!name || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create flash sale
    const { data: flashSale, error: flashError } = await supabase
      .from('flash_sales')
      .insert({
        name,
        description: description || '',
        start_time,
        end_time,
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (flashError) throw flashError

    // Add products if provided
    if (products && products.length > 0) {
      const productData = products.map((p: any) => ({
        flash_sale_id: flashSale.id,
        product_id: p.product_id,
        variant_id: p.variant_id || null,
        discount_percentage: p.discount_percentage,
        sale_price: p.sale_price,
        quantity_limit: p.quantity_limit || null,
        sold_count: 0,
        created_at: new Date().toISOString(),
      }))

      const { error: productError } = await supabase
        .from('flash_sale_products')
        .insert(productData)

      if (productError) throw productError
    }

    return NextResponse.json({
      success: true,
      data: flashSale,
      message: 'Flash sale created successfully',
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
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Flash sale ID is required' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('flash_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update products if provided
    if (updates.products) {
      // Delete existing products
      await supabase
        .from('flash_sale_products')
        .delete()
        .eq('flash_sale_id', id)

      // Insert new products
      if (updates.products.length > 0) {
        const productData = updates.products.map((p: any) => ({
          flash_sale_id: id,
          product_id: p.product_id,
          variant_id: p.variant_id || null,
          discount_percentage: p.discount_percentage,
          sale_price: p.sale_price,
          quantity_limit: p.quantity_limit || null,
          sold_count: 0,
          created_at: new Date().toISOString(),
        }))

        const { error: productError } = await supabase
          .from('flash_sale_products')
          .insert(productData)

        if (productError) throw productError
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Flash sale updated successfully',
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
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Flash sale ID is required' },
        { status: 400 }
      )
    }

    // Delete flash sale products first
    await supabase
      .from('flash_sale_products')
      .delete()
      .eq('flash_sale_id', id)

    // Delete flash sale
    const { error } = await supabase
      .from('flash_sales')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Flash sale deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}