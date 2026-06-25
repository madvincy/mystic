// src/components/ui/ErrorBoundary.tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/shadCn/ui/button'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'
import { toast } from 'sonner'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    toast.error('Something went wrong', {
      description: error.message || 'An unexpected error occurred',
      duration: 5000,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    })
    
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-[400px] flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto max-h-32">
                <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Need help?{' '}
                <button
                  onClick={() => window.open('https://wa.me/254710835445', '_blank')}
                  className="text-pink-600 dark:text-pink-400 hover:underline"
                >
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      )
    }

    return this.props.children
  }
}