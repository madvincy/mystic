// src/app/api/webhooks/mpesa/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { Body } = body
    const { stkCallback } = Body

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback

    if (ResultCode === 0) {
      // Payment successful
      const { CallbackMetadata } = stkCallback
      const items = CallbackMetadata.Item

      const amount = items.find((item: any) => item.Name === 'Amount')?.Value
      const mpesaReceipt = items.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value
      const phoneNumber = items.find((item: any) => item.Name === 'PhoneNumber')?.Value

      // Update order payment status
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_receipt: mpesaReceipt,
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', CheckoutRequestID)

      if (error) {
        console.error('Error updating order:', error)
      }

      // Log successful payment
      await supabase
        .from('payment_logs')
        .insert({
          order_id: CheckoutRequestID,
          transaction_id: mpesaReceipt,
          amount,
          phone: phoneNumber,
          status: 'success',
          created_at: new Date().toISOString(),
        })

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
    } else {
      // Payment failed
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', CheckoutRequestID)

      if (error) {
        console.error('Error updating order:', error)
      }

      // Log failed payment
      await supabase
        .from('payment_logs')
        .insert({
          order_id: CheckoutRequestID,
          status: 'failed',
          error: ResultDesc,
          created_at: new Date().toISOString(),
        })

      return NextResponse.json({ ResultCode: ResultCode, ResultDesc: ResultDesc })
    }
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Error processing webhook' },
      { status: 500 }
    )
  }
}