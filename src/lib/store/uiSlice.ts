import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  isCartOpen: boolean
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  theme: 'light' | 'dark'
  isAdmin: boolean
  isLoading: boolean
  toast: {
    open: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }
}

const initialState: UIState = {
  isCartOpen: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  theme: 'light',
  isAdmin: false,
  isLoading: false,
  toast: {
    open: false,
    message: '',
    type: 'info',
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    setIsAdmin: (state, action: PayloadAction<boolean>) => {
      state.isAdmin = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    showToast: (state, action: PayloadAction<{ message: string; type?: 'success' | 'error' | 'info' | 'warning' }>) => {
      state.toast = {
        open: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
      }
    },
    hideToast: (state) => {
      state.toast.open = false
    },
  },
})

export const {
  toggleCart,
  setCartOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleSearch,
  setTheme,
  setIsAdmin,
  setLoading,
  showToast,
  hideToast,
} = uiSlice.actions

export default uiSlice.reducer