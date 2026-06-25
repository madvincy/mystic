// src/app/api/debug-env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const env = {
    AUTH_SECRET: process.env.AUTH_SECRET ? 'SET' : 'MISSING',
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'MISSING',
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    variables: env,
  })
}