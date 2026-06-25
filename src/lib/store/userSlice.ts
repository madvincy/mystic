// src/lib/store/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabase/client'

// ============ FETCH USER PROFILE ============
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching user profile:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Fetch user error:', error)
        throw error
      }
      
      console.log('✅ User profile fetched:', data?.email)
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ UPDATE USER PROFILE ============
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async ({ userId, updates }: { userId: string; updates: any }, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating user profile:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Update user error:', error)
        throw error
      }
      
      console.log('✅ User profile updated:', data?.email)
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ FETCH USER ORDERS ============
export const fetchUserOrders = createAsyncThunk(
  'user/fetchUserOrders',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching user orders:', userId)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(name, images),
            variant:product_variants(variant_value)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Fetch orders error:', error)
        throw error
      }
      
      console.log('✅ User orders fetched:', data?.length || 0)
      return data || []
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ USER STATS ============
export const fetchUserStats = createAsyncThunk(
  'user/fetchUserStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching user stats:', userId)
      
      // Get total orders
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (ordersError) {
        console.error('❌ Orders count error:', ordersError)
        throw ordersError
      }

      // Get total spent
      const { data: ordersData, error: spentError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', userId)
        .eq('payment_status', 'paid')

      if (spentError) {
        console.error('❌ Total spent error:', spentError)
        throw spentError
      }

      const totalSpent = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      // Get wishlist count
      const { count: wishlistCount, error: wishlistError } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (wishlistError) {
        console.error('❌ Wishlist count error:', wishlistError)
        throw wishlistError
      }

      const stats = {
        totalOrders: totalOrders || 0,
        totalSpent,
        wishlistCount: wishlistCount || 0,
      }

      console.log('✅ User stats fetched:', stats)
      return stats
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ USER SLICE ============
interface UserState {
  profile: any | null
  orders: any[]
  stats: {
    totalOrders: number
    totalSpent: number
    wishlistCount: number
  }
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  profile: null,
  orders: [],
  stats: {
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
  },
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.profile = null
      state.orders = []
      state.stats = {
        totalOrders: 0,
        totalSpent: 0,
        wishlistCount: 0,
      }
      state.error = null
    },
    clearUserError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Fetch user profile rejected:', action.payload)
      })

      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Update user profile rejected:', action.payload)
      })

      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Fetch user orders rejected:', action.payload)
      })

      // Fetch User Stats
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Fetch user stats rejected:', action.payload)
      })
  },
})

export const { clearUser, clearUserError } = userSlice.actions
export default userSlice.reducer