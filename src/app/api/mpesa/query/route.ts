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

    console.log('🔍 Querying payment status for:', checkoutRequestId)

    // ✅ Get credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim()
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim()
    const shortcode = process.env.MPESA_SHORTCODE?.trim() || '174379'
    const passkey = process.env.MPESA_PASSKEY?.trim()

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { success: false, error: 'M-Pesa credentials not configured' },
        { status: 500 }
      )
    }

    // ✅ Get access token with better error handling
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

    console.log('🔑 Getting M-Pesa access token...')

    let accessToken: string
    try {
      const tokenResponse = await axios({
        method: 'GET',
        url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
        // ✅ Don't follow redirects
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
      })

      accessToken = tokenResponse.data.access_token
      
      if (!accessToken) {
        throw new Error('No access token received')
      }
      
      console.log('✅ Access token received')
      
    } catch (tokenError: any) {
      console.error('❌ Failed to get access token:')
      
      // ✅ Handle different error types
      if (tokenError.response) {
        console.error('  - Status:', tokenError.response.status)
        console.error('  - Data:', tokenError.response.data)
        
        // ✅ Check if it's a 403 error
        if (tokenError.response.status === 403) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'M-Pesa sandbox is currently blocking requests. Please try again later.',
              details: 'The sandbox API is rate limiting or blocking your IP.',
              troubleshooting: [
                '1. Wait a few minutes and try again',
                '2. Check your consumer key and secret are correct',
                '3. Make sure you are using sandbox credentials',
                '4. Try regenerating your credentials',
                '5. If using a VPN, try disabling it',
              ]
            },
            { status: 403 }
          )
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to authenticate with M-Pesa',
          details: tokenError.response?.data || tokenError.message
        },
        { status: tokenError.response?.status || 500 }
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

    // ✅ Prepare query payload
    const queryPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }

    console.log('📤 Querying M-Pesa...')

    // ✅ Query transaction status
    const queryResponse = await axios({
      method: 'POST',
      url: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      data: queryPayload,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
      maxRedirects: 0,
      validateStatus: (status) => status < 500,
    })

    console.log('✅ Query response:', queryResponse.data)

    return NextResponse.json({
      success: true,
      data: queryResponse.data,
    })
  } catch (error: any) {
    console.error('❌ M-Pesa query error:')
    
    if (error.response) {
      console.error('  - Status:', error.response.status)
      console.error('  - Data:', error.response.data)
      
      // ✅ Check for specific errors
      if (error.response.status === 403) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'M-Pesa sandbox is rate limiting. Please wait a moment and try again.',
            details: 'The API is currently blocking requests to prevent abuse.',
          },
          { status: 429 } // Too Many Requests
        )
      }
    }
    
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