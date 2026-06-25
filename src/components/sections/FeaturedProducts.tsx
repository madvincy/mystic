// src/components/sections/FeaturedProducts.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import ProductGrid from '../ui/ProductGrid'

interface FeaturedProductsProps {
  products: any[]
  loading?: boolean
  title?: string
  viewAllLink?: string
  className?: string
}

export default function FeaturedProducts({
  products,
  loading = false,
  title = 'Featured Products',
  viewAllLink = '/products?featured=true',
  className = ''
}: FeaturedProductsProps) {
  if (products.length === 0 && !loading) return null

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-pink-600" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Link href={viewAllLink}>
          <Button variant="ghost" className="text-pink-600 hover:text-pink-700 group">
            View All
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
      <ProductGrid 
        products={products} 
        loading={loading} 
        showDiscountBadge
      />
    </section>
  )
}