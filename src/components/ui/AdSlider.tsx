// src/components/ui/AdSlider.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Ad } from '@/types'
import { cn } from '@/lib/utils'

interface AdSliderProps {
  className?: string
  autoPlay?: boolean
  interval?: number
  showControls?: boolean
  showDots?: boolean
  fullWidth?: boolean
}

export default function AdSlider({ 
  className = '',
  autoPlay = true,
  interval = 5000,
  showControls = true,
  showDots = true,
  fullWidth = true
}: AdSliderProps) {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const fetchAds = async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true })
      
      if (data) setAds(data)
      setLoading(false)
    }
    fetchAds()
  }, [])

  useEffect(() => {
    if (ads.length === 0 || !autoPlay || isPaused) return
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, interval)
    
    return () => clearInterval(timer)
  }, [ads.length, autoPlay, interval, isPaused])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  if (loading) {
    return (
      <div className={cn(
        "relative bg-gray-200 dark:bg-gray-800 aspect-[16/6] max-h-[400px] animate-pulse",
        fullWidth ? "w-screen relative left-1/2 -translate-x-1/2" : "rounded-xl",
        className
      )} />
    )
  }

  if (ads.length === 0) {
    return (
      <div className={cn(
        "relative overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[16/6] max-h-[400px] flex items-center justify-center",
        fullWidth ? "w-full -mx-4 sm:-mx-6 lg:-mx-8" : "rounded-xl",
        className
      )}>
        <p className="text-gray-500 dark:text-gray-400">No advertisements available</p>
      </div>
    )
  }

  const currentAd = ads[currentIndex]

  return (
    <div className={cn(
      "relative overflow-hidden group",
       fullWidth ? "w-screen relative left-1/2 -translate-x-1/2" : "rounded-xl",
      className
    )}>
      <div className="relative aspect-[16/6] max-h-[800px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
          >
            {currentAd.product_id ? (
              <a href={`/products/${currentAd.product_id}`} className="block w-full h-full">
                <Image
                  src={currentAd.image_url}
                  alt={currentAd.title || 'Advertisement'}
                  fill
                  className="object-cover"
                  priority
                />
              </a>
            ) : (
              <Image
                src={currentAd.image_url}
                alt={currentAd.title || 'Advertisement'}
                fill
                className="object-cover"
                priority
              />
            )}
            
            {/* Title Overlay */}
            {currentAd.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-xl font-semibold">{currentAd.title}</h3>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      {showControls && ads.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={togglePause}
            className="absolute bottom-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "w-6 bg-pink-600" 
                  : "w-2 bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {ads.length}
        </div>
      )}
    </div>
  )
}