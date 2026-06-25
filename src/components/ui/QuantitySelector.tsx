// src/components/ui/QuantitySelector.tsx
'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/shadCn/ui/button'

interface QuantitySelectorProps {
  quantity?: number
  min?: number
  max?: number
  onChange?: (value: number) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function QuantitySelector({
  quantity: initialQuantity = 1,
  min = 1,
  max = 999,
  onChange,
  className = '',
  size = 'md',
  showLabel = true
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  const handleChange = (newValue: number) => {
    const clamped = Math.min(Math.max(newValue, min), max)
    setQuantity(clamped)
    onChange?.(clamped)
  }

  const buttonSizes = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-sm font-medium mr-2">Qty:</span>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleChange(quantity - 1)}
        disabled={quantity <= min}
        className={cn(buttonSizes[size], "rounded-full")}
      >
        <Minus className={iconSizes[size]} />
      </Button>
      <input
        type="number"
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value)
          if (!isNaN(val)) handleChange(val)
        }}
        min={min}
        max={max}
        className={cn(
          "w-12 text-center border-0 focus:ring-0 bg-transparent font-medium",
          size === 'sm' ? 'text-sm' : 'text-base'
        )}
        aria-label="Quantity"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleChange(quantity + 1)}
        disabled={quantity >= max}
        className={cn(buttonSizes[size], "rounded-full")}
      >
        <Plus className={iconSizes[size]} />
      </Button>
    </div>
  )
}