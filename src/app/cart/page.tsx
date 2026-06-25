// src/app/cart/page.tsx
'use client'

import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { clearCart, removeItem, updateQuantity } from '@/lib/store/cartSlice'
import { RootState } from '@/lib/store'

export default function CartPage() {
  const dispatch = useDispatch()
  const { items, total, itemCount } = useSelector((state: RootState) => state.cart)

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added any items yet</p>
          <Link href="/products">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="relative h-24 w-24 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={item.image || '/images/placeholder.jpg'}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    {item.variantValue && (
                      <p className="text-sm text-gray-500">{item.variantValue}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dispatch(removeItem(item.id))}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dispatch(updateQuantity({
                        id: item.id,
                        quantity: item.quantity - 1
                      }))}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({
                        id: item.id,
                        quantity: item.quantity + 1
                      }))}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-bold text-pink-600">
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => dispatch(clearCart())}
              className="text-red-600 hover:text-red-700"
            >
              Clear Cart
            </Button>
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Order Summary</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                  <span>KSh {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>KSh 0</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="text-pink-600">KSh {total.toLocaleString()}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </Button>
              </Link>

              <p className="text-xs text-gray-500 text-center">
                Secure checkout • Free delivery on orders over KSh 5,000
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}