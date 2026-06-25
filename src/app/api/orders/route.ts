// src/app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    // ✅ Get the authenticated user from the request
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ Extract the token
    const token = authHeader.replace('Bearer ', '')
    
    // ✅ Get user from Supabase using the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ Check if user is admin
    const { data: userData, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('Error checking admin status:', adminError)
    }

    const isAdmin = userData?.is_admin || false

    // ✅ Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')

    // ✅ Build the query
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users(name, email, phone),
        items:order_items(
          *,
          product:products(name, images),
          variant:product_variants(variant_value)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // ✅ Apply filters based on user role
    if (!isAdmin) {
      // ✅ Non-admin users can only see their own orders
      query = query.eq('user_id', user.id)
    } else if (userId) {
      // ✅ Admin can filter by specific user
      query = query.eq('user_id', userId)
    }

    // ✅ Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // ✅ Execute the query
    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      count,
      limit,
      offset,
      isAdmin,
    })
  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}