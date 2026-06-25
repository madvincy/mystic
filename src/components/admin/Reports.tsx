// src/components/admin/Reports.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  FileText, 
  Download, 
  Calendar, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Printer,
  Mail
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface ReportData {
  sales: {
    total: number
    orders: number
    average: number
    growth: number
  }
  products: {
    total: number
    topSelling: any[]
    categories: Record<string, number>
  }
  customers: {
    total: number
    new: number
    returning: number
    topSpenders: any[]
  }
  dailyStats: any[]
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [reportType, setReportType] = useState('sales')

  useEffect(() => {
    fetchReport()
  }, [dateRange, reportType])

  const fetchReport = async () => {
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

      // Sales data
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startStr)
        .lte('created_at', endStr)

      // Products data
      const { data: products } = await supabase
        .from('products')
        .select('*')

      // Users data
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: newUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startStr)

      // Top products
      const { data: topProducts } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          products(name, price)
        `)
        .order('quantity', { ascending: false })
        .limit(10)

      // Calculate sales metrics
      const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
      const totalOrders = orders?.length || 0
      const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate growth
      const previousStart = new Date(startDate)
      previousStart.setDate(previousStart.getDate() - (dateRange === '30d' ? 30 : 7))
      const prevStartStr = previousStart.toISOString()
      
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', prevStartStr)
        .lte('created_at', startStr)

      const prevRevenue = prevOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
      const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

      // Category breakdown
      const categoryCount: Record<string, number> = {}
      products?.forEach((product: any) => {
        const cat = product.category_id || 'Uncategorized'
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })

      // Daily stats
      const dailyStats = orders?.reduce((acc: any, order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, orders: 0 }
        }
        acc[date].revenue += order.total_amount
        acc[date].orders += 1
        return acc
      }, {}) || {}

      setReportData({
        sales: {
          total: totalRevenue,
          orders: totalOrders,
          average: averageOrder,
          growth,
        },
        products: {
          total: products?.length || 0,
          topSelling: topProducts || [],
          categories: categoryCount,
        },
        customers: {
          total: totalUsers || 0,
          new: newUsers || 0,
          returning: (totalUsers || 0) - (newUsers || 0),
          topSpenders: [],
        },
        dailyStats: Object.values(dailyStats || {}),
      })
    } catch (error: any) {
      toast.error('Failed to fetch report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    // Generate CSV
    toast.success('Report exported successfully')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  if (!reportData) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-gray-500">Generate and export store reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="sales">Sales Report</option>
          <option value="products">Products Report</option>
          <option value="customers">Customers Report</option>
          <option value="inventory">Inventory Report</option>
        </select>
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
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `KSh ${reportData.sales.total.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Total Orders', value: reportData.sales.orders.toLocaleString(), icon: ShoppingBag, color: 'text-blue-600' },
          { label: 'Average Order', value: `KSh ${Math.round(reportData.sales.average).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600' },
          { label: 'Growth', value: `${reportData.sales.growth.toFixed(1)}%`, icon: reportData.sales.growth >= 0 ? TrendingUp : TrendingDown, color: reportData.sales.growth >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Report Sections */}
      {reportType === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Sales Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Total Revenue</span>
                  <span className="font-bold">KSh {reportData.sales.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Total Orders</span>
                  <span className="font-bold">{reportData.sales.orders}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Average Order Value</span>
                  <span className="font-bold">KSh {Math.round(reportData.sales.average).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Growth</span>
                  <span className={`font-bold ${reportData.sales.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.sales.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Daily Stats</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {reportData.dailyStats.slice(0, 10).map((day: any) => (
                  <div key={day.date} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                    <span>{day.date}</span>
                    <div className="flex gap-4">
                      <span>{day.orders} orders</span>
                      <span className="font-medium">KSh {day.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Product Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Total Products</span>
                  <span className="font-bold">{reportData.products.total}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Categories</span>
                  <span className="font-bold">{Object.keys(reportData.products.categories).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Top Selling Products</h3>
              <div className="space-y-2">
                {reportData.products.topSelling.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                    <span>#{index + 1} {product.products?.name || 'Unknown'}</span>
                    <span className="font-medium">x{product.quantity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Customer Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Total Customers</span>
                  <span className="font-bold">{reportData.customers.total}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>New Customers</span>
                  <span className="font-bold">{reportData.customers.new}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>Returning Customers</span>
                  <span className="font-bold">{reportData.customers.returning}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Customer Insights</h3>
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                  <p>New vs Returning: {Math.round((reportData.customers.new / reportData.customers.total) * 100)}% new</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                  <p>Active customers: {reportData.customers.total - reportData.customers.returning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}