// src/app/error.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  AlertCircle, 
  RefreshCw, 
  Home, 
  ArrowLeft,
  WifiOff,
  ShieldAlert,
  Bug,
  MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/shadCn/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to console
    console.error('Global Error:', error)
    
    // Show toast notification
    toast.error('Something went wrong!', {
      description: error.message || 'An unexpected error occurred',
      duration: 5000,
    })
  }, [error])

  // Determine error type for better UI
  const getErrorInfo = () => {
    const message = error.message?.toLowerCase() || ''
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        icon: WifiOff,
        title: 'Network Error',
        description: 'Please check your internet connection and try again.',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      }
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('login')) {
      return {
        icon: ShieldAlert,
        title: 'Authentication Error',
        description: 'You need to be logged in to access this page.',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20'
      }
    }
    if (message.includes('not found') || message.includes('404')) {
      return {
        icon: AlertCircle,
        title: 'Not Found',
        description: 'The page or resource you\'re looking for does not exist.',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20'
      }
    }
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return {
        icon: AlertCircle,
        title: 'Server Error',
        description: 'Our servers are experiencing issues. Please try again later.',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
      }
    }
    return {
      icon: Bug,
      title: 'Something Went Wrong',
      description: error.message || 'An unexpected error occurred. Please try again.',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    }
  }

  const errorInfo = getErrorInfo()
  const Icon = errorInfo.icon

  const handleRetry = async () => {
    try {
      await reset()
    } catch (e) {
      toast.error('Retry failed. Please try again later.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Error Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Header with Icon */}
          <div className={`p-6 text-center ${errorInfo.bgColor}`}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div className="inline-flex p-4 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                <Icon className={`h-12 w-12 ${errorInfo.color}`} />
              </div>
            </motion.div>
            <h1 className={`text-2xl font-bold mt-4 ${errorInfo.color}`}>
              {errorInfo.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              {errorInfo.description}
            </p>
          </div>

          {/* Error Details */}
          <div className="p-6 space-y-4">
            {error.digest && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Error ID: <span className="font-mono">{error.digest}</span>
                </p>
              </div>
            )}

            {/* Error Message (Development only) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs text-red-500 dark:text-red-300 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleRetry}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              If the problem persists, please{' '}
              <button
                onClick={() => {
                  window.open('https://wa.me/254710835445', '_blank')
                }}
                className="text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" />
                contact support
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}