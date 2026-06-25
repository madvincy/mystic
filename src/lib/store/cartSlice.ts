// lib/store/cartSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { clearCache, deleteFromCache, getDB, saveToCache } from '../db/indexedDB'

// Load cart from IndexedDB on app start
export const loadCartFromCache = createAsyncThunk(
  'cart/loadFromCache',
  async () => {
    const db = await getDB()
    const items = await db.getAll('cart')
    return items
  }
)

interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  variantValue?: string
  price: number
  quantity: number
  image: string
  stock: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  loaded: boolean
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  loaded: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(item => item.id === action.payload.id)
      if (existing) {
        existing.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
      
      // Persist to IndexedDB
      saveToCache('cart', action.payload)
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
      
      // Remove from IndexedDB
      deleteFromCache('cart', action.payload)
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id)
      if (item) {
        item.quantity = Math.max(0, action.payload.quantity)
        if (item.quantity === 0) {
          state.items = state.items.filter(i => i.id !== action.payload.id)
          deleteFromCache('cart', action.payload.id)
        } else {
          saveToCache('cart', item)
        }
      }
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    clearCart: (state) => {
      state.items = []
      state.total = 0
      state.itemCount = 0
      clearCache('cart')
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadCartFromCache.fulfilled, (state, action) => {
      state.items = action.payload
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
      state.loaded = true
    })
  },
})

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions
export default cartSlice.reducer