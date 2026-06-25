// src/components/ui/EmptyState.tsx
'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/shadCn/ui/button'
import { ShoppingBag, Heart, Search, Package, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: 'cart' | 'wishlist' | 'search' | 'orders' | 'error' | React.ReactNode
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({
  title,
  description,
  icon = 'cart',
  actionLabel,
  actionHref,
  onAction,
  className = ''
}: EmptyStateProps) {
  const getIcon = () => {
    if (typeof icon === 'object') return icon
    
    const iconMap = {
      cart: <ShoppingBag className="h-12 w-12" />,
      wishlist: <Heart className="h-12 w-12" />,
      search: <Search className="h-12 w-12" />,
      orders: <Package className="h-12 w-12" />,
      error: <AlertCircle className="h-12 w-12" />
    }
    return iconMap[icon as keyof typeof iconMap] || <ShoppingBag className="h-12 w-12" />
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
          {description}
        </p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        <Button 
          className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
          onClick={onAction}
          asChild={!!actionHref}
        >
          {actionHref ? (
            <Link href={actionHref}>{actionLabel}</Link>
          ) : (
            actionLabel
          )}
        </Button>
      )}
    </div>
  )
}