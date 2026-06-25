// src/components/admin/OrderManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Eye, 
  Edit,
  Trash2,
  Download,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  DollarSign,
  Printer,
  Send,
  Filter,
  Grid,
  List,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Badge } from '@/components/shadCn/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadCn/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadCn/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadCn/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadCn/ui/select'
import { supabase } from '@/lib/supabase/client'

interface Order {
  id: string
  order_number: string
  user_id: string
  total_amount: number
  shipping_cost: number
  tax: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_method: 'mpesa' | 'cash' | 'card'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_address: {
    name: string
    phone: string
    address: string
    city: string
    country: string
  }
  created_at: string
  updated_at: string
  user?: {
    name: string
    email: string
    phone: string
  }
  items?: OrderItem[]
}

interface OrderItem {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  product?: {
    name: string
    images: string[]
  }
  variant?: {
    variant_value: string
  }
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [dateRange, setDateRange] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const itemsPerPage = 10

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ]

  useEffect(() => {
    fetchOrders()
  }, [])
 
  const fetchOrders = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          user:users(name, email, phone),
          items:order_items(
            *,
            product:products(name, images),
            variant:product_variants(variant_value)
          )
        `)
        .order('created_at', { ascending: false })

      if (dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('created_at', today)
      } else if (dateRange === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', weekAgo)
      } else if (dateRange === 'month') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', monthAgo)
      } else if (dateRange === 'custom' && startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate)
      }

      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch orders: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error
      toast.success(`Order status updated to ${status}`)
      fetchOrders()
    } catch (error: any) {
      toast.error('Failed to update order: ' + error.message)
    }
  }

  const deleteOrder = async () => {
    if (!orderToDelete) return
    try {
      await supabase.from('order_items').delete().eq('order_id', orderToDelete)
      const { error } = await supabase.from('orders').delete().eq('id', orderToDelete)
      if (error) throw error
      toast.success('Order deleted successfully')
      fetchOrders()
      setShowDeleteDialog(false)
      setOrderToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete order: ' + error.message)
    }
  }

  const exportOrders = async () => {
    setIsExporting(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const headers = ['Order Number', 'Customer', 'Total', 'Status', 'Payment Method', 'Date']
      const csvRows = [
        headers.join(','),
        ...data.map((o: any) => [
          o.order_number,
          `"${o.user?.name || 'Guest'}"`,
          o.total_amount,
          o.status,
          o.payment_method,
          new Date(o.created_at).toLocaleDateString()
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success(`Exported ${data.length} orders`)
    } catch (error: any) {
      toast.error('Failed to export: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Package, label: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Cancelled' },
      refunded: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: DollarSign, label: 'Refunded' },
    }
    return config[status] || config.pending
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus
    const matchesPayment = filterPayment === 'all' || o.payment_method === filterPayment
    return matchesSearch && matchesStatus && matchesPayment
  })

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0)

  const stats = [
    { label: 'Total Orders', value: filteredOrders.length, icon: Package, color: 'text-blue-600' },
    { label: 'Revenue', value: `KSh ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-yellow-600' },
    { label: 'Delivered', value: filteredOrders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: 'text-green-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-gray-500">Manage customer orders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportOrders} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {statusOptions.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <option value="all">All Payments</option>
          <option value="mpesa">M-Pesa</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
        <select value={dateRange} onChange={(e) => { setDateRange(e.target.value); if (e.target.value !== 'custom') fetchOrders(); }} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
        {dateRange === 'custom' && (
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
            <Button size="sm" onClick={() => { if (startDate && endDate) fetchOrders(); }}>Apply</Button>
          </div>
        )}
        <div className="flex gap-1">
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'bg-pink-600' : ''}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-pink-600' : ''}>
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Orders Display */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto" /></td></tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No orders found</td></tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const statusBadge = getStatusBadge(order.status)
                    const StatusIcon = statusBadge.icon
                    return (
                      <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-pink-600 dark:text-pink-400">#{order.order_number}</p>
                          <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{order.user?.name || 'Guest'}</p>
                          <p className="text-xs text-gray-500">{order.user?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold">KSh {order.total_amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`text-xs px-2 py-1 rounded-full border-0 ${statusBadge.color}`}>
                            {statusOptions.filter(s => s.value !== 'all').map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {order.payment_status}
                          </span>
                          <p className="text-xs text-gray-500">{order.payment_method}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'processing')}>
                                <Package className="h-4 w-4 mr-2" /> Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>
                                <Truck className="h-4 w-4 mr-2" /> Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Delivered
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => { setOrderToDelete(order.id); setShowDeleteDialog(true); }}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))
          ) : paginatedOrders.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">No orders found</div>
          ) : (
            paginatedOrders.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-pink-600 dark:text-pink-400">#{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.user?.name || 'Guest'}</p>
                  </div>
                  <Badge className={getStatusBadge(order.status).color}>{getStatusBadge(order.status).label}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">KSh {order.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.user?.name || 'Guest'}</p>
                  <p className="text-sm">{selectedOrder.user?.email}</p>
                  <p className="text-sm">{selectedOrder.user?.phone}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500">Shipping</p>
                  <p className="text-sm">{selectedOrder.shipping_address?.address}</p>
                  <p className="text-sm">{selectedOrder.shipping_address?.city}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-500">Payment</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                  <Badge className={selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded mb-2">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">KSh {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-pink-600">KSh {selectedOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the order.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteOrder} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}