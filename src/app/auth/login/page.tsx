// src/app/auth/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Label } from '@/components/shadCn/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
import { Chrome, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  // Check for error in URL params
  useEffect(() => {
    const error = searchParams?.get('error')
    const errorDescription = searchParams?.get('error_description')
    
    if (error) {
      const message = errorDescription || error || 'Authentication failed'
      setAuthError(message)
      toast.error(message)
    }
  }, [searchParams])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setAuthError(null)

      const redirectTo = `${window.location.origin}/auth/callback`
      console.log('🔍 Signing in with Google, redirect to:', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ Google sign in error:', error)
        setAuthError(error.message)
        toast.error(error.message || 'Failed to sign in with Google')
        setIsLoading(false)
        return
      }

      console.log('✅ Google sign in initiated:', data)
      // The user will be redirected to Google
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error)
      setAuthError(error.message || 'Failed to sign in')
      toast.error(error.message || 'Failed to sign in')
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthError(error.message)
        toast.error(error.message)
        return
      }

      toast.success('Welcome back! 🎉')
      router.push('/')
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign in')
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            M
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Sign in to your Mystic Wines account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Display */}
          {authError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Chrome className="mr-2 h-5 w-5" />
            {isLoading ? 'Redirecting...' : 'Continue with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="mystic@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}