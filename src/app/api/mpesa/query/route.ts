// src/app/api/mpesa/query/route.ts
import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { checkoutRequestId } = body

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, error: 'CheckoutRequestID is required' },
        { status: 400 }
      )
    }

    // Get access token
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

    // Query transaction status
    const queryResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: Buffer.from(
          `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`
        ).toString('base64'),
        Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14),
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return NextResponse.json({
      success: true,
      data: queryResponse.data,
    })
  } catch (error: any) {
    console.error('M-Pesa query error:', error.response?.data || error.message)
    return NextResponse.json(
      { success: false, error: error.response?.data?.errorMessage || error.message },
      { status: 500 }
    )
  }
}