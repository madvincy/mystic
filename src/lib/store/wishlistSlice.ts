// src/lib/store/wishlistSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../supabase/client'

const uniqueByProduct = (items: any[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item?.product_id || seen.has(item.product_id)) return false
    seen.add(item.product_id)
    return true
  })
}

// ✅ Fetch wishlist - handles both authenticated and guest users
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (userId: string, { rejectWithValue }) => {
    try {
      // console.log('🔄 Fetching wishlist for user:', userId)
      
      // If no user ID, return empty array
      if (!userId) {
        // console.log('👤 Guest user - no wishlist to fetch')
        return []
      }
      
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', userId)

      if (error) {
        // console.error('❌ Fetch wishlist error:', error)
        // If it's a permission error, return empty array instead of failing
        if (error.code === '42501') {
          // console.log('⚠️ Permission denied, returning empty wishlist')
          return []
        }
        throw error
      }
      
      // Keep one saved entry per product even if older variant rows were duplicated.
      return uniqueByProduct(data || [])
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ✅ Toggle wishlist with proper error handling
export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async ({ userId, productId, variantId }: { userId: string; productId: string; variantId?: string | null }, { rejectWithValue }) => {
    try {
      // console.log('🔄 Toggling wishlist for user:', userId, 'product:', productId, 'variant:', variantId || 'none')
      
      // If no user ID, return error
      if (!userId) {
        return rejectWithValue('User not authenticated')
      }

      // A wishlist entry represents a product, not a product/variant pair.
      const { data: existing, error: checkError } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .limit(1)
        .maybeSingle()

      if (checkError) {
        // console.error('❌ Check wishlist error:', checkError)
        throw checkError
      }

      if (existing) {
        // Remove from wishlist
        // console.log('🗑️ Removing from wishlist:', existing.id)
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId)
        
        if (error) {
          // console.error('❌ Remove wishlist error:', error)
          throw error
        }
        
        // console.log('✅ Removed from wishlist')
        return { productId, variantId: variantId || null, action: 'removed' }
      } else {
        // Add to wishlist
        // console.log('➕ Adding to wishlist')
        const insertData: any = {
          user_id: userId,
          product_id: productId,
          created_at: new Date().toISOString(),
        }

        // ✅ Only add variant_id if it exists and is not empty
        if (variantId && variantId.trim() !== '') {
          insertData.variant_id = variantId
        } else {
          insertData.variant_id = null
        }

        const { data, error } = await supabase
          .from('wishlist')
          .insert(insertData)
          .select()
          .single()
        
        if (error) {
          // console.error('❌ Add wishlist error:', error)
          // If it's a permission error, show a user-friendly message
          if (error.code === '42501') {
            return rejectWithValue('Please login to add items to wishlist')
          }
          throw error
        }
        
        // console.log('✅ Added to wishlist:', data)
        return { item: data, action: 'added' }
      }
    } catch (error: any) {
      // console.error('❌ Toggle wishlist error:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const removeWishlistProducts = createAsyncThunk(
  'wishlist/removeProducts',
  async ({ userId, productIds }: { userId: string; productIds: string[] }, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('User not authenticated')
    if (productIds.length === 0) return []

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .in('product_id', productIds)

    if (error) return rejectWithValue(error.message)
    return productIds
  }
)

interface WishlistState {
  items: any[]
  loading: boolean
  error: string | null
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = []
      state.error = null
    },
    clearWishlistError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false
        state.items = uniqueByProduct(action.payload || [])
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        // console.error('❌ Wishlist fetch rejected:', action.payload)
      })
      .addCase(toggleWishlist.pending, (state) => {
        state.error = null
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { productId, variantId, action: actionType, item } = action.payload
        
        if (actionType === 'added' && item) {
          state.items = uniqueByProduct([...state.items, item])
        } else if (actionType === 'removed') {
          state.items = state.items.filter(w => w.product_id !== productId)
        }
      })
      .addCase(removeWishlistProducts.fulfilled, (state, action) => {
        const removedProductIds = new Set(action.payload)
        state.items = state.items.filter(item => !removedProductIds.has(item.product_id))
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.payload as string
        // console.error('❌ Toggle wishlist rejected:', action.payload)
      })
  },
})

export const { clearWishlist, clearWishlistError } = wishlistSlice.actions
export default wishlistSlice.reducer