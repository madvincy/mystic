// src/app/api/wishlist/remove/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'



export async function DELETE(request: Request) {
  try {
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


    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId')

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (variantId) {
      query = query.eq('variant_id', variantId)
    }

    const { error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Removed from wishlist',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}