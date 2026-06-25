// src/components/ui/StarRating.tsx
'use client'

import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
  readonly?: boolean
  onChange?: (rating: number) => void
}

export default function StarRating({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  className = '',
  readonly = true,
  onChange
}: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  }

  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index + 1)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[...Array(max)].map((_, index) => {
          const isFilled = index < fullStars
          const isHalf = index === fullStars && hasHalfStar
          
          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              disabled={readonly}
              className={cn(
                "transition-colors",
                !readonly && "hover:scale-110 cursor-pointer",
                readonly && "cursor-default"
              )}
              type="button"
            >
              {isFilled ? (
                <Star className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
              ) : isHalf ? (
                <StarHalf className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
              ) : (
                <Star className={cn(sizeClasses[size], "text-gray-300 dark:text-gray-600")} />
              )}
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm text-gray-500 ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}