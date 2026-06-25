// src/app/api/mpesa/callback/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📝 M-Pesa Callback received:', JSON.stringify(body, null, 2))

    const { Body } = body
    const { stkCallback } = Body

    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc 
    } = stkCallback

    if (ResultCode === 0) {
      const { CallbackMetadata } = stkCallback
      const items = CallbackMetadata.Item

      const amount = items.find((item: any) => item.Name === 'Amount')?.Value
      const mpesaReceipt = items.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value
      const phoneNumber = items.find((item: any) => item.Name === 'PhoneNumber')?.Value

      console.log('✅ Payment successful:', { mpesaReceipt, amount, phoneNumber })

      // ✅ Update order
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_receipt: mpesaReceipt,
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', CheckoutRequestID)

      if (error) {
        console.error('❌ Error updating order:', error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Error updating order' })
      }

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
    } else {
      console.error('❌ Payment failed:', ResultDesc)

      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', CheckoutRequestID)

      return NextResponse.json({ ResultCode: ResultCode, ResultDesc: ResultDesc })
    }
  } catch (error: any) {
    console.error('❌ Callback error:', error)
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Error processing callback' },
      { status: 500 }
    )
  }
}