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

    // ✅ Get credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim()
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim()
    const shortcode = process.env.MPESA_SHORTCODE?.trim() || '174379'
    const passkey = process.env.MPESA_PASSKEY?.trim()

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'M-Pesa credentials not configured'
        },
        { status: 500 }
      )
    }

    // ✅ Get access token
    const authBase64 = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

    let accessToken: string
    try {
      const tokenResponse = await axios({
        method: 'GET',
        url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        headers: {
          'Authorization': `Basic ${authBase64}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })

      accessToken = tokenResponse.data.access_token
      
      if (!accessToken) {
        throw new Error('No access token received')
      }
      
    } catch (tokenError: any) {
      console.error('Failed to get access token:', tokenError.response?.data || tokenError.message)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to authenticate with M-Pesa',
          details: tokenError.response?.data || tokenError.message
        },
        { status: 500 }
      )
    }

    // ✅ Generate timestamp
    const now = new Date()
    const timestamp = 
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')

    // ✅ Generate password
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    // ✅ Get callback URL
    const baseUrl = process.env.MPESA_CALLBACK_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.NGROK_URL

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: 'Callback URL not configured' },
        { status: 500 }
      )
    }

    const callbackUrl = `${baseUrl.replace(/\/+$/, '')}/api/mpesa/callback`

    // ✅ Prepare STK Push payload
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderId,
      TransactionDesc: `Payment for order ${orderId}`,
    }

    // ✅ Send STK Push
    const stkResponse = await axios({
      method: 'POST',
      url: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      data: stkPayload,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    return NextResponse.json({
      success: true,
      data: stkResponse.data,
      message: 'STK Push sent successfully',
    })

  } catch (error: any) {
    console.error('M-Pesa error:', error.response?.data || error.message)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.errorMessage || error.message,
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    )
  }
}