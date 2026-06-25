// src/app/api/products/create/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {

    const body = await request.json()
    const { name, slug, description, price, sale_price, category_id, subcategory_id, images, is_featured, is_bestseller, is_new, stock_status, variants } = body

    // Validate required fields
    if (!name || !price || !category_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description: description || '',
        price,
        sale_price: sale_price || null,
        category_id,
        subcategory_id: subcategory_id || null,
        images: images || [],
        is_featured: is_featured || false,
        is_bestseller: is_bestseller || false,
        is_new: is_new || false,
        stock_status: stock_status || 'in_stock',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (productError) throw productError

    // Create variants if provided
    if (variants && variants.length > 0) {
      const variantData = variants.map((v: any) => ({
        product_id: product.id,
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

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}