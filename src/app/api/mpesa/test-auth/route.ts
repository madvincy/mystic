// src/app/api/mpesa/test-auth/route.ts
import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim()
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim()

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        details: {
          hasConsumerKey: !!consumerKey,
          hasConsumerSecret: !!consumerSecret,
        }
      })
    }

    // ✅ Test with base64 encoding
    const authString = `${consumerKey}:${consumerSecret}`
    const authBase64 = Buffer.from(authString).toString('base64')

    console.log('🔑 Testing M-Pesa Auth:')
    console.log('  - Consumer Key (first 8):', consumerKey.substring(0, 8) + '...')
    console.log('  - Auth String Length:', authString.length)
    console.log('  - Base64 Length:', authBase64.length)

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${authBase64}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    return NextResponse.json({
      success: true,
      message: '✅ Authentication successful!',
      tokenReceived: !!response.data.access_token,
      expiresIn: response.data.expires_in,
      accessTokenPreview: response.data.access_token?.substring(0, 20) + '...',
    })

  } catch (error: any) {
    console.error('❌ Auth test failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    })

    return NextResponse.json({
      success: false,
      error: error.response?.data?.errorMessage || error.message,
      status: error.response?.status,
      details: error.response?.data,
      troubleshooting: [
        '1. Verify your consumer key is correct (no extra spaces)',
        '2. Verify your consumer secret is correct (no extra spaces)',
        '3. Make sure you are using SANDBOX credentials, not production',
        '4. Try regenerating your credentials on developer.safaricom.co.ke',
        '5. Check if your app is active in the sandbox environment',
      ]
    }, { status: error.response?.status || 500 })
  }
}