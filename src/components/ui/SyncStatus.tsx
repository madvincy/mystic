// src/components/ui/SyncStatus.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface SyncStatusProps {
  isSyncing: boolean
  progress?: number
  total?: number
  error?: string | null
  metrics?: {
    totalTime?: number
    productCount?: number
    fromCache?: boolean
  }
  onRetry?: () => void
}

export function SyncStatus({ 
  isSyncing, 
  progress = 0, 
  total = 0, 
  error = null,
  metrics,
  onRetry 
}: SyncStatusProps) {
  if (!isSyncing && !error && !metrics) return null

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[280px] max-w-sm"
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin text-pink-600" />
              ) : error ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-medium">
                {isSyncing ? 'Syncing products...' : error ? 'Sync failed' : 'Sync complete'}
              </span>
            </div>
            {!isSyncing && !error && metrics?.totalTime && (
              <span className="text-xs text-gray-500">
                {metrics.totalTime.toFixed(1)}s
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {isSyncing && total > 0 && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-pink-600 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{progress} / {total} items</span>
                <span>{percentage}%</span>
              </div>
            </div>
          )}

          {/* Stats */}
          {!isSyncing && metrics && !error && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 text-center">
                <p className="text-gray-500 dark:text-gray-400">Products</p>
                <p className="font-semibold">{metrics.productCount || 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 text-center">
                <p className="text-gray-500 dark:text-gray-400">Time</p>
                <p className="font-semibold">{metrics.totalTime?.toFixed(1)}s</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 text-center">
                <p className="text-gray-500 dark:text-gray-400">Source</p>
                <p className="font-semibold">{metrics.fromCache ? 'Cache' : 'Network'}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {error && onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Retry
              </button>
            )}
            {!isSyncing && !error && (
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}