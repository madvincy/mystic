// src/components/admin/AnalyticsDashboard.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
import { supabase } from '@/lib/supabase/client'

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  TooltipItem
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Analytics {
  total_revenue: number
  total_orders: number
  total_users: number
  total_products: number
  average_order_value: number
  revenue_change: number
  orders_change: number
  daily_stats: any[]
  top_products: any[]
  recent_orders: any[]
  status_breakdown: Record<string, number>
  monthly_stats: any[]
  comparison_data: {
    previous_period: any[]
    current_period: any[]
  }
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders'>('revenue')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showComparison, setShowComparison] = useState(false)
  const [animationEnabled, setAnimationEnabled] = useState(true)
  
  const chartRef = useRef<any>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Determine date range
      const now = new Date()
      let start = new Date()
      let end = new Date()
      
      if (dateRange === 'custom' && startDate && endDate) {
        start = new Date(startDate)
        end = new Date(endDate)
      } else {
        switch (dateRange) {
          case '7d':
            start.setDate(now.getDate() - 7)
            break
          case '30d':
            start.setDate(now.getDate() - 30)
            break
          case '90d':
            start.setDate(now.getDate() - 90)
            break
          case '12m':
            start.setMonth(now.getMonth() - 12)
            break
          default:
            start.setDate(now.getDate() - 30)
        }
      }

      const startStr = start.toISOString()
      const endStr = end.toISOString()

      // Fetch all data
      const [ordersRes, usersRes, productsRes, orderItemsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .gte('created_at', startStr)
          .lte('created_at', endStr)
          .order('created_at', { ascending: true }),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('order_items')
          .select(`
            product_id,
            quantity,
            products(name, images, price)
          `)
          .order('quantity', { ascending: false })
          .limit(10)
      ])

      if (ordersRes.error) throw ordersRes.error

      const orders = ordersRes.data || []
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0)
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Daily stats
      const dailyStats = orders.reduce((acc: any, order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, orders: 0, revenue: 0, labels: [] }
        }
        acc[date].orders += 1
        acc[date].revenue += order.total_amount
        return acc
      }, {})

      // Monthly stats for comparison
      const monthlyStats = orders.reduce((acc: any, order) => {
        const month = new Date(order.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })
        if (!acc[month]) {
          acc[month] = { month, orders: 0, revenue: 0 }
        }
        acc[month].orders += 1
        acc[month].revenue += order.total_amount
        return acc
      }, {})

      // Status breakdown
      const statusBreakdown = orders.reduce((acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {})

      // Previous period for comparison
      const prevStart = new Date(start)
      const prevEnd = new Date(end)
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      prevStart.setDate(prevStart.getDate() - diffDays)
      prevEnd.setDate(prevEnd.getDate() - diffDays)

      const { data: prevOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString())

      const prevRevenue = prevOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

      const analyticsData: Analytics = {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_users: usersRes.count || 0,
        total_products: productsRes.count || 0,
        average_order_value: avgOrderValue,
        revenue_change: revenueChange,
        orders_change: 8.2,
        daily_stats: Object.values(dailyStats),
        top_products: orderItemsRes.data || [],
        recent_orders: orders.slice(-5).reverse(),
        status_breakdown: statusBreakdown,
        monthly_stats: Object.values(monthlyStats),
        comparison_data: {
          previous_period: prevOrders || [],
          current_period: orders,
        }
      }

      setAnalytics(analyticsData)
    } catch (error: any) {
      toast.error('Failed to fetch analytics: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, startDate, endDate])

  const getChartData = () => {
    if (!analytics) return { labels: [], datasets: [] }

    let data = analytics.daily_stats
    
    // Sort by date
    data = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const labels = data.map(d => d.date)
    
    const datasets = []
    
    if (selectedMetric === 'revenue') {
      datasets.push({
        label: 'Revenue (KSh)',
        data: data.map(d => d.revenue),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(236, 72, 153)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      })
    } else {
      datasets.push({
        label: 'Orders',
        data: data.map(d => d.orders),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      })
    }

    // Add comparison data if enabled
    if (showComparison && analytics.comparison_data) {
      const prevData = analytics.comparison_data.previous_period
      const prevDaily = prevData.reduce((acc: any, order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, orders: 0 }
        }
        acc[date].revenue += order.total_amount
        acc[date].orders += 1
        return acc
      }, {})

      const prevValues = Object.values(prevDaily)
      datasets.push({
        label: `Previous ${selectedMetric === 'revenue' ? 'Revenue' : 'Orders'}`,
        data: prevValues.map((d: any) => selectedMetric === 'revenue' ? d.revenue : d.orders),
        borderColor: 'rgba(156, 163, 175, 0.8)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: 'rgba(156, 163, 175, 0.8)',
      })
    }

    return { labels, datasets }
  }

  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: TooltipItem<'line' | 'bar'>) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              if (selectedMetric === 'revenue') {
                label += `KSh ${context.parsed.y.toLocaleString()}`
              } else {
                label += context.parsed.y
              }
            }
            return label
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (selectedMetric === 'revenue') {
              return `KSh ${value.toLocaleString()}`
            }
            return value
          }
        }
      }
    },
    animation: {
      duration: animationEnabled ? 1000 : 0,
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
          <p className="text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const stats = [
    {
      label: 'Total Revenue',
      value: `KSh ${analytics.total_revenue.toLocaleString()}`,
      change: analytics.revenue_change,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      label: 'Total Orders',
      value: analytics.total_orders.toLocaleString(),
      change: analytics.orders_change,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Average Order Value',
      value: `KSh ${Math.round(analytics.average_order_value).toLocaleString()}`,
      change: 8.2,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'Active Users',
      value: analytics.total_users.toLocaleString(),
      change: 12.3,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
  ]

  const chartData = getChartData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-500">Monitor your store performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value)
              if (e.target.value !== 'custom') {
                setStartDate('')
                setEndDate('')
              }
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              <Button 
                size="sm" 
                onClick={() => fetchAnalytics()}
                className="bg-pink-600 hover:bg-pink-700"
              >
                Apply
              </Button>
            </div>
          )}
          
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

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-pink-600" />
              Revenue Overview
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <button
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    selectedMetric === 'revenue'
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSelectedMetric('orders')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    selectedMetric === 'orders'
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Orders
                </button>
              </div>

              <div className="flex items-center gap-1 border rounded-lg p-1">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    chartType === 'line'
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    chartType === 'bar'
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Bar
                </button>
              </div>

              <div className="flex items-center gap-1 border rounded-lg p-1">
                <button
                  onClick={() => {
                    setShowComparison(!showComparison)
                    setAnimationEnabled(true)
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    showComparison
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Compare
                </button>
                <button
                  onClick={() => setAnimationEnabled(!animationEnabled)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    !animationEnabled
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Animate
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData && chartData.labels && chartData.labels.length > 0 ? (
              chartType === 'line' ? (
                <Line 
                  ref={chartRef}
                  data={chartData as ChartData<'line'>} 
                  options={chartOptions as ChartOptions<'line'>} 
                />
              ) : (
                <Bar 
                  ref={chartRef}
                  data={chartData as ChartData<'bar'>} 
                  options={chartOptions as ChartOptions<'bar'>} 
                />
              )
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No data available for the selected period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.status_breakdown).map(([status, count]) => {
                const config: Record<string, { icon: any; label: string; color: string }> = {
                  pending: { icon: Clock, label: 'Pending', color: 'bg-yellow-500' },
                  processing: { icon: Package, label: 'Processing', color: 'bg-blue-500' },
                  shipped: { icon: Truck, label: 'Shipped', color: 'bg-purple-500' },
                  delivered: { icon: CheckCircle, label: 'Delivered', color: 'bg-green-500' },
                  cancelled: { icon: XCircle, label: 'Cancelled', color: 'bg-red-500' },
                }
                const configItem = config[status] || config.pending
                const Icon = configItem.icon
                const percentage = analytics.total_orders > 0 
                  ? Math.round((count / analytics.total_orders) * 100) 
                  : 0
                
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${configItem.color}`} />
                        <span className="capitalize">{configItem.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{count}</span>
                        <span className="text-gray-400">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-2 rounded-full ${configItem.color}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Products
              <Button variant="ghost" size="sm" className="text-pink-600">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_products.slice(0, 5).map((product: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img 
                        src={product.products?.images?.[0] || '/images/placeholder.jpg'} 
                        alt={product.products?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{product.products?.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-pink-600">
                      KSh {(product.products?.price * product.quantity).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      #{index + 1}
                    </p>
                  </div>
                </motion.div>
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
              View All Orders
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recent_orders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
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