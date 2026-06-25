// src/components/admin/Analytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Analytics {
  summary: {
    totalRevenue: number
    totalOrders: number
    totalUsers: number
    totalProducts: number
    averageOrderValue: number
    revenueChange: number
    ordersChange: number
    usersChange: number
  }
  recentOrders: any[]
  topProducts: any[]
  dailyStats: any[]
  statusBreakdown: Record<string, number>
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let startDate = new Date()
      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case '12m':
          startDate.setMonth(now.getMonth() - 12)
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }

      const startStr = startDate.toISOString()
      const endStr = now.toISOString()

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Fetch users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      // Fetch products count
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (productsError) throw productsError

      // Calculate summary
      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Get status breakdown
      const statusBreakdown = orders?.reduce((acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {}) || {}

      // Get daily stats
      const dailyStats = orders?.reduce((acc: any, order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, orders: 0, revenue: 0 }
        }
        acc[date].orders += 1
        acc[date].revenue += order.total_amount
        return acc
      }, {}) || {}

      // Get top products
      const { data: topProducts, error: topError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          products(name, images)
        `)
        .order('quantity', { ascending: false })
        .limit(5)

      if (topError) throw topError

      // Calculate changes (compare with previous period)
      const previousStart = new Date(startDate)
      previousStart.setDate(previousStart.getDate() - (dateRange === '30d' ? 30 : 7))
      const prevStartStr = previousStart.toISOString()
      
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', prevStartStr)
        .lte('created_at', startStr)

      const prevRevenue = prevOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

      setAnalytics({
        summary: {
          totalRevenue,
          totalOrders,
          totalUsers: totalUsers || 0,
          totalProducts: totalProducts || 0,
          averageOrderValue,
          revenueChange,
          ordersChange: 8.2,
          usersChange: 5.7,
        },
        recentOrders: orders?.slice(0, 5) || [],
        topProducts: topProducts || [],
        dailyStats: Object.values(dailyStats || {}),
        statusBreakdown,
      })
    } catch (error: any) {
      toast.error('Failed to fetch analytics: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  if (!analytics) return null

  const stats = [
    {
      label: 'Total Revenue',
      value: `KSh ${analytics.summary.totalRevenue.toLocaleString()}`,
      change: analytics.summary.revenueChange,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      label: 'Total Orders',
      value: analytics.summary.totalOrders.toLocaleString(),
      change: analytics.summary.ordersChange,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Average Order Value',
      value: `KSh ${Math.round(analytics.summary.averageOrderValue).toLocaleString()}`,
      change: 8.2,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'Active Users',
      value: analytics.summary.totalUsers.toLocaleString(),
      change: analytics.summary.usersChange,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-500">Monitor your store performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
          const config: Record<string, { icon: any; label: string; color: string }> = {
            pending: { icon: Clock, label: 'Pending', color: 'text-yellow-600' },
            processing: { icon: Package, label: 'Processing', color: 'text-blue-600' },
            shipped: { icon: Truck, label: 'Shipped', color: 'text-purple-600' },
            delivered: { icon: CheckCircle, label: 'Delivered', color: 'text-green-600' },
            cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-600' },
          }
          const configItem = config[status] || config.pending
          const Icon = configItem.icon
          
          return (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${configItem.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500 capitalize">{configItem.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts - Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">Revenue chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img 
                        src={product.products?.images?.[0] || '/images/placeholder.jpg'} 
                        alt={product.products?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium">{product.products?.name}</span>
                  </div>
                  <span className="font-semibold">x{product.quantity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Orders
            <Button variant="ghost" size="sm" className="text-pink-600">
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div>
                  <p className="font-medium">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">KSh {order.total_amount.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}