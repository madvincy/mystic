// src/lib/store/orderSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabase/client'

// ============ FETCH ORDERS ============
export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching orders for user:', userId)
      
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
      
      console.log('✅ Orders fetched:', data?.length || 0)
      return data || []
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ FETCH ORDER BY ID ============
export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async ({ orderId, userId }: { orderId: string; userId: string }, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching order by ID:', orderId)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(name, email, phone),
          items:order_items(
            *,
            product:products(name, images, price),
            variant:product_variants(variant_value)
          )
        `)
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('❌ Fetch order by ID error:', error)
        throw error
      }
      
      console.log('✅ Order fetched by ID:', data?.order_number)
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ CREATE ORDER ============
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async ({ orderData, items }: { orderData: any; items: any[] }, { rejectWithValue }) => {
    try {
      console.log('🔄 Creating order...')
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      
      const orderPayload = {
        ...orderData,
        order_number: orderNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single()

      if (orderError) {
        console.error('❌ Create order error:', orderError)
        throw orderError
      }

      // Create order items
      if (order && items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          variant_id: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('❌ Create order items error:', itemsError)
          throw itemsError
        }
      }

      // Fetch the complete order with items
      const { data: completeOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(name, images),
            variant:product_variants(variant_value)
          )
        `)
        .eq('id', order.id)
        .single()

      if (fetchError) {
        console.error('❌ Fetch complete order error:', fetchError)
        throw fetchError
      }

      console.log('✅ Order created:', completeOrder?.order_number)
      return completeOrder
    } catch (error: any) {
      console.error('❌ Create order error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// ============ UPDATE ORDER STATUS ============
export const updateOrderStatus = createAsyncThunk(
  'order/updateOrderStatus',
  async ({ orderId, status }: { orderId: string; status: string }, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating order status:', orderId, 'to', status)
      
      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('❌ Update order status error:', error)
        throw error
      }
      
      console.log('✅ Order status updated:', data?.status)
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ UPDATE PAYMENT STATUS ============
export const updatePaymentStatus = createAsyncThunk(
  'order/updatePaymentStatus',
  async ({ orderId, paymentStatus, receipt }: { orderId: string; paymentStatus: string; receipt?: string }, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating payment status:', orderId, 'to', paymentStatus)
      
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_receipt: receipt || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('❌ Update payment status error:', error)
        throw error
      }
      
      console.log('✅ Payment status updated:', data?.payment_status)
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ CANCEL ORDER ============
export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Cancelling order:', orderId)
      
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('❌ Cancel order error:', error)
        throw error
      }
      
      console.log('✅ Order cancelled:', data?.order_number)
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// ============ ORDER SLICE ============
interface OrderState {
  orders: any[]
  currentOrder: any | null
  loading: boolean
  error: string | null
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
}

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrders: (state) => {
      state.orders = []
      state.currentOrder = null
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearOrderError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Fetch orders rejected:', action.payload)
      })

      // Fetch Order By ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Fetch order by ID rejected:', action.payload)
      })

      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        state.orders = [action.payload, ...state.orders]
        state.currentOrder = action.payload
        console.log('✅ Order created in store:', action.payload?.order_number)
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Create order rejected:', action.payload)
      })

      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false
        // Update in orders list
        const index = state.orders.findIndex(o => o.id === action.payload.id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        // Update current order if it matches
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        console.error('❌ Update order status rejected:', action.payload)
      })

      // Update Payment Status
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        // Update in orders list
        const index = state.orders.findIndex(o => o.id === action.payload.id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        // Update current order if it matches
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload
        }
      })

      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload
        }
      })
  },
})

export const { clearOrders, clearCurrentOrder, clearOrderError } = orderSlice.actions
export default orderSlice.reducer