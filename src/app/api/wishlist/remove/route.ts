// src/app/api/wishlist/remove/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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
      .eq('user_id', session.user.id)
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