// src/components/ui/ProductSort.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadCn/ui/select'
import { cn } from '@/lib/utils'

interface ProductSortProps {
  className?: string
  onSortChange?: (value: string) => void
  defaultValue?: string
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
]

export default function ProductSort({ className = '', onSortChange, defaultValue = 'newest' }: ProductSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams?.get('sort') || defaultValue

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('sort', value)
    router.push(`/products?${params.toString()}`)
    onSortChange?.(value)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px] sm:w-[200px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}