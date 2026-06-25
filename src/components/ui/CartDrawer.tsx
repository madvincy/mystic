// src/components/ui/CartDrawer.tsx
'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../lib/store'
import { removeItem, updateQuantity, clearCart } from '../../lib/store/cartSlice'
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Heart } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const dispatch = useDispatch()
  const { items, total, itemCount } = useSelector((state: RootState) => state.cart)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleCheckout = () => {
    setIsCheckingOut(true)
    setTimeout(() => {
      window.location.href = '/checkout'
      setIsCheckingOut(false)
    }, 500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 z-50 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Your Cart</h2>
                {itemCount > 0 && (
                  <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs px-2 py-0.5 rounded-full">
                    {itemCount} items
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Looks like you haven't added any items yet
                  </p>
                  <Button 
                    className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={onClose}
                  >
                    Start Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group"
                    >
                      <div className="relative h-20 w-20 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <Image
                          src={item.image || '/images/placeholder.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                            {item.variantValue && (
                              <p className="text-xs text-gray-500">{item.variantValue}</p>
                            )}
                          </div>
                          <button
                            onClick={() => dispatch(removeItem(item.id))}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => dispatch(updateQuantity({
                                id: item.id,
                                quantity: item.quantity - 1
                              }))}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className={cn("h-3 w-3", item.quantity <= 1 && "opacity-50")} />
                            </button>
                            <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => dispatch(updateQuantity({
                                id: item.id,
                                quantity: item.quantity + 1
                              }))}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-semibold text-pink-600">
                            KSh {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>KSh {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span className="text-pink-600">KSh {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => dispatch(clearCart())}
                  >
                    Clear Cart
                  </Button>
                  <Button
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? 'Processing...' : 'Checkout'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <Link
                  href="/products"
                  className="block text-center text-sm text-pink-600 hover:underline"
                  onClick={onClose}
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}