// src/lib/db/indexedDB.ts
import { openDB, IDBPDatabase } from 'idb'

let dbInstance: IDBPDatabase | null = null
let dbName = 'mysticWinesDB'
let dbVersion = 3

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await openDB(dbName, dbVersion, {
      upgrade(db, oldVersion, newVersion) {
        console.log('🔄 Upgrading IndexedDB from version', oldVersion, 'to', newVersion)
        
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' })
          productStore.createIndex('category_id', 'category_id')
          productStore.createIndex('subcategory_id', 'subcategory_id')
          productStore.createIndex('is_featured', 'is_featured')
          productStore.createIndex('is_bestseller', 'is_bestseller')
          productStore.createIndex('is_new', 'is_new')
          productStore.createIndex('slug', 'slug')
          productStore.createIndex('stock_status', 'stock_status')
          productStore.createIndex('created_at', 'created_at')
          console.log('✅ Created products store')
        }
        
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
          categoryStore.createIndex('slug', 'slug')
          categoryStore.createIndex('parent_id', 'parent_id')
          console.log('✅ Created categories store')
        }
        
        if (!db.objectStoreNames.contains('subcategories')) {
          const subcategoryStore = db.createObjectStore('subcategories', { keyPath: 'id' })
          subcategoryStore.createIndex('category_id', 'category_id')
          subcategoryStore.createIndex('slug', 'slug')
          console.log('✅ Created subcategories store')
        }
        
        if (!db.objectStoreNames.contains('variants')) {
          const variantStore = db.createObjectStore('variants', { keyPath: 'id' })
          variantStore.createIndex('product_id', 'product_id')
          console.log('✅ Created variants store')
        }
        
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' })
          console.log('✅ Created cart store')
        }
        
        if (!db.objectStoreNames.contains('discounts')) {
          db.createObjectStore('discounts', { keyPath: 'id' })
          console.log('✅ Created discounts store')
        }
        
        if (!db.objectStoreNames.contains('flash_sales')) {
          db.createObjectStore('flash_sales', { keyPath: 'id' })
          console.log('✅ Created flash_sales store')
        }
        
        if (!db.objectStoreNames.contains('featured_products')) {
          db.createObjectStore('featured_products', { keyPath: 'id' })
          console.log('✅ Created featured_products store')
        }
        
        if (!db.objectStoreNames.contains('wishlist')) {
          db.createObjectStore('wishlist', { keyPath: 'id' })
          console.log('✅ Created wishlist store')
        }
        
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { 
            keyPath: 'id',
            autoIncrement: true 
          })
          syncStore.createIndex('table', 'table')
          syncStore.createIndex('operation', 'operation')
          syncStore.createIndex('created_at', 'created_at')
          syncStore.createIndex('synced', 'synced')
          console.log('✅ Created sync_queue store')
        }
      },
    })
  }
  return dbInstance
}

// ============ GENERIC CRUD OPERATIONS ============

export async function getFromCache<T = any>(storeName: string, key?: string): Promise<T | T[]> {
  try {
    const db = await getDB()
    if (key) {
      return db.get(storeName, key) as Promise<T>
    }
    return db.getAll(storeName) as Promise<T[]>
  } catch (error) {
    console.error(`❌ Error getting from cache (${storeName}):`, error)
    return [] as T[]
  }
}

export async function saveToCache(storeName: string, data: any): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(storeName, 'readwrite')
    await tx.store.put(data)
    await tx.done
  } catch (error) {
    console.error(`❌ Error saving to cache (${storeName}):`, error)
  }
}

export async function deleteFromCache(storeName: string, key: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(storeName, 'readwrite')
    await tx.store.delete(key)
    await tx.done
  } catch (error) {
    console.error(`❌ Error deleting from cache (${storeName}):`, error)
  }
}

export async function clearCache(storeName: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(storeName, 'readwrite')
    await tx.store.clear()
    await tx.done
    console.log(`🗑️ Cleared cache for: ${storeName}`)
  } catch (error) {
    console.error(`❌ Error clearing cache (${storeName}):`, error)
  }
}

export async function batchSaveToCache(storeName: string, items: any[]): Promise<void> {
  try {
    if (!items || items.length === 0) return
    
    const db = await getDB()
    const tx = db.transaction(storeName, 'readwrite')
    for (const item of items) {
      await tx.store.put(item)
    }
    await tx.done
    console.log(`✅ Batch saved ${items.length} items to ${storeName}`)
  } catch (error) {
    console.error(`❌ Error batch saving to cache (${storeName}):`, error)
  }
}

export async function getByIndex<T = any>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  try {
    const db = await getDB()
    const tx = db.transaction(storeName, 'readonly')
    const index = tx.store.index(indexName)
    return index.getAll(value) as Promise<T[]>
  } catch (error) {
    console.error(`❌ Error getting by index (${storeName}.${indexName}):`, error)
    return []
  }
}

// ============ CACHE MANAGEMENT ============

export async function clearAllCache(): Promise<void> {
  try {
    const db = await getDB()
    const storeNames = db.objectStoreNames
    
    console.log('🗑️ Clearing all cache...')
    
    for (const name of storeNames) {
      if (name === 'sync_queue') continue
      const tx = db.transaction(name, 'readwrite')
      await tx.store.clear()
      await tx.done
      console.log(`🗑️ Cleared store: ${name}`)
    }
    
    console.log('✅ All cache cleared successfully')
  } catch (error) {
    console.error('❌ Error clearing all cache:', error)
    throw error
  }
}

