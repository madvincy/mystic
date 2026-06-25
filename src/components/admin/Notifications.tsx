// src/components/admin/Notifications.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Send,
  Plus,
  Package,
  ShoppingCart,
  AlertTriangle,
  Info,
  Filter,
  Menu
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Badge } from '@/components/shadCn/ui/badge'
import { Card, CardContent } from '@/components/shadCn/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadCn/ui/select'
import { Label } from '@/components/shadCn/ui/label'
import { Textarea } from '@/components/shadCn/ui/textarea'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadCn/ui/dropdown-menu'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'inventory' | 'orders' | 'marketing' | 'user'
  is_read: boolean
  is_global: boolean
  user_id: string | null
  related_id: string | null
  related_type: string | null
  action_url: string | null
  action_label: string | null
  metadata: any
  created_at: string
  read_at: string | null
  user_name?: string
  user_email?: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Partial<Notification>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    inventory: 0,
    orders: 0,
    system: 0
  })

  const itemsPerPage = 10

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('🔄 Notification change detected:', payload)
          fetchNotifications()
        }
      )
      .subscribe()

    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchNotifications()
      }, 30000)
    }

    return () => {
      supabase.removeChannel(channel)
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (notificationsError) throw notificationsError

      let notificationsWithUsers = notificationsData || []
      
      if (notificationsData && notificationsData.length > 0) {
        const userIds = notificationsData
          .map(n => n.user_id)
          .filter(id => id !== null) as string[]
        
        const uniqueUserIds = [...new Set(userIds)]
        
        if (uniqueUserIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', uniqueUserIds)

          if (!usersError && usersData) {
            const userMap = usersData.reduce((acc, user) => {
              acc[user.id] = user
              return acc
            }, {} as Record<string, { id: string; name: string; email: string }>)

            notificationsWithUsers = notificationsData.map(notification => ({
              ...notification,
              user_name: notification.user_id ? userMap[notification.user_id]?.name : undefined,
              user_email: notification.user_id ? userMap[notification.user_id]?.email : undefined,
            }))
          }
        }
      }

      setNotifications(notificationsWithUsers)
      
      setStats({
        total: notificationsWithUsers.length,
        unread: notificationsWithUsers.filter(n => !n.is_read).length,
        inventory: notificationsWithUsers.filter(n => n.category === 'inventory').length,
        orders: notificationsWithUsers.filter(n => n.category === 'orders').length,
        system: notificationsWithUsers.filter(n => n.category === 'system').length,
      })
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to fetch notifications: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const saveNotification = async () => {
    try {
      if (!editingNotification.title || !editingNotification.message) {
        toast.error('Title and message are required')
        return
      }

      const data = {
        title: editingNotification.title,
        message: editingNotification.message,
        type: editingNotification.type || 'info',
        category: editingNotification.category || 'system',
        is_read: false,
        is_global: true,
        user_id: editingNotification.user_id || null,
        action_url: editingNotification.action_url || null,
        action_label: editingNotification.action_label || null,
        metadata: editingNotification.metadata || {},
        created_at: new Date().toISOString(),
      }

      if (editingNotification.id) {
        const { error } = await supabase
          .from('notifications')
          .update(data)
          .eq('id', editingNotification.id)

        if (error) throw error
        toast.success('Notification updated')
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert(data)

        if (error) throw error
        toast.success('Notification sent successfully')
      }

      setShowDialog(false)
      setEditingNotification({})
      fetchNotifications()
    } catch (error: any) {
      toast.error('Failed to save notification: ' + error.message)
    }
  }

  const runStockCheck = async () => {
    try {
      const { error } = await supabase.rpc('check_low_stock_notifications')
      if (error) throw error
      toast.success('Stock check completed')
      fetchNotifications()
    } catch (error: any) {
      toast.error('Failed to check stock: ' + error.message)
    }
  }

  const runOrderCheck = async () => {
    try {
      const { error } = await supabase.rpc('check_pending_order_notifications')
      if (error) throw error
      toast.success('Order check completed')
      fetchNotifications()
    } catch (error: any) {
      toast.error('Failed to check orders: ' + error.message)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      fetchNotifications()
    } catch (error: any) {
      toast.error('Failed to mark as read: ' + error.message)
    }
  }

  const deleteNotification = async () => {
    if (!notificationToDelete) return
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationToDelete)

      if (error) throw error
      toast.success('Notification deleted')
      fetchNotifications()
      setShowDeleteDialog(false)
      setNotificationToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete notification: ' + error.message)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false)

      if (error) throw error
      toast.success('All notifications marked as read')
      fetchNotifications()
    } catch (error: any) {
      toast.error('Failed to mark all as read: ' + error.message)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || n.category === filterCategory
    const matchesType = filterType === 'all' || n.type === filterType
    const matchesUnread = !showUnreadOnly || !n.is_read
    
    return matchesSearch && matchesCategory && matchesType && matchesUnread
  })

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const typeColors = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  const categoryIcons = {
    system: <Bell className="h-4 w-4" />,
    inventory: <Package className="h-4 w-4" />,
    orders: <ShoppingCart className="h-4 w-4" />,
    marketing: <Send className="h-4 w-4" />,
    user: <Bell className="h-4 w-4" />,
  }

  const categoryColors = {
    system: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    inventory: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    orders: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    marketing: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Notifications</h2>
          <p className="text-sm text-gray-500">Manage system notifications and alerts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runStockCheck}
              className="text-xs sm:text-sm"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Check Stock</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runOrderCheck}
              className="text-xs sm:text-sm"
            >
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Check Orders</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="text-xs sm:text-sm"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Mark All Read</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchNotifications} className="text-xs sm:text-sm">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm"
              onClick={() => {
                setEditingNotification({})
                setShowDialog(true)
              }}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Send Notification</span>
            </Button>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex lg:hidden gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-2 sm:px-3">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={runStockCheck}>
                  <Package className="h-4 w-4 mr-2" />
                  Check Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={runOrderCheck}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Check Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={markAllAsRead} disabled={stats.unread === 0}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={fetchNotifications}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setEditingNotification({})
                  setShowDialog(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Notification
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Bell, color: 'text-blue-600' },
          { label: 'Unread', value: stats.unread, icon: Eye, color: 'text-yellow-600' },
          { label: 'Inventory', value: stats.inventory, icon: Package, color: 'text-orange-600' },
          { label: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'text-blue-600' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold truncate">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 text-sm"
          />
        </div>
        
        {/* Desktop Filters */}
        <div className="hidden sm:flex flex-wrap gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[130px] text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`text-sm ${showUnreadOnly ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Unread Only</span>
            <span className="sm:hidden">Unread</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-sm ${autoRefresh ? 'border-green-500 text-green-600' : ''}`}
          >
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">Auto</span>
          </Button>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="sm:hidden flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex-1"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            <Badge variant="secondary" className="ml-1 text-xs">
              {filterCategory !== 'all' || filterType !== 'all' || showUnreadOnly ? 'Active' : ''}
            </Badge>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`${autoRefresh ? 'border-green-500 text-green-600' : ''}`}
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {isMobileFiltersOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="sm:hidden space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`w-full ${showUnreadOnly ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showUnreadOnly ? 'Showing Unread Only' : 'Show Unread Only'}
          </Button>
        </motion.div>
      )}

      {/* Notifications List */}
      <div className="space-y-2 sm:space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : paginatedNotifications.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
            <p className="text-sm sm:text-base">No notifications found</p>
          </div>
        ) : (
          paginatedNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className={`hover:shadow-md transition-shadow ${!notification.is_read ? 'border-l-2 sm:border-l-4 border-l-pink-600' : ''}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <Badge className={`${typeColors[notification.type] || 'bg-gray-100'} text-xs`}>
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            {categoryIcons[notification.category] || <Bell className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                            <span className="hidden sm:inline">{notification.category}</span>
                            <span className="sm:hidden">{notification.category.slice(0, 3)}</span>
                          </span>
                        </Badge>
                        <Badge className={`${categoryColors[notification.category] || 'bg-gray-100'} text-xs`}>
                          {notification.type}
                        </Badge>
                        {!notification.is_read && (
                          <Badge className="bg-pink-600 animate-pulse text-xs">New</Badge>
                        )}
                        <span className="text-xs text-gray-500 truncate">
                          {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h3 className="font-medium mt-1 text-sm sm:text-base break-words">{notification.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{notification.message}</p>
                      {notification.action_url && (
                        <Link
                          href={notification.action_url}
                          className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 mt-1 sm:mt-2 inline-block"
                        >
                          {notification.action_label || 'View Details'} →
                        </Link>
                      )}
                      {(notification.user_name || notification.user_email) && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          To: {notification.user_name || notification.user_email}
                        </p>
                      )}
                      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                        <div className="mt-1 sm:mt-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 p-1.5 sm:p-2 rounded">
                          {notification.metadata.product_name && (
                            <span className="inline-block mr-1 sm:mr-2">Product: {notification.metadata.product_name}</span>
                          )}
                          {notification.metadata.order_number && (
                            <span className="inline-block mr-1 sm:mr-2">Order: #{notification.metadata.order_number}</span>
                          )}
                          {notification.metadata.stock !== undefined && (
                            <span className="inline-block">Stock: {notification.metadata.stock} units</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 sm:gap-2 self-end sm:self-start">
                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs"
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">Mark Read</span>
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setNotificationToDelete(notification.id)
                          setShowDeleteDialog(true)
                        }}
                        className="px-2 sm:px-3"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 justify-between">
          <p className="text-xs sm:text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <span className="flex items-center px-2 sm:px-3 text-xs sm:text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Notification Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingNotification.id ? 'Edit Notification' : 'Send Notification'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Title *</Label>
              <Input
                value={editingNotification.title || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, title: e.target.value })}
                placeholder="Notification title"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Message *</Label>
              <Textarea
                value={editingNotification.message || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Type</Label>
                <select
                  value={editingNotification.type || 'info'}
                  onChange={(e) => setEditingNotification({ ...editingNotification, type: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <select
                  value={editingNotification.category || 'system'}
                  onChange={(e) => setEditingNotification({ ...editingNotification, category: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="system">System</option>
                  <option value="inventory">Inventory</option>
                  <option value="orders">Orders</option>
                  <option value="marketing">Marketing</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Action URL (optional)</Label>
              <Input
                value={editingNotification.action_url || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, action_url: e.target.value })}
                placeholder="/admin/orders"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Action Label (optional)</Label>
              <Input
                value={editingNotification.action_label || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, action_label: e.target.value })}
                placeholder="View Orders"
                className="text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                className="w-full sm:flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveNotification}
              >
                <Send className="h-4 w-4 mr-2" />
                {editingNotification.id ? 'Update' : 'Send'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:flex-1"
                onClick={() => {
                  setShowDialog(false)
                  setEditingNotification({})
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. The notification will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteNotification} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}