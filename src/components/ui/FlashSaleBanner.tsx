// src/components/ui/FlashSaleBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FlashSaleTimer from './FlashSaleTimer'
import ProductCard from './ProductCard'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { AppDispatch, RootState } from '@/lib/store'
import { fetchActiveFlashSales } from '@/lib/store/productSlice'

interface FlashSaleBannerProps {
  className?: string
  maxProducts?: number
}

export default function FlashSaleBanner({ 
  className = '',
  maxProducts = 4
}: FlashSaleBannerProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { flashSales, loading } = useSelector((state: RootState) => state.products)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    dispatch(fetchActiveFlashSales())
  }, [dispatch])

  if (loading || flashSales.length === 0) return null

  const currentFlashSale = flashSales[currentIndex]
  const products = currentFlashSale?.products || []

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % flashSales.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + flashSales.length) % flashSales.length)
  }

  if (products.length === 0) return null

  return (
    <div className={className}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Flame className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Flash Sale</h2>
              <p className="text-white/80 text-sm">
                {currentFlashSale?.description || 'Limited time offers'}
              </p>
            </div>
          </div>
          
          <FlashSaleTimer 
            endTime={currentFlashSale?.end_time || ''}
            variant="compact"
            className="bg-white/20 px-4 py-2 rounded-lg mt-2 md:mt-0"
          />
        </div>

        {/* Products */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, maxProducts).map((fp: any) => (
              <div key={fp.id} className="bg-white/10 backdrop-blur rounded-lg p-3">
                <ProductCard 
                  product={{
                    ...fp.product,
                    sale_price: fp.sale_price,
                    flash_sale: fp,
                    variants: fp.variant ? [fp.variant] : fp.product?.variants
                  }}
                  showDiscountBadge
                />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="bg-red-500 px-2 py-0.5 rounded-full">
                    -{fp.discount_percentage}%
                  </span>
                  <span className="font-bold">
                    KSh {fp.sale_price.toLocaleString()}
                  </span>
                  {fp.quantity_limit && (
                    <span className="text-xs opacity-70">
                      {fp.quantity_limit - (fp.sold_count || 0)} left
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          {flashSales.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={prev}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center text-sm bg-white/20 px-3 py-1 rounded-full">
                {currentIndex + 1} / {flashSales.length}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={next}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}