export async function clearProductsCache(): Promise<void> {
  await clearCache('products')
  await clearCache('variants')
  await clearCache('discounts')
  await clearCache('flash_sales')
  await clearCache('featured_products')
  console.log('✅ Products cache cleared')
}

export async function clearCategoriesCache(): Promise<void> {
  await clearCache('categories')
  await clearCache('subcategories')
  console.log('✅ Categories cache cleared')
}

// ============ SYNC QUEUE OPERATIONS ============

interface SyncQueueItem {
  id?: number
  table: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  data: any
  created_at: string
  synced: boolean
}

export async function addToSyncQueue(
  table: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  data: any
): Promise<number> {
  try {
    const db = await getDB()
    const tx = db.transaction('sync_queue', 'readwrite')
    const result = await tx.store.add({
      table,
      operation,
      data,
      created_at: new Date().toISOString(),
      synced: false,
    })
    await tx.done
    console.log(`📝 Added to sync queue: ${table} - ${operation}`)
    return result as number
  } catch (error) {
    console.error('❌ Error adding to sync queue:', error)
    throw error
  }
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  try {
    const db = await getDB()
    const tx = db.transaction('sync_queue', 'readonly')
    const items = await tx.store.getAll()
    return items.filter(item => !item.synced)
  } catch (error) {
    console.error('❌ Error getting pending sync items:', error)
    return []
  }
}

export async function markSyncComplete(id: number): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction('sync_queue', 'readwrite')
    const item = await tx.store.get(id)
    if (item) {
      item.synced = true
      await tx.store.put(item)
    }
    await tx.done
    console.log(`✅ Marked sync complete for id: ${id}`)
  } catch (error) {
    console.error('❌ Error marking sync complete:', error)
  }
}

export async function clearSyncedItems(): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction('sync_queue', 'readwrite')
    const items = await tx.store.getAll()
    const syncedIds = items.filter(item => item.synced).map(item => item.id)
    
    for (const id of syncedIds) {
      if (id) await tx.store.delete(id)
    }
    await tx.done
    console.log(`🗑️ Cleared ${syncedIds.length} synced items from queue`)
  } catch (error) {
    console.error('❌ Error clearing synced items:', error)
  }
}

// ============ SYNC PERFORMANCE ============

export interface SyncMetrics {
  totalTime: number
  steps: Record<string, number>
  productCount: number
  variantCount: number
  categoryCount: number
  fromCache: boolean
}

export async function syncWithMetrics(
  fetchFn: () => Promise<any>,
  options?: { showProgress?: boolean }
): Promise<SyncMetrics> {
  const startTime = performance.now()
  const steps: Record<string, number> = {}
  let productCount = 0
  let variantCount = 0
  let categoryCount = 0

  try {
    // Step 1: Clear cache
    const step1Start = performance.now()
    await clearProductsCache()
    steps['clearCache'] = (performance.now() - step1Start) / 1000

    // Step 2: Fetch data
    const step2Start = performance.now()
    const result = await fetchFn()
    steps['fetchData'] = (performance.now() - step2Start) / 1000

    // Step 3: Save to cache
    const step3Start = performance.now()
    if (result.products) {
      await batchSaveToCache('products', result.products)
      productCount = result.products.length
    }
    if (result.variants) {
      await batchSaveToCache('variants', result.variants)
      variantCount = result.variants.length
    }
    if (result.categories) {
      await batchSaveToCache('categories', result.categories)
      categoryCount = result.categories.length
    }
    steps['saveToCache'] = (performance.now() - step3Start) / 1000

    const totalTime = (performance.now() - startTime) / 1000

    const metrics: SyncMetrics = {
      totalTime,
      steps,
      productCount,
      variantCount,
      categoryCount,
      fromCache: false,
    }

    console.log('📊 Sync Performance:', metrics)
    return metrics
  } catch (error) {
    console.error('❌ Sync failed:', error)
    throw error
  }
}

// ============ DATABASE MAINTENANCE ============

export async function getCacheStats(): Promise<Record<string, number>> {
  try {
    const db = await getDB()
    const stats: Record<string, number> = {}
    
    for (const name of db.objectStoreNames) {
      const tx = db.transaction(name, 'readonly')
      const count = await tx.store.count()
      stats[name] = count
    }
    
    return stats
  } catch (error) {
    console.error('❌ Error getting cache stats:', error)
    return {}
  }
}

export async function clearDatabase(): Promise<void> {
  try {
    const db = await getDB()
    const storeNames = db.objectStoreNames
    
    console.log('🗑️ Clearing entire database...')
    
    for (const name of storeNames) {
      const tx = db.transaction(name, 'readwrite')
      await tx.store.clear()
      await tx.done
      console.log(`🗑️ Cleared store: ${name}`)
    }
    
    console.log('✅ Entire database cleared successfully')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  }
}

export default {
  getDB,
  getFromCache,
  saveToCache,
  deleteFromCache,
  clearCache,
  batchSaveToCache,
  getByIndex,
  clearAllCache,
  clearProductsCache,
  clearCategoriesCache,
  addToSyncQueue,
  getPendingSyncItems,
  markSyncComplete,
  clearSyncedItems,
  syncWithMetrics,
  getCacheStats,
  clearDatabase,
}