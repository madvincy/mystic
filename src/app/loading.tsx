// src/app/loading.tsx
'use client'

import { motion } from 'framer-motion'
import { Package } from 'lucide-react'

// ✅ This must be a default export of a React component
export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="inline-block"
        >
          <Package className="h-12 w-12 text-pink-600 dark:text-pink-400" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Loading Mystic Wines...
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Please wait while we prepare your experience
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto mt-4">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-full bg-gradient-to-r from-pink-600 to-purple-600 rounded-full w-1/3"
          />
        </div>
      </div>
    </div>
  )
}