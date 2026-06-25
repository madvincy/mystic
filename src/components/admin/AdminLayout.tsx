// src/components/admin/AdminLayout.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import AdminFooter from './AdminFooter'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!user || !isAdmin) {
        router.push('/')
      }
    }
  }, [user, isAdmin, isLoading, router])

  // Memoize sidebar to prevent unnecessary re-renders
  const sidebar = useMemo(() => (
    <AdminSidebar />
  ), [])

  // Memoize navbar to prevent unnecessary re-renders
  const navbar = useMemo(() => (
    <AdminNavbar 
      sidebarOpen={sidebarOpen} 
      setSidebarOpen={setSidebarOpen} 
    />
  ), [sidebarOpen])

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
      {/* ✅ Navbar stays static */}
      {navbar}
      
      <div className="flex flex-1">
        {/* ✅ Sidebar stays static */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 z-40 h-full w-64 pt-16"
            >
              {sidebar}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ Only content changes on navigation */}
        <main 
          className={`flex-1 p-6 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          } pt-24 flex flex-col min-h-screen`}
        >
          <motion.div
            key={pathname} // ✅ Key forces animation on route change
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {children}
          </motion.div>
          
          <AdminFooter />
        </main>
      </div>
    </div>
  )
}