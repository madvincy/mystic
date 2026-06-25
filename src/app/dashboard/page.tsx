// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Package, ShoppingBag, Users, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
  })

  // Check admin status and fetch stats
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // 1. Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
        } else {
          setIsAdmin(userData?.is_admin || false)
        }

        // 2. Fetch user stats
        if (!userError) {
          // Get orders count
          const { count: ordersCount, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if (!ordersError) {
            setStats(prev => ({ ...prev, totalOrders: ordersCount || 0 }))
          }

          // Get total spent
          const { data: ordersData, error: spentError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id)
            .eq('payment_status', 'paid')

          if (!spentError && ordersData) {
            const totalSpent = ordersData.reduce((sum, order) => sum + order.total_amount, 0)
            setStats(prev => ({ ...prev, totalSpent }))
          }

          // Get wishlist count
          const { count: wishlistCount, error: wishlistError } = await supabase
            .from('wishlist')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if (!wishlistError) {
            setStats(prev => ({ ...prev, wishlistCount: wishlistCount || 0 }))
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
        setLoading(false)
      } else {
        fetchUserData()
      }
    }
  }, [user, authLoading, router])

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Admin stats
  const adminStats = [
    { title: 'Total Revenue', value: `KSh ${stats.totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { title: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-blue-600' },
    { title: 'Total Users', value: '0', icon: Users, color: 'text-purple-600' },
    { title: 'Total Products', value: '0', icon: Package, color: 'text-pink-600' },
  ]

  // User stats
  const userStats = [
    { title: 'My Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-blue-600' },
    { title: 'Wishlist', value: stats.wishlistCount.toLocaleString(), icon: Package, color: 'text-pink-600' },
    { title: 'Total Spent', value: `KSh ${stats.totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { title: 'Active', value: 'Yes', icon: Clock, color: 'text-green-600' },
  ]

  const displayStats = isAdmin ? adminStats : userStats
  const userName = user.user_metadata?.name || user.email || 'User'

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, {userName}!
              {isAdmin && (
                <span className="ml-2 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </p>
          </div>
          {isAdmin && (
            <span className="text-sm text-gray-500">👑 Admin Access</span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totalOrders === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent orders</p>
              ) : (
                <div className="space-y-3">
                  {/* Add recent orders list here */}
                  <p className="text-gray-500 text-center py-4">Loading orders...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button 
                  onClick={() => router.push('/admin/products/add')}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Add New Product
                </button>
                <button 
                  onClick={() => router.push('/admin/orders')}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Manage Orders
                </button>
                <button 
                  onClick={() => router.push('/admin/analytics')}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  View Analytics
                </button>
              </CardContent>
            </Card>
          )}

          {!isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button 
                  onClick={() => router.push('/products')}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Browse Products
                </button>
                <button 
                  onClick={() => router.push('/wishlist')}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  View Wishlist
                </button>
                <button 
                  onClick={() => router.push('/orders')}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  My Orders
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  )
}