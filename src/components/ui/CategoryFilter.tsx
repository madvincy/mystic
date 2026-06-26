// src/components/ui/CategoryFilter.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronDown, X, Wine, Beer, Martini, Zap, CupSoda, WineIcon, Shirt, GlassWater, PillBottle, Sparkles, ShoppingBasket, Beaker, Cigarette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/shadCn/ui/button'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  count?: number
  subcategories?: Category[]
  parent_id?: string | null
}

interface CategoryFilterProps {
  className?: string
  showCounts?: boolean
  expanded?: boolean
}

// Category icons mapping
const categoryIcons: Record<string, any> = {
  'Wine': Wine,
  'Spirits': Martini,
  'Beer': Beer,
  'Energy Drinks': Zap,
  'Soft Drinks': CupSoda,
  'Merchandise': Shirt,
  'Water': GlassWater,
  'Jaba Juice': PillBottle,
  'Sparkling': Sparkles,
  'Extras': ShoppingBasket,
  'Vermouth & Shooters': Beaker,
  'Tonics': CupSoda,
  'nicotine': Cigarette,
}

export default function CategoryFilter({
  className = '',
  showCounts = true,
  expanded = true
}: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [selectedParentSlug, setSelectedParentSlug] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Get selected category from URL
  useEffect(() => {
    const categoryParam = searchParams?.get('category')
    const subcategoryParam = searchParams?.get('subcategory')
    
    if (subcategoryParam) {
      setSelectedSlug(subcategoryParam)
      // Find parent category for this subcategory
      const parent = categories.find(c => 
        c.subcategories?.some(sub => sub.slug === subcategoryParam)
      )
      if (parent) {
        setSelectedParentSlug(parent.slug)
        // Auto-expand the parent category
        setExpandedCategories(prev => new Set([...prev, parent.id]))
      }
    } else if (categoryParam) {
      setSelectedSlug(categoryParam)
      setSelectedParentSlug(null)
    } else {
      setSelectedSlug(null)
      setSelectedParentSlug(null)
    }
  }, [searchParams, categories])

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        // Fetch main categories
        const { data: mainCategories, error } = await supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .order('name')

        if (error) throw error

        // Fetch all subcategories
        const { data: allSubcategories, error: subError } = await supabase
          .from('categories')
          .select('*')
          .not('parent_id', 'is', null)
          .order('name')

        if (subError) throw subError

        // Build category tree
        const categoriesWithSubs = await Promise.all(
          (mainCategories || []).map(async (cat) => {
            const subcategories = (allSubcategories || [])
              .filter(sub => sub.parent_id === cat.id)
              .map(sub => ({
                ...sub,
                count: 0 // Will be calculated below
              }))

            // Get product counts for main category
            const { count: mainCount } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', cat.id)

            // Get product counts for subcategories
            const subcategoriesWithCounts = await Promise.all(
              subcategories.map(async (sub) => {
                const { count } = await supabase
                  .from('products')
                  .select('*', { count: 'exact', head: true })
                  .eq('category_id', sub.id)
                return { ...sub, count: count || 0 }
              })
            )

            return {
              ...cat,
              count: mainCount || 0,
              subcategories: subcategoriesWithCounts
            }
          })
        )

        setCategories(categoriesWithSubs)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleCategoryClick = (slug: string, isSubcategory: boolean = false) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    
    if (isSubcategory) {
      params.set('subcategory', slug)
      params.delete('category')
    } else {
      params.set('category', slug)
      params.delete('subcategory')
    }
    
    router.push(`/products?${params.toString()}`)
  }

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('category')
    params.delete('subcategory')
    router.push(`/products?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  const hasActiveFilter = selectedSlug !== null

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Categories
        </h3>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-6 px-2 text-xs text-pink-600 hover:text-pink-700"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="space-y-1">
          {/* All Categories Option */}
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams?.toString() || '')
              params.delete('category')
              params.delete('subcategory')
              router.push(`/products?${params.toString()}`)
            }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
              !hasActiveFilter
                ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium border border-pink-200 dark:border-pink-800"
                : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            All Categories
          </button>

          {categories.map((category) => {
            const Icon = categoryIcons[category.name] || Wine
            const hasSubcategories = category.subcategories && category.subcategories.length > 0
            const isExpanded = expandedCategories.has(category.id)
            const isSelected = selectedSlug === category.slug || selectedParentSlug === category.slug

            return (
              <div key={category.id} className="space-y-1">
                {/* Main Category Button */}
                <button
                  onClick={() => {
                    if (hasSubcategories) {
                      toggleCategory(category.id)
                    }
                    handleCategoryClick(category.slug, false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm",
                    isSelected && !selectedParentSlug
                      ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium border border-pink-200 dark:border-pink-800"
                      : selectedParentSlug === category.slug
                      ? "bg-pink-50/50 dark:bg-pink-900/10 text-pink-600 dark:text-pink-400 font-medium"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {category.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {showCounts && (
                      <span className="text-xs text-gray-400">{category.count}</span>
                    )}
                    {hasSubcategories && (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    )}
                  </div>
                </button>

                {/* Subcategories - Accordion */}
                {hasSubcategories && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-6 space-y-1 overflow-hidden border-l-2 border-pink-200 dark:border-pink-800/30 pl-3"
                  >
                    {category.subcategories?.map((sub) => {
                      const isSubSelected = selectedSlug === sub.slug
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleCategoryClick(sub.slug, true)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center justify-between",
                            isSubSelected
                              ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium border border-pink-200 dark:border-pink-800"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                            {sub.name}
                          </span>
                          {showCounts && (
                            <span className="text-xs text-gray-400">{sub.count || 0}</span>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}