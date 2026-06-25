// src/app/api/webhooks/supabase/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, table, record, old_record } = body

    // Handle different events
    switch (`${table}.${type}`) {
      case 'orders.INSERT':
        // New order created
        console.log('New order created:', record.id)
        // Send notification or email
        break

      case 'orders.UPDATE':
        // Order updated
        console.log('Order updated:', record.id)
        // Check if status changed to delivered
        if (record.status === 'delivered' && old_record?.status !== 'delivered') {
          // Send delivery notification
        }
        break

      case 'orders.DELETE':
        // Order deleted
        console.log('Order deleted:', old_record?.id)
        break

      case 'products.INSERT':
        // New product added
        console.log('New product added:', record.name)
        // Invalidate cache
        break

      case 'products.UPDATE':
        // Product updated
        console.log('Product updated:', record.name)
        // Invalidate cache
        break

      case 'users.INSERT':
        // New user registered
        console.log('New user registered:', record.email)
        // Send welcome email
        break

      default:
        console.log(`Unhandled webhook: ${table}.${type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Supabase webhook error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}