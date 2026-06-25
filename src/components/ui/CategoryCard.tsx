// src/components/ui/CategoryCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  category: {
    id?: string
    name: string
    slug?: string
    image?: string
    icon?: string
    count?: number
    description?: string
  }
  className?: string
  variant?: 'default' | 'compact' | 'large'
}

export default function CategoryCard({ 
  category, 
  className = '',
  variant = 'default'
}: CategoryCardProps) {
  const href = category.slug ? `/products/${category.slug}` : `/products?category=${encodeURIComponent(category.name)}`

  if (variant === 'compact') {
    return (
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {category.icon || '📦'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm group-hover:text-pink-600 transition line-clamp-1">
              {category.name}
            </h4>
            {category.count !== undefined && (
              <p className="text-xs text-gray-500">{category.count} items</p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-pink-600 transition" />
        </motion.div>
      </Link>
    )
  }

  if (variant === 'large') {
    return (
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gradient-to-br from-pink-600 to-purple-600"
        >
          {category.image && (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="text-6xl mb-3">{category.icon || '📦'}</div>
            <h3 className="text-2xl font-bold">{category.name}</h3>
            {category.count !== undefined && (
              <p className="text-white/80 text-sm">{category.count} items</p>
            )}
            <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-full group-hover:bg-white/30 transition">
              Explore <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </motion.div>
      </Link>
    )
  }

  // Default
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          "group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all",
          className
        )}
      >
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {category.icon || '📦'}
            </div>
          )}
        </div>
        <div className="p-4 text-center">
          <h3 className="font-semibold text-base group-hover:text-pink-600 transition">
            {category.name}
          </h3>
          {category.count !== undefined && (
            <p className="text-sm text-gray-500">{category.count} items</p>
          )}
          {category.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{category.description}</p>
          )}
        </div>
      </motion.div>
    </Link>
  )
}