// src/components/sections/CategoryShowcase.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import CategoryCard from '../ui/CategoryCard'
import { cn } from '@/lib/utils'

interface CategoryShowcaseProps {
  categories: any[]
  title?: string
  description?: string
  className?: string
  columns?: 2 | 3 | 4 | 5
  variant?: 'default' | 'compact' | 'large'
  showViewAll?: boolean
}

export default function CategoryShowcase({
  categories,
  title = 'Shop by Category',
  description = 'Explore our curated collection of premium products',
  className = '',
  columns = 4,
  variant = 'default',
  showViewAll = true
}: CategoryShowcaseProps) {
  if (categories.length === 0) return null

  const getGridCols = () => {
    switch (columns) {
      case 2: return 'grid-cols-2'
      case 3: return 'grid-cols-2 md:grid-cols-3'
      case 4: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      case 5: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
      default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    }
  }

  return (
    <section className={cn("py-8", className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">{title}</h2>
            {description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          {showViewAll && (
            <Link href="/products">
              <Button variant="ghost" className="text-pink-600 hover:text-pink-700 group">
                View All Categories
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
        </div>

        {/* Categories Grid */}
        <div className={cn(`grid ${getGridCols()} gap-4 md:gap-6`)}>
          {categories.map((category, index) => (
            <motion.div
              key={category.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <CategoryCard category={category} variant={variant} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}