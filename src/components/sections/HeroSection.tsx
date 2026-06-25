// src/components/sections/HeroSection.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/shadCn/ui/button'
import { ArrowRight, Sparkles, Wine, Gift } from 'lucide-react'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  backgroundImage?: string
  className?: string
}

export default function HeroSection({
  title = "Welcome to Mystic Wines",
  subtitle = "Discover our exquisite collection of premium wines & spirits, delivered with care.",
  ctaText = "Shop Now",
  ctaLink = "/products",
  secondaryCtaText = "Explore Gifts",
  secondaryCtaLink = "/gifts",
  backgroundImage,
  className = ""
}: HeroSectionProps) {
  return (
    <section className={className}>
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 text-white ${backgroundImage ? '' : 'min-h-[500px]'} flex items-center`}>
        {backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 opacity-10">
          <Wine className="h-32 w-32" />
        </div>
        <div className="absolute bottom-10 left-10 opacity-10">
          <Sparkles className="h-24 w-24" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium mb-4"
            >
              🍷 Premium Selection
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={ctaLink}>
                <Button size="lg" className="bg-white text-pink-600 hover:bg-white/90 hover:text-pink-700">
                  {ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={secondaryCtaLink}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Gift className="mr-2 h-5 w-5" />
                  {secondaryCtaText}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/20">
              {[
                { label: 'Premium Brands', value: '500+' },
                { label: 'Happy Customers', value: '10K+' },
                { label: 'Years of Excellence', value: '5+' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}