// src/app/order-confirmation/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Mail, Phone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams?.get('order')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }

    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (data) {
        setOrder(data)
      }
      setLoading(false)
    }

    fetchOrder()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">Order not found</h2>
        <Link href="/">
          <Button className="mt-4">Return Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Your order #{order.order_number} has been received and is being processed.
        </p>

        <Card className="text-left">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Package className="h-5 w-5 text-pink-600" />
              <div>
                <p className="font-medium">Order #{order.order_number}</p>
                <p className="text-sm text-gray-500">
                  Total: KSh {order.total_amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                A confirmation email has been sent to your email
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                You'll receive an SMS with tracking details
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-500">
            Want to track your order?
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/auth/register">
              <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                Create Account to Track
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}