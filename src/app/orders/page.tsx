// src/app/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, ChevronRight, Eye, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { Badge } from '@/components/shadCn/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  items: {
    quantity: number
    price: number
    product: { name: string }
  }[]
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchOrders()
  }, [authLoading, user, router])

  const fetchOrders = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            quantity,
            price,
            product:products(name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: any; className: string }> = {
      pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      processing: { label: 'Processing', icon: Package, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      shipped: { label: 'Shipped', icon: Truck, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    }
    return config[status] || config.pending
  }

  // ✅ Fix: Use authLoading and loading states correctly
  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
          <p className="text-gray-500 text-sm">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          View all your orders and their status
        </p>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-medium mb-2">No orders yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Start shopping to see your orders here</p>
            <Link href="/products">
              <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusBadge = getStatusBadge(order.status)
              const StatusIcon = statusBadge.icon
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-lg">#{order.order_number}</p>
                            <Badge className={statusBadge.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusBadge.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at{' '}
                            {new Date(order.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                            KSh {order.total_amount.toLocaleString()}
                          </p>
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="gap-2 hover:bg-pink-50 dark:hover:bg-pink-900/20">
                              <Eye className="h-4 w-4" />
                              View Details
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}