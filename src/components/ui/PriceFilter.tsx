// src/components/ui/PriceFilter.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Slider } from '@/components/shadCn/ui/slider'
import { Input } from '@/components/shadCn/ui/input'
import { Button } from '@/components/shadCn/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface PriceFilterProps {
  className?: string
  onPriceChange?: (min: number, max: number) => void
  min?: number
  max?: number
}

export default function PriceFilter({ className = '', onPriceChange, min = 0, max = 100000 }: PriceFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [priceRange, setPriceRange] = useState<[number, number]>([min, max])
  const [maxPrice, setMaxPrice] = useState(max)

  // Get max price from products
  useEffect(() => {
    const fetchMaxPrice = async () => {
      const { data } = await supabase
        .from('products')
        .select('price')
        .order('price', { ascending: false })
        .limit(1)
      
      if (data && data.length > 0) {
        const maxVal = Math.ceil(data[0].price / 1000) * 1000
        setMaxPrice(maxVal)
        setPriceRange([0, maxVal])
      }
    }
    fetchMaxPrice()
  }, [])

  // Parse URL params
  useEffect(() => {
    const minParam = searchParams?.get('minPrice')
    const maxParam = searchParams?.get('maxPrice')
    
    if (minParam && maxParam) {
      setPriceRange([parseInt(minParam), parseInt(maxParam)])
    }
  }, [searchParams])

  const handleSliderChange = (value: number[]) => {
    setPriceRange([value[0], value[1]])
  }

  const handleInputChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0
    const newRange = [...priceRange] as [number, number]
    newRange[index] = Math.max(0, numValue)
    if (newRange[0] > newRange[1]) {
      newRange[1] = newRange[0]
    }
    setPriceRange(newRange)
  }

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (priceRange[0] > 0) {
      params.set('minPrice', priceRange[0].toString())
    } else {
      params.delete('minPrice')
    }
    if (priceRange[1] < maxPrice) {
      params.set('maxPrice', priceRange[1].toString())
    } else {
      params.delete('maxPrice')
    }
    router.push(`/products?${params.toString()}`)
    onPriceChange?.(priceRange[0], priceRange[1])
  }

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('minPrice')
    params.delete('maxPrice')
    router.push(`/products?${params.toString()}`)
    setPriceRange([0, maxPrice])
    onPriceChange?.(0, maxPrice)
  }

  const hasActiveFilter = searchParams?.has('minPrice') || searchParams?.has('maxPrice')

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Price Range</span>
          {hasActiveFilter && (
            <button
              onClick={clearFilter}
              className="text-xs text-pink-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <Slider
          min={0}
          max={maxPrice}
          step={100}
          value={[priceRange[0], priceRange[1]]}
          onValueChange={handleSliderChange}
          className="py-2"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-gray-500">KSh</span>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => handleInputChange(0, e.target.value)}
              className="w-full h-8 text-sm"
              min={0}
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-gray-500">KSh</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => handleInputChange(1, e.target.value)}
              className="w-full h-8 text-sm"
              min={0}
            />
          </div>
        </div>
      </div>
      <Button
        onClick={applyFilter}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white h-8 text-sm"
      >
        Apply Price Filter
      </Button>
    </div>
  )
}