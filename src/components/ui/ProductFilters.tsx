// src/components/ui/ProductFilters.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  RotateCcw,
  Search
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Label } from '@/components/shadCn/ui/label'
import { Slider } from '@/components/shadCn/ui/slider'
import { Checkbox } from '@/components/shadCn/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/shadCn/ui/radio-group'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'


interface Category {
  id: string
  name: string
  slug: string
  count?: number
}

interface ProductFiltersProps {
  className?: string
  onFilterChange?: (filters: FilterState) => void
  showMobile?: boolean
  onClose?: () => void
}

export interface FilterState {
  category: string[]
  priceRange: [number, number]
  rating: number
  stockStatus: string[]
  sortBy: string
  search: string
  inStock: boolean
  onSale: boolean
  featured: boolean
  newArrivals: boolean
}

const defaultFilters: FilterState = {
  category: [],
  priceRange: [0, 100000],
  rating: 0,
  stockStatus: [],
  sortBy: 'newest',
  search: '',
  inStock: false,
  onSale: false,
  featured: false,
  newArrivals: false
}

export default function ProductFilters({ 
  className = '', 
  onFilterChange,
  showMobile = false,
  onClose
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [categories, setCategories] = useState<Category[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [maxPrice, setMaxPrice] = useState(100000)
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    rating: true,
    stock: true,
    features: true
  })
  const [isLoading, setIsLoading] = useState(false)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')
      
      if (data) {
        // Get product count per category
        const categoriesWithCount = await Promise.all(
          data.map(async (cat) => {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', cat.id)
            
            return { ...cat, count: count || 0 }
          })
        )
        setCategories(categoriesWithCount)
      }
    }
    fetchCategories()
  }, [])

  // Get max price from products
  useEffect(() => {
    const fetchMaxPrice = async () => {
      const { data } = await supabase
        .from('products')
        .select('price')
        .order('price', { ascending: false })
        .limit(1)
      
      if (data && data.length > 0) {
        const max = Math.ceil(data[0].price / 1000) * 1000
        setMaxPrice(max)
        setPriceRange([0, max])
        setFilters(prev => ({ ...prev, priceRange: [0, max] }))
      }
    }
    fetchMaxPrice()
  }, [])

  // Parse URL params on mount
  useEffect(() => {
    const categoryParam = searchParams?.get('category')
    const searchParam = searchParams?.get('search')
    const sortParam = searchParams?.get('sort')
    const minPriceParam = searchParams?.get('minPrice')
    const maxPriceParam = searchParams?.get('maxPrice')
    const inStockParam = searchParams?.get('inStock')
    const onSaleParam = searchParams?.get('onSale')
    const featuredParam = searchParams?.get('featured')
    const newParam = searchParams?.get('new')

    const newFilters = { ...defaultFilters }

    if (categoryParam) {
      newFilters.category = [categoryParam]
    }

    if (searchParam) {
      newFilters.search = searchParam
    }

    if (sortParam) {
      newFilters.sortBy = sortParam
    }

    if (minPriceParam && maxPriceParam) {
      newFilters.priceRange = [parseInt(minPriceParam), parseInt(maxPriceParam)]
      setPriceRange([parseInt(minPriceParam), parseInt(maxPriceParam)])
    }

    if (inStockParam === 'true') newFilters.inStock = true
    if (onSaleParam === 'true') newFilters.onSale = true
    if (featuredParam === 'true') newFilters.featured = true
    if (newParam === 'true') newFilters.newArrivals = true

    setFilters(newFilters)
  }, [searchParams])

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFilters(prev => {
      const current = prev.category
      const updated = current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId]
      return { ...prev, category: updated }
    })
  }

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]])
    setFilters(prev => ({ ...prev, priceRange: [value[0], value[1]] }))
  }

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({ ...prev, rating }))
  }

  const handleStockToggle = (status: string) => {
    setFilters(prev => {
      const current = prev.stockStatus
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status]
      return { ...prev, stockStatus: updated }
    })
  }

  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value }))
  }

  const handleFeatureToggle = (feature: keyof Pick<FilterState, 'inStock' | 'onSale' | 'featured' | 'newArrivals'>) => {
    setFilters(prev => ({ ...prev, [feature]: !prev[feature] }))
  }

  const applyFilters = () => {
    setIsLoading(true)
    
    const params = new URLSearchParams()
    
    if (filters.category.length > 0) {
      params.set('category', filters.category.join(','))
    }
    
    if (filters.search) {
      params.set('search', filters.search)
    }
    
    if (filters.sortBy !== 'newest') {
      params.set('sort', filters.sortBy)
    }
    
    if (filters.priceRange[0] > 0) {
      params.set('minPrice', filters.priceRange[0].toString())
    }
    
    if (filters.priceRange[1] < maxPrice) {
      params.set('maxPrice', filters.priceRange[1].toString())
    }
    
    if (filters.inStock) params.set('inStock', 'true')
    if (filters.onSale) params.set('onSale', 'true')
    if (filters.featured) params.set('featured', 'true')
    if (filters.newArrivals) params.set('new', 'true')
    
    const queryString = params.toString()
    const url = queryString ? `/products?${queryString}` : '/products'
    
    router.push(url)
    onFilterChange?.(filters)
    onClose?.()
    
    setTimeout(() => setIsLoading(false), 500)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    setPriceRange([0, maxPrice])
    router.push('/products')
    onFilterChange?.(defaultFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.category.length > 0) count++
    if (filters.search) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) count++
    if (filters.rating > 0) count++
    if (filters.stockStatus.length > 0) count++
    if (filters.inStock) count++
    if (filters.onSale) count++
    if (filters.featured) count++
    if (filters.newArrivals) count++
    if (filters.sortBy !== 'newest') count++
    return count
  }

  const SortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
  ]

  const RatingOptions = [
    { value: 4, label: '4★ & above' },
    { value: 3, label: '3★ & above' },
    { value: 2, label: '2★ & above' },
    { value: 1, label: '1★ & above' },
  ]

  const StockOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'pre_order', label: 'Pre-Order' },
  ]

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 rounded-lg",
      showMobile && "fixed inset-0 z-50 overflow-y-auto",
      className
    )}>
      {showMobile && (
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className={cn("p-4 space-y-6", showMobile && "pb-24")}>
        {/* Search */}
        <div className="space-y-2">
          <Label>Search Products</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, brand, category..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label>Sort By</Label>
          <RadioGroup
            value={filters.sortBy}
            onValueChange={handleSortChange}
            className="grid grid-cols-2 gap-2"
          >
            {SortOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
                <Label htmlFor={`sort-${option.value}`} className="text-sm cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left"
          >
            <Label className="text-base font-semibold">Categories</Label>
            {isExpanded.categories ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {isExpanded.categories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.category.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{category.count || 0}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left"
          >
            <Label className="text-base font-semibold">Price Range</Label>
            {isExpanded.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {isExpanded.price && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3"
              >
                <Slider
                  min={0}
                  max={maxPrice}
                  step={100}
                  value={[priceRange[0], priceRange[1]]}
                  onValueChange={handlePriceChange}
                  className="py-4"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">KSh {priceRange[0].toLocaleString()}</span>
                  <span className="text-gray-500">KSh {priceRange[1].toLocaleString()}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left"
          >
            <Label className="text-base font-semibold">Rating</Label>
            {isExpanded.rating ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {isExpanded.rating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                {RatingOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === option.value}
                      onChange={() => handleRatingChange(option.value)}
                      className="accent-pink-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {filters.rating > 0 && (
                  <button
                    onClick={() => handleRatingChange(0)}
                    className="text-sm text-pink-600 hover:underline"
                  >
                    Clear rating filter
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stock Status */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('stock')}
            className="flex items-center justify-between w-full text-left"
          >
            <Label className="text-base font-semibold">Availability</Label>
            {isExpanded.stock ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {isExpanded.stock && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                {StockOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded"
                  >
                    <Checkbox
                      checked={filters.stockStatus.includes(option.value)}
                      onCheckedChange={() => handleStockToggle(option.value)}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('features')}
            className="flex items-center justify-between w-full text-left"
          >
            <Label className="text-base font-semibold">Features</Label>
            {isExpanded.features ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {isExpanded.features && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded">
                  <Checkbox
                    checked={filters.inStock}
                    onCheckedChange={() => handleFeatureToggle('inStock')}
                  />
                  <span className="text-sm">In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded">
                  <Checkbox
                    checked={filters.onSale}
                    onCheckedChange={() => handleFeatureToggle('onSale')}
                  />
                  <span className="text-sm">On Sale</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded">
                  <Checkbox
                    checked={filters.featured}
                    onCheckedChange={() => handleFeatureToggle('featured')}
                  />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded">
                  <Checkbox
                    checked={filters.newArrivals}
                    onCheckedChange={() => handleFeatureToggle('newArrivals')}
                  />
                  <span className="text-sm">New Arrivals</span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={applyFilters}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Applying...' : 'Apply Filters'}
            <SlidersHorizontal className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Active Filters Count */}
        {getActiveFilterCount() > 0 && (
          <div className="text-center text-sm text-gray-500">
            {getActiveFilterCount()} active filter{getActiveFilterCount() > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}