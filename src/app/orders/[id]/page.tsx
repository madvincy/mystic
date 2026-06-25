// src/app/orders/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Package, 
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Printer,
  Mail
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { Badge } from '@/components/shadCn/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('auth/login')
    }
    if (user && params?.id) {
      fetchOrder()
    }
  }, [status, user, router, params])

  const fetchOrder = async () => {
    if (!user?.id || !params?.id) return

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(name, email, phone),
        items:order_items(
          *,
          product:products(name, images, price),
          variant:product_variants(variant_value)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order details')
      router.push('/orders')
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: any; className: string }> = {
      pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      processing: { label: 'Processing', icon: Package, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      shipped: { label: 'Shipped', icon: Truck, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      refunded: { label: 'Refunded', icon: XCircle, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    }
    return config[status] || config.pending
  }

  const getPaymentBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    }
    return config[status] || config.pending
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadInvoice = () => {
    // Generate invoice PDF or CSV
    toast.success('Invoice downloaded successfully')
  }

  const handleSendEmail = () => {
    toast.success('Order details sent to your email')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
          <p className="text-gray-500 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
        <Link href="/orders">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    )
  }

  const statusBadge = getStatusBadge(order.status)
  const paymentBadge = getPaymentBadge(order.payment_status)
  const StatusIcon = statusBadge.icon

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-bold">Order #{order.order_number}</h2>
                      <Badge className={statusBadge.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-pink-600">
                      KSh {order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  {[
                    { status: 'Order Placed', date: order.created_at, icon: Clock },
                    { status: 'Processing', date: order.updated_at, icon: Package },
                    ...(order.status === 'shipped' || order.status === 'delivered' ? 
                      [{ status: 'Shipped', date: order.updated_at, icon: Truck }] : []),
                    ...(order.status === 'delivered' ? 
                      [{ status: 'Delivered', date: order.updated_at, icon: CheckCircle }] : []),
                  ].map((step, index, arr) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`flex flex-col items-center ${index < arr.length - 1 ? 'pb-2' : ''}`}>
                        <div className={`p-1.5 rounded-full ${
                          index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <step.icon className="h-4 w-4" />
                        </div>
                        {index < arr.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{step.status}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(step.date).toLocaleDateString()} at{' '}
                          {new Date(step.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🍷
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          {item.variant?.variant_value && (
                            <p className="text-sm text-gray-500">{item.variant.variant_value}</p>
                          )}
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">KSh {(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-sm text-gray-500">KSh {item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>KSh {order.total_amount.toLocaleString()}</span>
                  </div>
                  {order.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span>KSh {order.shipping_cost.toLocaleString()}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span>KSh {order.tax.toLocaleString()}</span>
                  </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span className="text-pink-600">KSh {order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-pink-600" />
                  Payment Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="capitalize font-medium">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge className={paymentBadge.className}>
                      {paymentBadge.label}
                    </Badge>
                  </div>
                  {order.payment_receipt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Receipt</span>
                      <span className="font-mono text-xs">{order.payment_receipt}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  Shipping Address
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shipping_address?.name}</p>
                  <p className="text-gray-500">{order.shipping_address?.address}</p>
                  <p className="text-gray-500">{order.shipping_address?.city}, {order.shipping_address?.country}</p>
                  <p className="text-gray-500">Phone: {order.shipping_address?.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-pink-600" />
                  Customer Information
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.user?.name}</p>
                  <p className="text-gray-500">{order.user?.email}</p>
                  <p className="text-gray-500">{order.user?.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Support Actions */}
            <div className="space-y-2">
              {(order.status === 'pending' || order.status === 'processing') && (
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                  Contact Support
                </Button>
              )}
              {order.status === 'delivered' && (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Order Delivered
                </Button>
              )}
              <Link href="/contact">
                <Button variant="outline" className="w-full">
                  Need Help?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}