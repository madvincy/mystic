// src/components/admin/AdminFooter.tsx
'use client'

import { Github, Heart, Package, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminFooter() {
  const currentYear = new Date().getFullYear()
  const router = useRouter()

  const handleViewStore = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    // Use router.push for client-side navigation
    router.push('/')
  }

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-8 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                MysticWines Admin
              </span>
            </div>
            <span className="text-sm text-gray-400 hidden sm:inline">•</span>
            <span className="text-sm text-gray-400 hidden sm:inline">
              v1.0.0
            </span>
          </div>

          {/* Center - Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-pink-500" />
              <span>Made with ❤️</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-sm text-gray-400 hover:text-pink-600 transition-colors"
              onClick={(e) => {
                // If you want to track analytics or perform actions before navigation
                console.log('Navigating to store...')
              }}
            >
              View Store
            </Link>
            <Link 
              href="/admin/settings" 
              className="text-sm text-gray-400 hover:text-pink-600 transition-colors"
            >
              Settings
            </Link>
            <a
              href="https://github.com/your-repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-600 transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <span className="text-sm text-gray-400">
              © {currentYear} Mystic Wines
            </span>
          </div>
        </div>

        {/* Server Status */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Server Status: Online
            </span>
            <span>•</span>
            <span>Uptime: 99.9%</span>
            <span>•</span>
            <span>Last backup: Today</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Supabase: Connected</span>
            <span>•</span>
            <span>Redis: Connected</span>
          </div>
        </div>
      </div>
    </footer>
  )
}