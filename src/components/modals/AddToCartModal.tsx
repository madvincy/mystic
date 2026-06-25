// src/components/modals/AddToCartModal.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShoppingBag, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Dialog, DialogContent } from '@/components/shadCn/ui/dialog'
import Link from 'next/link'
import Image from 'next/image'

interface AddToCartModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    price: number
    image: string
    variant?: string
  }
  quantity: number
}

export default function AddToCartModal({ isOpen, onClose, product, quantity }: AddToCartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>

          <h3 className="text-xl font-semibold">Added to Cart!</h3>
          <p className="text-gray-500 mt-1">
            {quantity} × {product.name} {product.variant && `(${product.variant})`}
          </p>

          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
            <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              <Image
                src={product.image || '/images/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm line-clamp-1">{product.name}</p>
              <p className="text-sm text-pink-600">KSh {product.price.toLocaleString()}</p>
            </div>
            <span className="text-sm text-gray-500">×{quantity}</span>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Link href="/cart" onClick={onClose}>
              <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                <ShoppingBag className="h-4 w-4 mr-2" />
                View Cart
              </Button>
            </Link>
            <Link href="/checkout" onClick={onClose}>
              <Button variant="outline" className="w-full">
                Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}