// src/lib/hooks/useProductSync.ts
import { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import { fetchProducts } from '@/lib/store/productSlice'
import { clearProductsCache, getCacheStats, batchSaveToCache } from '@/lib/db/indexedDB'
import { toast } from 'sonner'

interface UseProductSyncReturn {
  isSyncing: boolean
  progress: number
  total: number
  error: string | null
  metrics: any
  sync: () => Promise<void>
  reset: () => void
}

export function useProductSync(): UseProductSyncReturn {
  const dispatch = useDispatch<AppDispatch>()
  const [isSyncing, setIsSyncing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<any>(null)

  const sync = useCallback(async () => {
    // Prevent multiple syncs running simultaneously
    if (isSyncing) {
      console.log('⚠️ Sync already in progress, skipping...')
      return
    }

    setIsSyncing(true)
    setError(null)
    setProgress(0)
    setMetrics(null)

    try {
      console.log('🔄 Starting product sync...')

      // Step 1: Get total count for progress tracking
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError
      
      const totalCount = count || 0
      setTotal(totalCount)
      console.log(`📊 Total products to sync: ${totalCount}`)

      // Step 2: Fetch all data in parallel
      console.log('🌐 Fetching data from Supabase...')
      const [productsRes, categoriesRes, variantsRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('product_variants').select('*'),
      ])

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (variantsRes.error) throw variantsRes.error

      const products = productsRes.data || []
      const categories = categoriesRes.data || []
      const variants = variantsRes.data || []

      console.log(`✅ Fetched ${products.length} products, ${categories.length} categories, ${variants.length} variants`)

      // Step 3: Clear existing cache
      console.log('🗑️ Clearing products cache...')
      await clearProductsCache()

      // Step 4: Save to cache with progress tracking
      console.log('💾 Saving to IndexedDB...')
      const batchSize = 50
      let synced = 0

      // Save products in batches
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        await batchSaveToCache('products', batch)
        synced += batch.length
        setProgress(synced)
        
        // Log progress every 5 batches
        if (i % (batchSize * 5) === 0 && i > 0) {
          console.log(`📦 Synced ${synced}/${products.length} products`)
        }
      }

      // Save categories and variants (they're usually smaller)
      if (categories.length > 0) {
        await batchSaveToCache('categories', categories)
        console.log(`✅ Saved ${categories.length} categories`)
      }
      
      if (variants.length > 0) {
        await batchSaveToCache('variants', variants)
        console.log(`✅ Saved ${variants.length} variants`)
      }

      // Step 5: Update Redux state - FIXED with .unwrap()
      console.log('🔄 Updating Redux store...')
      try {
        await dispatch(fetchProducts()).unwrap()
        console.log('✅ Redux store updated')
      } catch (reduxError) {
        console.error('❌ Failed to update Redux:', reduxError)
        throw reduxError
      }

      // Step 6: Get cache metrics
      const cacheStats = await getCacheStats()
      console.log('📊 Cache stats:', cacheStats)

      // Step 7: Set metrics
      const syncMetrics = {
        productCount: products.length,
        categoryCount: categories.length,
        variantCount: variants.length,
        fromCache: false,
        totalTime: 0,
        cacheStats,
      }
      setMetrics(syncMetrics)

      // Step 8: Show success message
      const message = `Synced ${products.length} products, ${categories.length} categories, and ${variants.length} variants`
      console.log(`✅ Sync complete: ${message}`)
      toast.success(`Sync complete! ${message}`)

    } catch (err: any) {
      console.error('❌ Sync error:', err)
      
      // Handle specific error types
      let errorMessage = 'Failed to sync products'
      if (err.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check your authentication.'
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSyncing(false)
      setProgress(0)
      console.log('🏁 Sync process completed')
    }
  }, [dispatch, isSyncing])

  const reset = useCallback(() => {
    setProgress(0)
    setTotal(0)
    setError(null)
    setMetrics(null)
    setIsSyncing(false)
  }, [])

  return {
    isSyncing,
    progress,
    total,
    error,
    metrics,
    sync,
    reset,
  }
}