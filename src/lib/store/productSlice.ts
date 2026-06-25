// src/lib/store/productSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../supabase/client'
import { batchSaveToCache, getDB } from '../db/indexedDB'
import { Discount, FeaturedProduct, FlashSale, Product, WishlistItem } from '@/types'

// ============ FETCH CATEGORIES ============
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 [productSlice] Fetching categories...')
      
      // ✅ Fetch from Supabase first to ensure we have the latest data with image_url
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ [productSlice] Categories fetch error:', error)
        throw error
      }

      console.log('✅ [productSlice] Categories fetched from Supabase:', data?.length || 0)
      console.log('📸 [productSlice] Sample category image_url:', data?.[0]?.image_url || 'No image_url found')

      // Cache categories in IndexedDB
      if (data && data.length > 0) {
        try {
          await batchSaveToCache('categories', data)
          console.log('💾 [productSlice] Categories cached successfully')
        } catch (cacheError) {
          console.warn('⚠️ [productSlice] Could not cache categories:', cacheError)
        }
      }

      return data || []
    } catch (error: any) {
      console.error('❌ [productSlice] Categories fetch error:', error)
      
      // ✅ Fallback to cache if Supabase fails
      try {
        const db = await getDB()
        if (db.objectStoreNames.contains('categories')) {
          const cached = await db.getAll('categories')
          if (cached && cached.length > 0) {
            console.log('📦 [productSlice] Using cached categories as fallback:', cached.length)
            return cached
          }
        }
      } catch (cacheError) {
        console.warn('⚠️ [productSlice] Could not read from cache:', cacheError)
      }
      
      return rejectWithValue(error.message)
    }
  }
)

