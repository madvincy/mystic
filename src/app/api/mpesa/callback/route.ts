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

      // ✅ Update order using CheckoutRequestID as reference
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', CheckoutRequestID)
        .single()

      if (findError) {
        console.error('❌ Order not found:', findError)
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Order not found' })
      }

      // ✅ Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          payment_receipt: mpesaReceipt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('❌ Error updating order:', updateError)
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Error updating order' })
      }

      // ✅ Log payment
      await supabase
        .from('payment_logs')
        .insert({
          order_id: order.id,
          payment_method: 'mpesa',
          amount: amount,
          transaction_id: mpesaReceipt,
          status: 'completed',
          metadata: { 
            merchantRequestId: MerchantRequestID,
            checkoutRequestId: CheckoutRequestID,
            phoneNumber,
          },
        })

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
    } else {
      console.error('❌ Payment failed:', ResultDesc)

      // ✅ Update order status
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', CheckoutRequestID)
        .single()

      if (order) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)

        await supabase
          .from('payment_logs')
          .insert({
            order_id: order.id,
            payment_method: 'mpesa',
            amount: 0,
            status: 'failed',
            metadata: { 
              resultCode: ResultCode,
              resultDesc: ResultDesc,
              checkoutRequestId: CheckoutRequestID,
            },
          })
      }

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