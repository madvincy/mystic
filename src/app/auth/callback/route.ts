// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, requestUrl)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=No%20authorization%20code', requestUrl)
    )
  }

  try {
    // ✅ Await cookies() first
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // ✅ Now cookieStore is resolved and has .get()
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    await supabase.auth.exchangeCodeForSession(code)
    console.log('✅ Session exchanged successfully')
    
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error: any) {
    console.error('❌ Callback error:', error)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`, requestUrl)
    )
  }
}