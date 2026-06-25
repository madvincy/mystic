// src/app/api/products/delete/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'



export async function DELETE(request: Request) {
  try {
   

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Delete variants first
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id)

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}