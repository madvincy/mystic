// src/components/sections/Testimonials.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface Testimonial {
  id: string
  name: string
  role?: string
  avatar?: string
  rating: number
  content: string
  date?: string
}

interface TestimonialsProps {
  testimonials?: Testimonial[]
  title?: string
  className?: string
  autoPlay?: boolean
  interval?: number
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah M.',
    role: 'Wine Enthusiast',
    rating: 5,
    content: 'Mystic Wines has the most incredible selection. Their delivery is always on time and the quality is exceptional!',
  },
  {
    id: '2',
    name: 'John K.',
    role: 'Restaurant Owner',
    rating: 5,
    content: 'We\'ve been sourcing our wines from Mystic Wines for years. Their expertise and customer service is unmatched.',
  },
  {
    id: '3',
    name: 'Grace W.',
    role: 'Event Planner',
    rating: 4,
    content: 'Perfect for corporate events. The team helped us choose the right wines and everything was delivered flawlessly.',
  },
  {
    id: '4',
    name: 'Michael O.',
    role: 'Loyal Customer',
    rating: 5,
    content: 'The best wine shop in town! The staff is knowledgeable and always ready to help with recommendations.',
  },
]

export default function Testimonials({
  testimonials = defaultTestimonials,
  title = 'What Our Customers Say',
  className = '',
  autoPlay = true,
  interval = 5000
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!autoPlay || isPaused) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, interval)
    return () => clearInterval(timer)
  }, [autoPlay, interval, isPaused, testimonials.length])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section className={cn("py-12 bg-gray-50 dark:bg-gray-900", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Quote Icon */}
                <Quote className="h-10 w-10 text-pink-400 mx-auto mb-4 opacity-30" />

                {/* Content */}
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  "{currentTestimonial.content}"
                </p>

                {/* Rating */}
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < currentTestimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {currentTestimonial.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{currentTestimonial.name}</p>
                    {currentTestimonial.role && (
                      <p className="text-sm text-gray-500">{currentTestimonial.role}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {testimonials.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 bg-white dark:bg-gray-800 shadow-lg p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 bg-white dark:bg-gray-800 shadow-lg p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        index === currentIndex
                          ? "w-6 bg-pink-600"
                          : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}