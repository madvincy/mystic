// src/lib/store/wishlistSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../supabase/client'

// ✅ Fetch wishlist - handles both authenticated and guest users
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching wishlist for user:', userId)
      
      // If no user ID, return empty array
      if (!userId) {
        console.log('👤 Guest user - no wishlist to fetch')
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
        console.error('❌ Fetch wishlist error:', error)
        // If it's a permission error, return empty array instead of failing
        if (error.code === '42501') {
          console.log('⚠️ Permission denied, returning empty wishlist')
          return []
        }
        throw error
      }
      
      console.log('✅ Wishlist fetched:', data?.length || 0)
      return data || []
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ✅ Toggle wishlist with proper error handling
export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async ({ userId, productId, variantId }: { userId: string; productId: string; variantId?: string }, { rejectWithValue }) => {
    try {
      console.log('🔄 Toggling wishlist for user:', userId, 'product:', productId)
      
      // If no user ID, return error
      if (!userId) {
        return rejectWithValue('User not authenticated')
      }

      // Check if already exists
      const { data: existing, error: checkError } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('variant_id', variantId || '')
        .maybeSingle()

      if (checkError) {
        console.error('❌ Check wishlist error:', checkError)
        throw checkError
      }

      if (existing) {
        // Remove from wishlist
        console.log('🗑️ Removing from wishlist:', existing.id)
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', existing.id)
        
        if (error) {
          console.error('❌ Remove wishlist error:', error)
          throw error
        }
        
        console.log('✅ Removed from wishlist')
        return { productId, variantId, action: 'removed' }
      } else {
        // Add to wishlist
        console.log('➕ Adding to wishlist')
        const { data, error } = await supabase
          .from('wishlist')
          .insert({
            user_id: userId,
            product_id: productId,
            variant_id: variantId || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (error) {
          console.error('❌ Add wishlist error:', error)
          // If it's a permission error, show a user-friendly message
          if (error.code === '42501') {
            return rejectWithValue('Please login to add items to wishlist')
          }
          throw error
        }
        
        console.log('✅ Added to wishlist:', data)
        return { item: data, action: 'added' }
      }
    } catch (error: any) {
      console.error('❌ Toggle wishlist error:', error)
      return rejectWithValue(error.message)
    }
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
        state.items = action.payload || []
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Wishlist fetch rejected:', action.payload)
      })
      .addCase(toggleWishlist.pending, (state) => {
        state.error = null
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { productId, variantId, action: actionType, item } = action.payload
        
        if (actionType === 'added' && item) {
          state.items.push(item)
        } else if (actionType === 'removed') {
          state.items = state.items.filter(
            w => !(w.product_id === productId && w.variant_id === (variantId || ''))
          )
        }
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.payload as string
        console.error('❌ Toggle wishlist rejected:', action.payload)
      })
  },
})

export const { clearWishlist, clearWishlistError } = wishlistSlice.actions
export default wishlistSlice.reducer