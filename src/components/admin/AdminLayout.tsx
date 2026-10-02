// src/components/admin/AdminLayout.tsx
'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import AdminFooter from './AdminFooter'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'

const AdminShellContext = createContext(false)

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const insideAdminShell = useContext(AdminShellContext)
  const { user, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
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

  useEffect(() => {
    const syncSidebar = () => setSidebarOpen(window.innerWidth >= 1024)
    syncSidebar()
    window.addEventListener('resize', syncSidebar)
    return () => window.removeEventListener('resize', syncSidebar)
  }, [])

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
  const sidebar = useMemo(() => <AdminSidebar onNavigate={() => setSidebarOpen(false)} />, [])
  const navbar = useMemo(() => (
    <AdminNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
  ), [sidebarOpen])
  const footer = useMemo(() => <AdminFooter />, [])

  if (insideAdminShell) {
    return <>{children}</>
  }

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
    <AdminShellContext.Provider value={true}>
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      {navbar}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1">
        <div className={`fixed left-0 top-16 bottom-0 z-40 w-64 transition-transform duration-300 lg:top-0 lg:bottom-auto lg:h-full lg:pt-16 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {sidebar}
        </div>

        <main className="flex min-h-screen min-w-0 w-full flex-1 flex-col px-3 pb-4 pt-20 sm:px-4 sm:pt-24 lg:ml-64 lg:px-6 lg:pb-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-0 flex-1"
          >
            {children}
          </motion.div>
          
          {footer}
        </main>
      </div>
    </div>
    </AdminShellContext.Provider>
  )
}