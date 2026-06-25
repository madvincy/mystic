// src/app/api/mpesa/stk-push/route.ts
import { NextResponse } from 'next/server'
import axios from 'axios'
import { validateMpesaPhone } from '@/lib/utils/mpesa'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phoneNumber, amount, orderId } = body

    if (!phoneNumber || !amount || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Validate and format phone number
    let formattedPhone: string
    try {
      formattedPhone = validateMpesaPhone(phoneNumber)
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: 'INVALID_PHONE'
        },
        { status: 400 }
      )
    }

    // ✅ Get access token
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64')

    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    const accessToken = tokenResponse.data.access_token

    // ✅ Generate timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)

    // ✅ Generate password
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    // ✅ Get callback URL
    const baseUrl = process.env.MPESA_CALLBACK_URL?.replace(/\/$/, '') || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/mpesa/callback`

    console.log('📝 M-Pesa Request:')
    console.log('  - Original Phone:', phoneNumber)
    console.log('  - Formatted Phone:', formattedPhone)
    console.log('  - Amount:', amount)
    console.log('  - Callback URL:', callbackUrl)

    // ✅ STK Push request
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: orderId,
        TransactionDesc: `Payment for order ${orderId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    console.log('✅ M-Pesa STK Push sent:', stkResponse.data)

    return NextResponse.json({
      success: true,
      data: stkResponse.data,
      message: 'STK Push sent successfully',
    })

  } catch (error: any) {
    console.error('❌ M-Pesa error:', error.response?.data || error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.errorMessage || error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    )
  }
}