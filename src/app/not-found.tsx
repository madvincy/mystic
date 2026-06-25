// src/app/not-found.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/shadCn/ui/button'
import { Home, ArrowLeft, Package, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated 404 */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-8xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
          >
            404
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -top-4 -right-4"
          >
            <Package className="h-12 w-12 text-pink-600 dark:text-pink-400" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-4"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-2 gap-3"
        >
          <Link href="/">
            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="col-span-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </motion.div>

        {/* Suggested Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Popular categories:
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Wine', 'Spirits', 'Sparkling', 'Energy Drinks', 'Merchandise'].map((category) => (
              <Link
                key={category}
                href={`/products?category=${category.toLowerCase()}`}
                className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
              >
                {category}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}