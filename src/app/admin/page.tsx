// src/app/admin/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return
    
    
    if (!user || !isAdmin) {
      router.push('/')
    }
  }, [user, isAdmin, router])

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }


  // If not admin, return null (will redirect)
  if (!user || !isAdmin) {
    return null
  }

  return (
    <AdminLayout>
      <AnalyticsDashboard />
    </AdminLayout>
  )
}