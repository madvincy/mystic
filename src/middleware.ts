// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // ✅ Use createServerClient with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // ✅ Set cookies on response
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Define routes that require authentication
  const protectedRoutes = [
    '/profile',
    '/orders',
    '/wishlist',
    '/admin',
  ]

  // Routes that allow guests (checkout, cart, products)
  const guestRoutes = [
    '/checkout',
    '/cart',
    '/products',
    '/',
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
  )

  const isGuestRoute = guestRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
  )

  // Check if it's an API route
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

  // Allow all API routes (handled individually)
  if (isApiRoute) {
    return res
  }

  // Redirect to login if trying to access protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin routes - extra check for admin status
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    
    // ✅ Check if user is admin using the supabase client
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle() // ✅ Use maybeSingle() instead of single()
    
    if (!userData?.is_admin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // If user is authenticated, redirect from login/register to home
  if (session && (req.nextUrl.pathname === '/auth/login' || req.nextUrl.pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Allow guest routes (including checkout)
  if (isGuestRoute) {
    return res
  }

  return res
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)',
  ],
}