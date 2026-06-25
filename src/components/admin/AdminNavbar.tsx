// src/components/admin/AdminNavbar.tsx
'use client'

import { Menu, Bell, Search, User, ChevronDown, Moon, Sun, LogOut, Package, ShoppingCart, AlertTriangle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '../shadCn/ui/button'
import { Input } from '../shadCn/ui/input'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AdminNavbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'inventory' | 'orders' | 'marketing' | 'user'
  is_read: boolean
  created_at: string
  action_url: string | null
  action_label: string | null
}

export default function AdminNavbar({ sidebarOpen, setSidebarOpen }: AdminNavbarProps) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // ✅ Fetch notifications
  useEffect(() => {
    fetchNotifications()

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('🔔 Notification change detected:', payload)
          fetchNotifications()
        }
      )
      .subscribe()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  // ✅ Fetch notifications with unread count
  const fetchNotifications = async () => {
    try {
      // Fetch unread count
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      if (countError) throw countError
      setUnreadCount(unreadCount || 0)

      // Fetch latest 5 notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setNotifications(data || [])
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Mark notification as read
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
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
    }
  }

  // ✅ Mark all as read
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
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error: any) {
      console.error('Error marking all as read:', error)
    }
  }

  // ✅ Get icon for notification category
  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'inventory':
        return <Package className="h-4 w-4 text-orange-500" />
      case 'orders':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  // ✅ Get color for notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-l-4 border-red-500'
      case 'warning':
        return 'border-l-4 border-yellow-500'
      case 'success':
        return 'border-l-4 border-green-500'
      default:
        return 'border-l-4 border-blue-500'
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search admin..."
              className="pl-10 pr-4 py-2 w-64 rounded-full border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            />
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h4 className="font-semibold">Notifications</h4>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs text-pink-600 hover:text-pink-700"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Link href="/admin/notifications">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          View all
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors cursor-pointer ${getNotificationColor(notification.type)} ${!notification.is_read ? 'bg-pink-50/30 dark:bg-pink-900/10' : ''}`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id)
                            }
                            if (notification.action_url) {
                              router.push(notification.action_url)
                              setShowNotifications(false)
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getNotificationIcon(notification.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400">
                                  {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                  {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {!notification.is_read && (
                                  <span className="w-2 h-2 bg-pink-600 rounded-full" />
                                )}
                              </div>
                              {notification.action_label && (
                                <span className="text-xs text-pink-600 hover:text-pink-700 mt-1 inline-block">
                                  {notification.action_label} →
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-3 text-center border-t border-gray-200 dark:border-gray-800">
                    <Link href="/admin/notifications">
                      <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 w-full">
                        View all notifications
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.user_metadata?.name?.charAt(0) || 'A'}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="font-semibold">{user?.user_metadata?.name || 'Admin'}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  </div>
                  <div className="p-2">
                    <Link href="/admin/profile">
                      <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
                        <User className="h-4 w-4" />
                        Profile Settings
                      </button>
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}