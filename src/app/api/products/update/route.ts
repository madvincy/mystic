// src/app/api/products/update/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (productError) throw productError

    // Update variants if provided
    if (updates.variants) {
      // Delete existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id)

      // Insert new variants
      if (updates.variants.length > 0) {
        const variantData = updates.variants.map((v: any) => ({
          product_id: id,
          variant_type: v.variant_type || 'volume',
          variant_value: v.variant_value,
          price: v.price || product.price,
          stock: v.stock || 0,
          sku: v.sku || null,
        }))

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantData)

        if (variantError) throw variantError
      }
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}