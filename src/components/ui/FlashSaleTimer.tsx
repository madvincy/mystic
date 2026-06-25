// src/components/ui/FlashSaleTimer.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FlashSaleTimerProps {
  endTime: string
  startTime?: string
  className?: string
  variant?: 'default' | 'compact' | 'hero'
  onEnd?: () => void
}

export default function FlashSaleTimer({ 
  endTime, 
  startTime, 
  className = '',
  variant = 'default',
  onEnd
}: FlashSaleTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime()
      const now = new Date().getTime()
      const difference = end - now

      if (difference <= 0) {
        setIsActive(false)
        onEnd?.()
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onEnd])

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  if (!isActive) {
    return (
      <div className={cn("text-center", className)}>
        <span className="text-red-500 font-medium">Sale Ended</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1 text-sm font-bold text-red-600", className)}>
        <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">{formatNumber(timeLeft.hours)}h</span>
        <span>:</span>
        <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">{formatNumber(timeLeft.minutes)}m</span>
        <span>:</span>
        <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">{formatNumber(timeLeft.seconds)}s</span>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("text-center", className)}
      >
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Minutes', value: timeLeft.minutes },
            { label: 'Seconds', value: timeLeft.seconds },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-4xl font-bold text-white">
                {formatNumber(item.value)}
              </div>
              <div className="text-xs text-white/70">{item.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-red-500 to-pink-600 rounded-lg p-4 text-white shadow-lg",
        className
      )}
    >
      <div className="text-center">
        <p className="text-sm font-medium mb-3 flex items-center justify-center gap-2">
          <span className="animate-pulse">🔥</span>
          Flash Sale Ends In
        </p>
        <div className="flex items-center justify-center gap-4">
          {timeLeft.days > 0 && (
            <div className="text-center">
              <div className="text-3xl font-bold bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                {formatNumber(timeLeft.days)}
              </div>
              <div className="text-xs opacity-80 mt-1">Days</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-3xl font-bold bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
              {formatNumber(timeLeft.hours)}
            </div>
            <div className="text-xs opacity-80 mt-1">Hours</div>
          </div>
          <span className="text-2xl font-bold text-white/50">:</span>
          <div className="text-center">
            <div className="text-3xl font-bold bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
              {formatNumber(timeLeft.minutes)}
            </div>
            <div className="text-xs opacity-80 mt-1">Mins</div>
          </div>
          <span className="text-2xl font-bold text-white/50">:</span>
          <div className="text-center">
            <div className="text-3xl font-bold bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
              {formatNumber(timeLeft.seconds)}
            </div>
            <div className="text-xs opacity-80 mt-1">Secs</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}