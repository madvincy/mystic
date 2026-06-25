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
  Filter
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
  // User data fetched separately
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
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    inventory: 0,
    orders: 0,
    system: 0
  })

  const itemsPerPage = 10

  // ✅ Fetch notifications with real-time subscription
  useEffect(() => {
    fetchNotifications()

    // Set up real-time subscription
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

    // Auto-refresh every 30 seconds
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

  // ✅ Fetch notifications without nested relationship
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (notificationsError) throw notificationsError

      // If there are notifications with user_id, fetch user data separately
      let notificationsWithUsers = notificationsData || []
      
      if (notificationsData && notificationsData.length > 0) {
        // Get unique user IDs
        const userIds = notificationsData
          .map(n => n.user_id)
          .filter(id => id !== null) as string[]
        
        // Remove duplicates
        const uniqueUserIds = [...new Set(userIds)]
        
        if (uniqueUserIds.length > 0) {
          // Fetch user data
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', uniqueUserIds)

          if (!usersError && usersData) {
            // Create a map of user data
            const userMap = usersData.reduce((acc, user) => {
              acc[user.id] = user
              return acc
            }, {} as Record<string, { id: string; name: string; email: string }>)

            // Merge user data into notifications
            notificationsWithUsers = notificationsData.map(notification => ({
              ...notification,
              user_name: notification.user_id ? userMap[notification.user_id]?.name : undefined,
              user_email: notification.user_id ? userMap[notification.user_id]?.email : undefined,
            }))
          }
        }
      }

      setNotifications(notificationsWithUsers)
      
      // Update stats
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

  // ✅ Save notification
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

  // ✅ Run stock check manually
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

  // ✅ Run order check manually
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

  // ✅ Filter notifications
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-gray-500">Manage system notifications and alerts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runStockCheck}
          >
            <Package className="h-4 w-4 mr-2" />
            Check Stock
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runOrderCheck}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Check Orders
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={stats.unread === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingNotification({})
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Bell, color: 'text-blue-600' },
          { label: 'Unread', value: stats.unread, icon: Eye, color: 'text-yellow-600' },
          { label: 'Inventory Alerts', value: stats.inventory, icon: Package, color: 'text-orange-600' },
          { label: 'Order Alerts', value: stats.orders, icon: ShoppingCart, color: 'text-blue-600' },
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[150px]">
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
          className={showUnreadOnly ? 'bg-pink-600 hover:bg-pink-700' : ''}
        >
          <Eye className="h-4 w-4 mr-2" />
          Unread Only
        </Button>
        <Button
          variant="outline"
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={autoRefresh ? 'border-green-500 text-green-600' : ''}
        >
          <Clock className="h-4 w-4 mr-2" />
          Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : paginatedNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications found</p>
          </div>
        ) : (
          paginatedNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className={`hover:shadow-md transition-shadow ${!notification.is_read ? 'border-l-4 border-l-pink-600' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={typeColors[notification.type] || 'bg-gray-100'}>
                          <span className="flex items-center gap-1">
                            {categoryIcons[notification.category] || <Bell className="h-3 w-3" />}
                            {notification.category}
                          </span>
                        </Badge>
                        <Badge className={categoryColors[notification.category] || 'bg-gray-100'}>
                          {notification.type}
                        </Badge>
                        {!notification.is_read && (
                          <Badge className="bg-pink-600 animate-pulse">New</Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()} at{' '}
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <h3 className="font-medium mt-1">{notification.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                      {notification.action_url && (
                        <Link
                          href={notification.action_url}
                          className="text-sm text-pink-600 hover:text-pink-700 mt-2 inline-block"
                        >
                          {notification.action_label || 'View Details'} →
                        </Link>
                      )}
                      {(notification.user_name || notification.user_email) && (
                        <p className="text-xs text-gray-400 mt-1">
                          To: {notification.user_name || notification.user_email}
                        </p>
                      )}
                      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {notification.metadata.product_name && (
                            <span>Product: {notification.metadata.product_name}</span>
                          )}
                          {notification.metadata.order_number && (
                            <span className="ml-2">Order: #{notification.metadata.order_number}</span>
                          )}
                          {notification.metadata.stock !== undefined && (
                            <span className="ml-2">Stock: {notification.metadata.stock} units</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setNotificationToDelete(notification.id)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Notification Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNotification.id ? 'Edit Notification' : 'Send Notification'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={editingNotification.title || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={editingNotification.message || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={editingNotification.type || 'info'}
                  onChange={(e) => setEditingNotification({ ...editingNotification, type: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={editingNotification.category || 'system'}
                  onChange={(e) => setEditingNotification({ ...editingNotification, category: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
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
              <Label>Action URL (optional)</Label>
              <Input
                value={editingNotification.action_url || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, action_url: e.target.value })}
                placeholder="/admin/orders"
              />
            </div>
            <div className="space-y-2">
              <Label>Action Label (optional)</Label>
              <Input
                value={editingNotification.action_label || ''}
                onChange={(e) => setEditingNotification({ ...editingNotification, action_label: e.target.value })}
                placeholder="View Orders"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveNotification}
              >
                <Send className="h-4 w-4 mr-2" />
                {editingNotification.id ? 'Update' : 'Send'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notification will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteNotification} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}