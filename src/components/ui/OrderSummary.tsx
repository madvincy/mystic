// src/components/ui/OrderSummary.tsx
'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'

interface OrderSummaryProps {
  items: any[]
  total: number
  subtotal?: number
  shipping?: number
  tax?: number
  discount?: number
  loading?: boolean
  onCheckout?: () => void
  checkoutLabel?: string
  className?: string
}

export default function OrderSummary({
  items,
  total,
  subtotal,
  shipping = 0,
  tax = 0,
  discount = 0,
  loading = false,
  onCheckout,
  checkoutLabel = 'Proceed to Checkout',
  className = ''
}: OrderSummaryProps) {
  const subtotalAmount = subtotal !== undefined ? subtotal : items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const finalTotal = total || subtotalAmount + shipping + tax - discount

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700",
      className
    )}>
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      
      {/* Items */}
      <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="flex-1">
              {item.name}
              {item.variantValue && (
                <span className="text-gray-500 text-xs ml-1">({item.variantValue})</span>
              )}
              <span className="text-gray-400 ml-1">x{item.quantity}</span>
            </span>
            <span className="font-medium ml-4">
              KSh {(item.price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span>KSh {subtotalAmount.toLocaleString()}</span>
        </div>
        {shipping > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span>KSh {shipping.toLocaleString()}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span>KSh {tax.toLocaleString()}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-KSh {discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
          <span>Total</span>
          <span className="text-pink-600">KSh {finalTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Checkout Button */}
      {onCheckout && (
        <Button
          className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white"
          onClick={onCheckout}
          disabled={loading || items.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            checkoutLabel
          )}
        </Button>
      )}
    </div>
  )
}