// ============ FETCH CATEGORIES WITH IMAGES ONLY ============
export const fetchCategoryImages = createAsyncThunk(
  'products/fetchCategoryImages',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('❌ [productSlice] Category images fetch error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// ============ FETCH PRODUCTS WITH ALL DATA ============
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 [productSlice] Starting fetchProducts...')
      
      // Check IndexedDB first
      const db = await getDB()
      
      // Safely try to get cached products
      let cached = []
      try {
        if (db.objectStoreNames.contains('products')) {
          cached = await db.getAll('products')
        }
      } catch (cacheError) {
        console.warn('⚠️ [productSlice] Could not read from cache:', cacheError)
      }
      
      if (cached && cached.length > 0) {
        console.log('📦 [productSlice] Products loaded from cache:', cached.length)
        
        // Try to get other data from cache
        let discounts = []
        let flashSales = []
        let featured = []
        
        try {
          if (db.objectStoreNames.contains('discounts')) {
            discounts = await db.getAll('discounts')
          }
          if (db.objectStoreNames.contains('flash_sales')) {
            flashSales = await db.getAll('flash_sales')
          }
          if (db.objectStoreNames.contains('featured_products')) {
            featured = await db.getAll('featured_products')
          }
        } catch (cacheError) {
          console.warn('⚠️ [productSlice] Could not read related data from cache:', cacheError)
        }
        
        // Enrich cached products with discount/flash sale data
        const enriched = enrichProductsWithDiscounts(cached, discounts, flashSales, featured)
        return { products: enriched, fromCache: true }
      }

      console.log('🌐 [productSlice] Fetching from Supabase...')
      
      // Fetch from Supabase with all related data
      const [productsRes, discountsRes, flashSalesRes, featuredRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            variants:product_variants(*),
            category:categories(*),
            subcategory:subcategories(*)
          `),
        supabase
          .from('discounts')
          .select('*')
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString()),
        supabase
          .from('flash_sales')
          .select(`
            *,
            products:flash_sale_products(
              *,
              product:products(*),
              variant:product_variants(*)
            )
          `)
          .eq('is_active', true)
          .gte('end_time', new Date().toISOString()),
        supabase
          .from('featured_products')
          .select(`
            *,
            product:products(*),
            variant:product_variants(*)
          `)
          .eq('is_active', true)
      ])

      if (productsRes.error) {
        console.error('❌ [productSlice] Products fetch error:', productsRes.error)
        throw productsRes.error
      }

      console.log('✅ [productSlice] Products fetched:', productsRes.data?.length || 0)

      // Enrich products with discounts and flash sales
      const enriched = enrichProductsWithDiscounts(
        productsRes.data || [],
        discountsRes.data || [],
        flashSalesRes.data || [],
        featuredRes.data || []
      )

      // Cache everything in IndexedDB
      try {
        await Promise.all([
          batchSaveToCache('products', enriched),
          batchSaveToCache('discounts', discountsRes.data || []),
          batchSaveToCache('flash_sales', flashSalesRes.data || []),
          batchSaveToCache('featured_products', featuredRes.data || [])
        ])
      } catch (cacheError) {
        console.warn('⚠️ [productSlice] Could not cache data:', cacheError)
      }

      return { products: enriched, fromCache: false }
    } catch (error: any) {
      console.error('❌ [productSlice] Fetch error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// ============ WISHLIST OPERATIONS ============
export const fetchWishlist = createAsyncThunk(
  'products/fetchWishlist',
  async (userId: string) => {
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        *,
        product:products(*),
        variant:product_variants(*)
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data
  }
)

export const toggleWishlist = createAsyncThunk(
  'products/toggleWishlist',
  async ({ userId, productId, variantId }: { userId: string; productId: string; variantId?: string }) => {
    // Check if exists
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('variant_id', variantId || '')
      .maybeSingle()

    if (existing) {
      // Remove from wishlist
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', existing.id)
      
      if (error) throw error
      return { productId, variantId, action: 'removed' }
    } else {
      // Add to wishlist
      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId || null
        })
        .select()
        .single()
      
      if (error) throw error
      return { item: data, action: 'added' }
    }
  }
)

// ============ FLASH SALE OPERATIONS ============
export const fetchActiveFlashSales = createAsyncThunk(
  'products/fetchFlashSales',
  async () => {
    const { data, error } = await supabase
      .from('flash_sales')
      .select(`
        *,
        products:flash_sale_products(
          *,
          product:products(*),
          variant:product_variants(*)
        )
      `)
      .eq('is_active', true)
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (error) throw error
    return data
  }
)

// ============ HELPER: Enrich Products ============
function enrichProductsWithDiscounts(
  products: any[],
  discounts: any[],
  flashSales: any[],
  featured: any[]
): any[] {
  const now = new Date()

  return products.map(product => {
    // Check for active discount
    const activeDiscount = discounts.find(d => {
      const start = new Date(d.start_date)
      const end = new Date(d.end_date)
      const isApplicable = !d.applicable_products || d.applicable_products.includes(product.id)
      return d.is_active && now >= start && now <= end && isApplicable
    })

    // Check for flash sale
    const flashSale = flashSales.find(fs => {
      const start = new Date(fs.start_time)
      const end = new Date(fs.end_time)
      return fs.is_active && now >= start && now <= end
    })

    const flashSaleProduct = flashSale?.products?.find(
      (fp: any) => fp.product_id === product.id
    )

    // Check if featured
    const featuredItem = featured.find(f => f.product_id === product.id)

    // Calculate sale price
    let salePrice = undefined
    
    if (flashSaleProduct?.sale_price) {
      salePrice = flashSaleProduct.sale_price
    } else if (activeDiscount) {
      if (activeDiscount.discount_type === 'percentage') {
        salePrice = product.price * (1 - activeDiscount.discount_value / 100)
      } else if (activeDiscount.discount_type === 'fixed') {
        salePrice = product.price - activeDiscount.discount_value
      }
    }

    return {
      ...product,
      discount: activeDiscount || null,
      flash_sale: flashSaleProduct || null,
      featured: featuredItem || null,
      sale_price: salePrice || null,
    }
  })
}

// ============ PRODUCT SLICE ============
interface ProductState {
  products: any[]
  categories: any[]
  subcategories: any[]
  wishlist: any[]
  flashSales: any[]
  featuredProducts: any[]
  discountedProducts: any[]
  loading: boolean
  error: string | null
  fromCache: boolean
  filters: {
    category?: string
    subcategory?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    onSale?: boolean
    featured?: boolean
    search?: string
  }
}

const initialState: ProductState = {
  products: [],
  categories: [],
  subcategories: [],
  wishlist: [],
  flashSales: [],
  featuredProducts: [],
  discountedProducts: [],
  loading: false,
  error: null,
  fromCache: false,
  filters: {}
}

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProductState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    updateWishlistLocal: (state, action: PayloadAction<{ productId: string; variantId?: string; inWishlist: boolean }>) => {
      const { productId, variantId, inWishlist } = action.payload
      const product = state.products.find(p => p.id === productId)
      if (product) {
        product.in_wishlist = inWishlist
      }
    },
    syncWishlist: (state, action: PayloadAction<any[]>) => {
      const wishlistIds = new Set(action.payload.map(w => `${w.product_id}-${w.variant_id || ''}`))
      state.products = state.products.map(p => ({
        ...p,
        in_wishlist: wishlistIds.has(`${p.id}-`)
      }))
    },
    // ✅ Add a reducer to update category images
    updateCategoryImage: (state, action: PayloadAction<{ id: string; image_url: string }>) => {
      const category = state.categories.find(c => c.id === action.payload.id)
      if (category) {
        category.image_url = action.payload.image_url
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        console.log('🔄 [productSlice] Categories fetch pending...')
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload || []
        console.log('✅ [productSlice] Categories fetch fulfilled:', state.categories.length)
        console.log('📸 [productSlice] First category image_url:', state.categories[0]?.image_url || 'No image_url')
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        console.error('❌ [productSlice] Categories fetch rejected:', action.payload)
        state.categories = []
      })
      
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
        console.log('🔄 [productSlice] Products fetch pending...')
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload.products || []
        state.fromCache = action.payload.fromCache || false
        
        console.log('✅ [productSlice] Products fetch fulfilled, products:', state.products.length)
        
        // Compute derived states
        state.featuredProducts = state.products
          .filter((p: any) => p.is_featured || p.featured)
          .sort((a: any, b: any) => (a.featured?.display_order || 0) - (b.featured?.display_order || 0))
        
        state.discountedProducts = state.products
          .filter((p: any) => p.discount || p.flash_sale)
          .sort((a: any, b: any) => {
            const aDisc = a.flash_sale?.discount_percentage || a.discount?.discount_value || 0
            const bDisc = b.flash_sale?.discount_percentage || b.discount?.discount_value || 0
            return bDisc - aDisc
          })
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ [productSlice] Products fetch rejected:', action.payload)
      })

      // Wishlist
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.wishlist = action.payload || []
        // Sync wishlist status to products
        const wishlistMap = new Map(action.payload.map((w: any) => [`${w.product_id}-${w.variant_id || ''}`, true]))
        state.products = state.products.map((p: any) => ({
          ...p,
          in_wishlist: wishlistMap.has(`${p.id}-`)
        }))
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { productId, variantId, action: actionType } = action.payload
        if (actionType === 'added') {
          state.wishlist.push(action.payload.item)
          const product = state.products.find(p => p.id === productId)
          if (product) product.in_wishlist = true
        } else {
          state.wishlist = state.wishlist.filter(
            (w: any) => !(w.product_id === productId && w.variant_id === variantId)
          )
          const product = state.products.find(p => p.id === productId)
          if (product) product.in_wishlist = false
        }
      })

      // Flash Sales
      .addCase(fetchActiveFlashSales.fulfilled, (state, action) => {
        state.flashSales = action.payload || []
      })
  }
})

export const { setFilters, clearFilters, updateWishlistLocal, syncWishlist, updateCategoryImage } = productSlice.actions
export default productSlice.reducer