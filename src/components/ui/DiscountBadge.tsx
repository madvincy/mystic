// components/ui/DiscountBadge.tsx

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface DiscountBadgeProps {
  product: {
    price: number
    sale_price?: number
    discount?: {
      discount_type: 'percentage' | 'fixed'
      discount_value: number
      end_date: string
    }
    flash_sale?: {
      discount_percentage: number
      sale_price: number
      end_time: string
    }
  }
  className?: string
}

export default function DiscountBadge({ product, className = '' }: DiscountBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const endDate = product.flash_sale?.end_time || product.discount?.end_date
    if (!endDate) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Ended')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft(`${hours}h ${minutes}m`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [product])

  if (!product.discount && !product.flash_sale) return null

  const isFlashSale = !!product.flash_sale
  const discountValue = isFlashSale 
    ? product.flash_sale?.discount_percentage 
    : product.discount?.discount_type === 'percentage' 
      ? product.discount?.discount_value 
      : null

  const savedAmount = isFlashSale
    ? product.price - (product.flash_sale?.sale_price || product.price)
    : product.discount?.discount_type === 'percentage'
      ? product.price * (product.discount.discount_value / 100)
      : product.discount?.discount_type === 'fixed'
        ? product.discount.discount_value
        : 0

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${className}`}
    >
      <div className={`relative inline-block ${isFlashSale ? 'animate-pulse' : ''}`}>
        <div className={`
          flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white
          ${isFlashSale ? 'bg-red-500' : 'bg-pink-600'}
        `}>
          {isFlashSale ? (
            <>
              <span>🔥</span>
              <span>-{discountValue}%</span>
            </>
          ) : (
            <>
              <span>💰</span>
              <span>Save KSh {Math.round(savedAmount)}</span>
            </>
          )}
        </div>
        
        {timeLeft && timeLeft !== 'Ended' && (
          <div className="text-[10px] text-gray-500 mt-0.5 text-center">
            {isFlashSale ? '⏰ ' : ''}{timeLeft} left
          </div>
        )}
      </div>
    </motion.div>
  )
}