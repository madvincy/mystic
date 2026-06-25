// src/components/ui/FloatingCartButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { setCartOpen } from '@/lib/store/uiSlice'
import { ShoppingBag, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ✅ Animation variants
const buttonVariants = {
  hidden: { 
    scale: 0, 
    opacity: 0 
  },
  visible: { 
    scale: 1, 
    opacity: 1 
  },
  exit: { 
    scale: 0, 
    opacity: 0 
  }
}

const buttonTransition = {
  type: 'spring' as const,
  damping: 20,
  stiffness: 300,
  delay: 0.5
}

const badgeVariants = {
  hidden: { 
    scale: 0 
  },
  visible: { 
    scale: 1 
  }
}

const badgeTransition = {
  type: 'spring' as const,
  damping: 15,
  stiffness: 400
}

const pulseRingVariants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0 
  },
  visible: { 
    scale: 1, 
    opacity: 1 
  }
}

const pulseRingTransition = {
  duration: 0.3,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const
}

const miniPreviewVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1 
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    scale: 0.9 
  }
}

const miniPreviewTransition = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: (index: number) => ({
    opacity: 1, 
    x: 0,
    transition: {
      delay: index * 0.05,
      type: 'spring' as const,
      damping: 20,
      stiffness: 300
    }
  })
}

const priceIndicatorVariants = {
  hidden: { 
    opacity: 0, 
    y: -10,
    scale: 0.8
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1 
  }
}

const priceIndicatorTransition = {
  type: 'spring' as const,
  damping: 20,
  stiffness: 300,
  delay: 0.3
}

const tooltipVariants = {
  hidden: { 
    opacity: 0, 
    y: -10 
  },
  visible: { 
    opacity: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    y: -10 
  }
}

const tooltipTransition = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300
}

interface FloatingCartButtonProps {
  className?: string
}

export default function FloatingCartButton({ className = '' }: FloatingCartButtonProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { items, itemCount, total } = useSelector((state: RootState) => state.cart)
  const { isCartOpen } = useSelector((state: RootState) => state.ui)
  const [isVisible, setIsVisible] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [showMiniPreview, setShowMiniPreview] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  // Hide on desktop (lg screens and above)
  useEffect(() => {
    if (!isMounted) return

    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024
      setIsVisible(!isDesktop)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [isMounted])

  const handleCartToggle = () => {
    dispatch(setCartOpen(!isCartOpen))
    setShowMiniPreview(false)
  }

  const toggleMiniPreview = () => {
    setShowMiniPreview(!showMiniPreview)
  }

  const handleViewCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMiniPreview(false)
    dispatch(setCartOpen(true))
  }

  // ✅ Don't render on desktop OR when cart is open
  if (!isVisible || isCartOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Mini Cart Preview */}
      <AnimatePresence>
        {showMiniPreview && items.length > 0 && (
          <motion.div
            variants={miniPreviewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={miniPreviewTransition}
            className="absolute bottom-20 right-0 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Your Cart
              </h3>
              <span className="text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-2">
              {items.slice(0, 3).map((item, index) => (
                <motion.div
                  key={item.id}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                      {item.variantValue && ` • ${item.variantValue}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </span>
                </motion.div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-center text-gray-500 py-2">
                  +{items.length - 3} more {items.length - 3 === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Total
                </span>
                <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  KSh {total.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleViewCart}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  View Cart
                </button>
                <button 
                  onClick={() => setShowMiniPreview(false)}
                  className="px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <div className="relative">
        <motion.button
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={buttonTransition}
          onMouseEnter={() => {
            setIsHovered(true)
            if (items.length > 0 && !isTouchDevice) {
              setShowMiniPreview(true)
            }
          }}
          onMouseLeave={() => {
            setIsHovered(false)
            if (!isTouchDevice) {
              setShowMiniPreview(false)
            }
          }}
          onTouchStart={() => {
            if (items.length > 0) {
              toggleMiniPreview()
            }
          }}
          onClick={handleCartToggle}
          className={cn(
            "w-16 h-16 rounded-full",
            "bg-gradient-to-r from-pink-600 to-purple-600",
            "shadow-lg hover:shadow-xl",
            "flex items-center justify-center",
            "transition-all duration-300",
            "hover:scale-110 active:scale-95",
            "group",
            className
          )}
          aria-label="Open cart"
        >
          <ShoppingBag className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-110" />
          
          {/* Item count badge */}
          {itemCount > 0 && (
            <motion.span
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              transition={badgeTransition}
              className="absolute -top-1 -right-1 min-w-[24px] h-[24px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </motion.span>
          )}

          {/* Pulsing ring - only when items are in cart */}
          {itemCount > 0 && (
            <motion.div
              variants={pulseRingVariants}
              initial="hidden"
              animate="visible"
              transition={pulseRingTransition}
              className="absolute inset-0 rounded-full border-2 border-pink-600/30"
            />
          )}
        </motion.button>

        {/* Price indicator - shows total below the button */}
        {total > 0 && (
          <motion.div
            variants={priceIndicatorVariants}
            initial="hidden"
            animate="visible"
            transition={priceIndicatorTransition}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md"
          >
            KSh {total.toLocaleString()}
          </motion.div>
        )}

        {/* Tooltip on hover */}
        <AnimatePresence>
          {isHovered && itemCount === 0 && (
            <motion.div
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={tooltipTransition}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md"
            >
              Your cart is empty
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}