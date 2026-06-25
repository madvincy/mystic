// src/app/api/wishlist/add/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, variantId } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId || '')
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') throw checkError

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Product already in wishlist',
        alreadyExists: true,
      })
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: session.user.id,
        product_id: productId,
        variant_id: variantId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'Added to wishlist',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}