// src/components/ui/ProductGrid.tsx
'use client'

import ProductCard from './ProductCard'
import { Skeleton } from '@/components/shadCn/ui/skeleton'
import { cn } from '@/lib/utils'

interface ProductGridProps {
  products: any[]
  loading?: boolean
  showDiscountBadge?: boolean
  showTimer?: boolean
  columns?: 2 | 3 | 4 | 5 | 6
  variant?: 'default' | 'compact' | 'featured'
  className?: string
  emptyMessage?: string
}

export default function ProductGrid({ 
  products, 
  loading = false, 
  showDiscountBadge = false,
  showTimer = false,
  columns = 4,
  variant = 'default',
  className = '',
  emptyMessage = 'No products found'
}: ProductGridProps) {
  // Determine grid columns based on screen size
  const getGridCols = () => {
    switch (columns) {
      case 2: return 'grid-cols-2'
      case 3: return 'grid-cols-2 md:grid-cols-3'
      case 4: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      case 5: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      case 6: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn(`grid ${getGridCols()} gap-3 md:gap-4`, className)}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🛍️</div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
          {emptyMessage}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Try adjusting your filters or search terms
        </p>
      </div>
    )
  }

  // Product grid
  return (
    <div className={cn(`grid ${getGridCols()} gap-3 md:gap-4`, className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showDiscountBadge={showDiscountBadge}
          showTimer={showTimer}
          variant={variant}
        />
      ))}
    </div>
  )
}