// src/app/api/products/bulk/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { products } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Products array is required' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const product of products) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
            description: product.description || '',
            price: product.price,
            sale_price: product.sale_price || null,
            category_id: product.category_id,
            subcategory_id: product.subcategory_id || null,
            images: product.images || [],
            is_featured: product.is_featured || false,
            is_bestseller: product.is_bestseller || false,
            is_new: product.is_new || false,
            stock_status: product.stock_status || 'in_stock',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          errors.push({ product: product.name, error: error.message })
        } else {
          results.push(data)
        }
      } catch (error: any) {
        errors.push({ product: product.name, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${results.length} products${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}