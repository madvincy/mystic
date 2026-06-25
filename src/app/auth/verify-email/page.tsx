// src/app/auth/verify-email/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
import { Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const token = searchParams?.get('token')
  const type = searchParams?.get('type')

  useEffect(() => {
    // Auto-verify if token is present
    if (token && type === 'signup') {
      verifyEmail(token)
    }
  }, [token, type])

  const verifyEmail = async (token: string) => {
    setVerificationStatus('verifying')
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      })

      if (error) {
        setVerificationStatus('error')
        setErrorMessage(error.message)
        toast.error(error.message)
        return
      }

      setVerificationStatus('success')
      toast.success('Email verified successfully!')
    } catch (error: any) {
      setVerificationStatus('error')
      setErrorMessage(error.message || 'Failed to verify email')
      toast.error('Failed to verify email')
    }
  }

  const resendVerificationEmail = async () => {
    setIsLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Please login to resend verification email')
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Verification email resent! Please check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email')
    } finally {
      setIsLoading(false)
    }
  }

  // Show verification status
  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
              <CardDescription>
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto mb-4"
              >
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </motion.div>
              <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                You can now access all features of Mystic Wines.
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
              <CardDescription>
                {errorMessage || 'The verification link is invalid or has expired.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={resendVerificationEmail}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Default: Email sent message
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to your email address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Please check your email and click on the verification link to activate your account.
              </p>
            </div>

            <Button
              onClick={resendVerificationEmail}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              Already verified?{' '}
              <Link href="/auth/login" className="text-pink-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <Link href="/" className="hover:text-pink-600">Home</Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-pink-600">Contact Support</Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}