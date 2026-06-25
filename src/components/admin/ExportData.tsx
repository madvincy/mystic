// src/components/admin/ExportData.tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2,
  CheckCircle,
  Calendar,
  Filter,
  Database,
  Users,
  Package,
  ShoppingBag,
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
import { Button } from '@/components/shadCn/ui/button'
import { Progress } from '@/components/shadCn/ui/progress'

interface ExportConfig {
  type: 'products' | 'orders' | 'users' | 'inventory' | 'analytics'
  format: 'csv' | 'json' | 'excel'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
  startDate?: string
  endDate?: string
  includeHeaders: boolean
}

export default function ExportData() {
  const [config, setConfig] = useState<ExportConfig>({
    type: 'products',
    format: 'csv',
    dateRange: 'all',
    includeHeaders: true,
  })
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportedData, setExportedData] = useState<any>(null)

  const exportOptions = [
    { value: 'products', label: 'Products', icon: Package },
    { value: 'orders', label: 'Orders', icon: ShoppingBag },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'inventory', label: 'Inventory', icon: Database },
    { value: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const getDateRangeFilter = () => {
    const now = new Date()
    switch (config.dateRange) {
      case 'today':
        return { gte: new Date(now.setHours(0, 0, 0, 0)).toISOString() }
      case 'week':
        return { gte: new Date(now.setDate(now.getDate() - 7)).toISOString() }
      case 'month':
        return { gte: new Date(now.setMonth(now.getMonth() - 1)).toISOString() }
      case 'year':
        return { gte: new Date(now.setFullYear(now.getFullYear() - 1)).toISOString() }
      case 'custom':
        return config.startDate && config.endDate 
          ? { gte: config.startDate, lte: config.endDate }
          : {}
      default:
        return {}
    }
  }

  const fetchData = async () => {
    setExporting(true)
    setProgress(10)
    setExportedData(null)

    try {
      let data: any[] = []
      let count = 0
      const dateFilter = getDateRangeFilter()

      switch (config.type) {
        case 'products':
          setProgress(30)
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
              *,
              category:categories(name),
              variants:product_variants(*)
            `)
            .order('created_at', { ascending: false })
          
          if (productsError) throw productsError
          data = products || []
          count = data.length
          setProgress(80)
          break

        case 'orders':
          setProgress(30)
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
              *,
              user:users(name, email, phone),
              items:order_items(
                *,
                product:products(name),
                variant:product_variants(variant_value)
              )
            `)
            .order('created_at', { ascending: false })
          
          if (ordersError) throw ordersError
          data = orders || []
          count = data.length
          setProgress(80)
          break

        case 'users':
          setProgress(30)
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (usersError) throw usersError
          data = users || []
          count = data.length
          setProgress(80)
          break

        case 'inventory':
          setProgress(30)
          const { data: inventory, error: inventoryError } = await supabase
            .from('product_variants')
            .select(`
              *,
              product:products(name, price, stock_status)
            `)
            .order('stock', { ascending: true })
          
          if (inventoryError) throw inventoryError
          data = inventory || []
          count = data.length
          setProgress(80)
          break

        case 'analytics':
          setProgress(30)
          // Fetch multiple analytics data
          const [ordersData, usersData, productsData] = await Promise.all([
            supabase.from('orders').select('total_amount, status, created_at'),
            supabase.from('users').select('id, created_at, is_admin'),
            supabase.from('products').select('price, stock_status, is_featured, created_at'),
          ])

          data = {
            summary: {
              totalRevenue: ordersData.data?.reduce((sum, o) => sum + o.total_amount, 0) || 0,
              totalOrders: ordersData.data?.length || 0,
              totalUsers: usersData.data?.length || 0,
              totalProducts: productsData.data?.length || 0,
              averageOrderValue: ordersData.data?.length 
                ? (ordersData.data.reduce((sum, o) => sum + o.total_amount, 0) / ordersData.data.length) 
                : 0,
            },
            orders: ordersData.data || [],
            users: usersData.data || [],
            products: productsData.data || [],
          }
          count = Object.keys(data).length
          setProgress(80)
          break
      }

      setProgress(90)

      // Format data for export
      let exportData = data
      if (config.type === 'analytics') {
        exportData = data
      }

      setExportedData({
        data: exportData,
        count,
        type: config.type,
        format: config.format,
        exportedAt: new Date().toISOString(),
      })

      setProgress(100)
      toast.success(`Exported ${count} ${config.type} successfully`)
    } catch (error: any) {
      toast.error('Failed to export data: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const downloadData = () => {
    if (!exportedData) return

    let content = ''
    let filename = `${config.type}_${new Date().toISOString().split('T')[0]}`
    let mimeType = ''

    switch (config.format) {
      case 'csv':
        mimeType = 'text/csv'
        filename += '.csv'
        // Convert to CSV
        const items = Array.isArray(exportedData.data) ? exportedData.data : [exportedData.data]
        if (items.length > 0) {
          const headers = Object.keys(items[0])
          const rows = [
            headers.join(','),
            ...items.map(item => 
              headers.map(header => 
                typeof item[header] === 'object' 
                  ? `"${JSON.stringify(item[header]).replace(/"/g, '""')}"` 
                  : `"${String(item[header] || '').replace(/"/g, '""')}"`
              ).join(',')
            )
          ]
          content = rows.join('\n')
        }
        break

      case 'json':
        mimeType = 'application/json'
        filename += '.json'
        content = JSON.stringify(exportedData.data, null, 2)
        break

      case 'excel':
        mimeType = 'application/vnd.ms-excel'
        filename += '.csv' // Excel can open CSV
        // Same as CSV for simplicity
        const excelItems = Array.isArray(exportedData.data) ? exportedData.data : [exportedData.data]
        if (excelItems.length > 0) {
          const headers = Object.keys(excelItems[0])
          const rows = [
            headers.join(','),
            ...excelItems.map(item => 
              headers.map(header => 
                typeof item[header] === 'object' 
                  ? `"${JSON.stringify(item[header]).replace(/"/g, '""')}"` 
                  : `"${String(item[header] || '').replace(/"/g, '""')}"`
              ).join(',')
            )
          ]
          content = rows.join('\n')
        }
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('File downloaded successfully')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export Data</h2>
        <p className="text-gray-500">Export your data in various formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>
              Configure what and how to export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Type</label>
              <div className="grid grid-cols-2 gap-2">
                {exportOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => setConfig({ ...config, type: option.value as any })}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        config.type === option.value
                          ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-pink-400'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="excel">Excel (CSV)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <select
                value={config.dateRange}
                onChange={(e) => setConfig({ ...config, dateRange: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last 12 Months</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {config.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={config.startDate || ''}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={config.endDate || ''}
                    onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.includeHeaders}
                onChange={(e) => setConfig({ ...config, includeHeaders: e.target.checked })}
                id="include-headers"
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="include-headers" className="text-sm">
                Include headers in export
              </label>
            </div>

            {exporting && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 text-center">
                  Exporting... {Math.round(progress)}%
                </p>
              </div>
            )}

            <Button
              onClick={fetchData}
              disabled={exporting}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export Results */}
        {exportedData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Export Ready
                </CardTitle>
                <CardDescription>
                  Your data has been exported successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-2xl font-bold">{exportedData.count}</p>
                    <p className="text-sm text-gray-500">Records</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-2xl font-bold uppercase">{exportedData.type}</p>
                    <p className="text-sm text-gray-500">Type</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <p className="text-2xl font-bold uppercase">{exportedData.format}</p>
                    <p className="text-sm text-gray-500">Format</p>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Exported at: {new Date(exportedData.exportedAt).toLocaleString()}
                </div>

                <Button
                  onClick={downloadData}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {config.format.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}