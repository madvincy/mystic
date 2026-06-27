// src/components/admin/AdminLayout.tsx
'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import AdminFooter from './AdminFooter'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const authChecked = useRef(false)

  const checkAuth = useCallback(() => {
    if (authChecked.current) return
    
    if (!isLoading) {
      authChecked.current = true
      if (!user || !isAdmin) {
        router.push('/')
      }
    }
  }, [user, isAdmin, isLoading, router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Prevent re-renders when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        return
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Memoize components
  const sidebar = useMemo(() => <AdminSidebar />, [])
  const navbar = useMemo(() => (
    <AdminNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
  ), [sidebarOpen])
  const footer = useMemo(() => <AdminFooter />, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {navbar}
      
      <div className="flex flex-1">
        <div className={`fixed left-0 top-0 z-40 h-full w-64 pt-16 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {sidebar}
        </div>

        <main className={`flex-1 p-6 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        } pt-24 flex flex-col min-h-screen`}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {children}
          </motion.div>
          
          {footer}
        </main>
      </div>
    </div>
  )
}