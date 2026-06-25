import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './cartSlice'
import productReducer from './productSlice'
import uiReducer from './uiSlice'
import userReducer from './userSlice'
import orderReducer from './orderSlice'
import wishlistReducer from './wishlistSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productReducer,
    ui: uiReducer,
    user: userReducer,
    orders: orderReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch