// src/app/products/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/lib/store'
import { fetchProducts } from '@/lib/store/productSlice'
import { supabase } from '@/lib/supabase/client'
import { clearAllCache, getCacheStats } from '@/lib/db/indexedDB'
import { useProductSync } from '@/lib/hooks/useProductSync'
import { SyncStatus } from '@/components/ui/SyncStatus'
import ProductGrid from '@/components/ui/ProductGrid'
import ProductSort from '@/components/ui/ProductSort'
import CategoryFilter from '@/components/ui/CategoryFilter'
import PriceFilter from '@/components/ui/PriceFilter'
import SearchBar from '@/components/ui/SearchBar'
import { Button } from '@/components/shadCn/ui/button'
import { Filter, X, RefreshCw, CloudOff, Cloud } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const { products, loading } = useSelector((state: RootState) => state.products)
  
  const { isSyncing, progress, total, error, metrics, sync } = useProductSync()
  
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  // ✅ Fix: Initialize isOnline as true on client, false on server
  const [isOnline, setIsOnline] = useState(true) // Default to true for client
  const [isMounted, setIsMounted] = useState(false) // Track mount state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [showSyncStatus, setShowSyncStatus] = useState(false)
  
  const [activeFilters, setActiveFilters] = useState({
    category: null as string | null,
    subcategory: null as string | null,
    search: null as string | null,
    minPrice: null as string | null,
    maxPrice: null as string | null,
    inStock: null as string | null,
    onSale: null as string | null,
    featured: null as string | null,
    newArrival: null as string | null,
    sort: null as string | null,
  })

  // ✅ Set mounted state and check online status only on client
  useEffect(() => {
    setIsMounted(true)
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
  }, [])

  // ✅ Network status - only run on client
  useEffect(() => {
    if (!isMounted) return

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online')
      // Auto-sync when coming back online
      sync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You are offline - showing cached products')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [sync, isMounted])

  // ✅ Sync on mount if needed - only on client
  useEffect(() => {
    if (!isMounted) return

    const hasCachedData = async () => {
      const stats = await getCacheStats()
      return stats.products > 0
    }
    
    hasCachedData().then(hasCache => {
      if (!hasCache && isOnline) {
        sync()
      }
    })
  }, [sync, isOnline, isMounted])

  // ✅ Force refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setShowSyncStatus(true)
    try {
      await clearAllCache()
      const result = await dispatch(fetchProducts()).unwrap()
      console.log('✅ Products refreshed:', result)
      toast.success('Products refreshed successfully')
      setShowSyncStatus(false)
    } catch (error) {
      console.error('Refresh error:', error)
      toast.error('Failed to refresh products')
    } finally {
      setIsRefreshing(false)
    }
  }, [dispatch])

  // ✅ Manual sync
  const handleSync = useCallback(async () => {
    setShowSyncStatus(true)
    await sync()
  }, [sync])

  // ✅ Initial fetch - only on client
  useEffect(() => {
    if (!isMounted) return

    const loadProducts = async () => {
      try {
        await dispatch(fetchProducts()).unwrap()
      } catch (error) {
        console.error('Failed to load products:', error)
      }
    }
    loadProducts()
  }, [dispatch, isMounted])

  // ✅ Set up real-time subscription - only on client
  useEffect(() => {
    if (!isMounted || !isOnline) return

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        async (payload) => {
          console.log('🔄 Product change detected:', payload)
          setShowSyncStatus(true)
          try {
            await clearAllCache()
            await dispatch(fetchProducts()).unwrap()
            toast.info('Products updated', { duration: 2000, icon: '🔄' })
          } catch (error) {
            console.error('Failed to update products:', error)
          } finally {
            setTimeout(() => setShowSyncStatus(false), 3000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch, isOnline, isMounted])

  // ✅ Parse URL params
  useEffect(() => {
    const category = searchParams?.get('category')
    const subcategory = searchParams?.get('subcategory')
    const search = searchParams?.get('search')
    const sort = searchParams?.get('sort')
    const minPrice = searchParams?.get('minPrice')
    const maxPrice = searchParams?.get('maxPrice')
    const inStock = searchParams?.get('inStock')
    const onSale = searchParams?.get('onSale')
    const featured = searchParams?.get('featured')
    const newArrival = searchParams?.get('new')

    setActiveFilters({
      category: category || null,
      subcategory: subcategory || null,
      search: search || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      inStock: inStock || null,
      onSale: onSale || null,
      featured: featured || null,
      newArrival: newArrival || null,
      sort: sort || null,
    })

    setSelectedCategory(category || null)
    setSelectedSubcategory(subcategory || null)
  }, [searchParams])

  // ✅ Filter and sort products - memoized for performance
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]
    
    if (activeFilters.subcategory) {
      filtered = filtered.filter(p => 
        p.subcategory?.slug === activeFilters.subcategory ||
        p.subcategory?.name?.toLowerCase() === activeFilters.subcategory?.toLowerCase()
      )
    } else if (activeFilters.category) {
      filtered = filtered.filter(p => 
        p.category?.slug === activeFilters.category || 
        p.category?.name?.toLowerCase() === activeFilters.category?.toLowerCase()
      )
    }

    if (activeFilters.search) {
      const searchLower = activeFilters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }

    if (activeFilters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseInt(activeFilters.minPrice!))
    }

    if (activeFilters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseInt(activeFilters.maxPrice!))
    }

    if (activeFilters.inStock === 'true') {
      filtered = filtered.filter(p => p.stock_status === 'in_stock')
    }

    if (activeFilters.onSale === 'true') {
      filtered = filtered.filter(p => p.sale_price && p.sale_price < p.price)
    }

    if (activeFilters.featured === 'true') {
      filtered = filtered.filter(p => p.is_featured === true)
    }

    if (activeFilters.newArrival === 'true') {
      filtered = filtered.filter(p => p.is_new === true)
    }

    // Sort
    if (activeFilters.sort) {
      switch (activeFilters.sort) {
        case 'price_low':
          filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
          break
        case 'price_high':
          filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
          break
        case 'popular':
          filtered.sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
          break
        case 'rating':
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        case 'name_asc':
          filtered.sort((a, b) => a.name?.localeCompare(b.name) || 0)
          break
        case 'name_desc':
          filtered.sort((a, b) => b.name?.localeCompare(a.name) || 0)
          break
        default:
          filtered.sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
          break
      }
    } else {
      filtered.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    }

    return filtered
  }, [products, activeFilters])

  useEffect(() => {
    setFilteredProducts(filteredAndSortedProducts)
  }, [filteredAndSortedProducts])

  const totalProducts = filteredProducts.length
  const hasActiveFilters = Object.values(activeFilters).some(v => v !== null)

  const getDisplayName = useCallback(() => {
    if (activeFilters.subcategory) {
      const sub = products.find(p => p.subcategory?.slug === activeFilters.subcategory)?.subcategory
      return sub?.name || activeFilters.subcategory
    }
    if (activeFilters.category) {
      const cat = products.find(p => p.category?.slug === activeFilters.category)?.category
      return cat?.name || activeFilters.category
    }
    return 'All Products'
  }, [activeFilters, products])

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete(key)
    router.push(`/products?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push('/products')
  }

  // ✅ Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Sync Status */}
      <SyncStatus
        isSyncing={isSyncing || showSyncStatus}
        progress={progress}
        total={total}
        error={error}
        metrics={metrics}
        onRetry={sync}
      />

      {/* Network Status Bar - only shows when mounted */}
      {isMounted && (
        <div className="mb-4">
          <div className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
            isOnline ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="h-4 w-4" />
              ) : (
                <CloudOff className="h-4 w-4" />
              )}
              <span>
                {isOnline ? 'Online' : 'Offline - Showing cached products'}
              </span>
            </div>
            {!isOnline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="text-xs"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar */}
        <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
          <div className="sticky top-20 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <SearchBar variant="compact" />
            <CategoryFilter />
            <PriceFilter />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold capitalize">{getDisplayName()}</h1>
              <p className="text-sm text-gray-500">
                Showing {totalProducts} product{totalProducts !== 1 ? 's' : ''}
                {hasActiveFilters && ' (filtered)'}
                {!isOnline && ' (cached)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="relative"
                title="Sync with database"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Sync</span>
                {isSyncing && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-pink-600 rounded-full animate-pulse" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="relative"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <ProductSort />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.subcategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full text-xs sm:text-sm">
                  {getDisplayName()}
                  <button
                    onClick={() => removeFilter('subcategory')}
                    className="ml-1 hover:text-pink-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.category && !activeFilters.subcategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full text-xs sm:text-sm">
                  {getDisplayName()}
                  <button
                    onClick={() => removeFilter('category')}
                    className="ml-1 hover:text-pink-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs sm:text-sm">
                  Search: {activeFilters.search}
                  <button
                    onClick={() => removeFilter('search')}
                    className="ml-1 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.minPrice && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs sm:text-sm">
                  Min: ${activeFilters.minPrice}
                  <button
                    onClick={() => removeFilter('minPrice')}
                    className="ml-1 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.maxPrice && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs sm:text-sm">
                  Max: ${activeFilters.maxPrice}
                  <button
                    onClick={() => removeFilter('maxPrice')}
                    className="ml-1 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.inStock === 'true' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs sm:text-sm">
                  In Stock
                  <button
                    onClick={() => removeFilter('inStock')}
                    className="ml-1 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.onSale === 'true' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs sm:text-sm">
                  On Sale
                  <button
                    onClick={() => removeFilter('onSale')}
                    className="ml-1 hover:text-amber-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.featured === 'true' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-xs sm:text-sm">
                  Featured
                  <button
                    onClick={() => removeFilter('featured')}
                    className="ml-1 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeFilters.newArrival === 'true' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs sm:text-sm">
                  New Arrival
                  <button
                    onClick={() => removeFilter('new')}
                    className="ml-1 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          <ProductGrid 
            products={filteredProducts} 
            loading={loading || isSyncing} 
            showDiscountBadge
          />
        </div>
      </div>

      {/* Mobile Filters */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 z-50 shadow-xl overflow-y-auto lg:hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h2 className="font-semibold">Filters</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 space-y-6">
                <SearchBar variant="compact" />
                <CategoryFilter />
                <PriceFilter />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}