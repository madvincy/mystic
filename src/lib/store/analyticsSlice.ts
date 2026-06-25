// src/lib/store/analyticsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabase/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ============ FETCH DASHBOARD ANALYTICS ============
export const fetchDashboardAnalytics = createAsyncThunk(
  'analytics/fetchDashboardAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching dashboard analytics...')
      
      // Get current date range (last 30 days)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const startDate = thirtyDaysAgo.toISOString()
      const endDate = now.toISOString()

      // 1. Get total orders
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      if (ordersError) throw ordersError

      // 2. Get total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'paid')

      if (revenueError) throw revenueError

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      // 3. Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      // 4. Get total products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (productsError) throw productsError

      // 5. Get recent orders (last 10)
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentError) throw recentError

      // 6. Get daily sales for chart
      const { data: dailySales, error: dailyError } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true })

      if (dailyError) throw dailyError

      // Process daily sales data
      const dailyData = processDailySales(dailySales || [])

      // 7. Get top products
      const { data: topProducts, error: topError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          products(name, price, images)
        `)
        .order('quantity', { ascending: false })
        .limit(10)

      if (topError) throw topError

      // Group top products by product_id
      const topProductsMap = new Map()
      topProducts?.forEach((item: any) => {
        if (topProductsMap.has(item.product_id)) {
          const existing = topProductsMap.get(item.product_id)
          topProductsMap.set(item.product_id, {
            ...existing,
            quantity: existing.quantity + item.quantity,
          })
        } else {
          topProductsMap.set(item.product_id, item)
        }
      })
      const topProductsList = Array.from(topProductsMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      // 8. Get category breakdown
      const { data: categoryData, error: categoryError } = await supabase
        .from('products')
        .select('category_id, categories(name)')
        .not('category_id', 'is', null)

      if (categoryError) throw categoryError

      const categoryCount: Record<string, number> = {}
      categoryData?.forEach((product: any) => {
        const name = product.categories?.name || 'Uncategorized'
        categoryCount[name] = (categoryCount[name] || 0) + 1
      })

      // 9. Get order status breakdown
      const { data: statusData, error: statusError } = await supabase
        .from('orders')
        .select('status')

      if (statusError) throw statusError

      const statusCount: Record<string, number> = {}
      statusData?.forEach((order: any) => {
        statusCount[order.status] = (statusCount[order.status] || 0) + 1
      })

      return {
        summary: {
          totalOrders: totalOrders || 0,
          totalRevenue,
          totalUsers: totalUsers || 0,
          totalProducts: totalProducts || 0,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
        recentOrders: recentOrders || [],
        dailySales: dailyData,
        topProducts: topProductsList,
        categoryBreakdown: categoryCount,
        statusBreakdown: statusCount,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      }
    } catch (error: any) {
      console.error('❌ Fetch dashboard analytics error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// ============ FETCH SALES ANALYTICS ============
export const fetchSalesAnalytics = createAsyncThunk(
  'analytics/fetchSalesAnalytics',
  async ({ period = '30d' }: { period?: string }, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching sales analytics for period:', period)
      
      const now = new Date()
      let startDate = new Date()
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case '12m':
          startDate.setMonth(now.getMonth() - 12)
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }

      const startStr = startDate.toISOString()
      const endStr = now.toISOString()

      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('created_at, total_amount, status, payment_status')
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .order('created_at', { ascending: true })

      if (salesError) throw salesError

      // Get daily breakdown
      const dailyData = processDailySales(salesData || [])

      // Calculate totals
      const paidOrders = salesData?.filter(o => o.payment_status === 'paid') || []
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0)
      const totalOrders = salesData?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate growth (compare to previous period)
      const previousStart = new Date(startDate)
      previousStart.setDate(previousStart.getDate() - 30)
      const prevStartStr = previousStart.toISOString()
      const prevEndStr = startDate.toISOString()

      const { data: prevData, error: prevError } = await supabase
        .from('orders')
        .select('total_amount, payment_status')
        .gte('created_at', prevStartStr)
        .lte('created_at', prevEndStr)

      if (prevError) throw prevError

      const prevRevenue = prevData?.filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0) || 0

      const revenueGrowth = prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
        : 0

      return {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          revenueGrowth,
          period,
        },
        dailyData,
        dateRange: {
          start: startStr,
          end: endStr,
        },
      }
    } catch (error: any) {
      console.error('❌ Fetch sales analytics error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// ============ FETCH PRODUCT ANALYTICS ============
export const fetchProductAnalytics = createAsyncThunk(
  'analytics/fetchProductAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching product analytics...')
      
      // Get top selling products
      const { data: topSelling, error: topError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products(name, price, images, category_id, categories(name))
        `)
        .order('quantity', { ascending: false })
        .limit(20)

      if (topError) throw topError

      // Group by product
      const productMap = new Map()
      topSelling?.forEach((item: any) => {
        if (productMap.has(item.product_id)) {
          const existing = productMap.get(item.product_id)
          productMap.set(item.product_id, {
            ...existing,
            total_quantity: existing.total_quantity + item.quantity,
            total_revenue: existing.total_revenue + (item.price * item.quantity),
          })
        } else {
          productMap.set(item.product_id, {
            product: item.products,
            total_quantity: item.quantity,
            total_revenue: item.price * item.quantity,
          })
        }
      })

      const products = Array.from(productMap.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)

      // Get product with most revenue
      const topRevenue = [...products].sort((a, b) => b.total_revenue - a.total_revenue)

      return {
        topSelling: products.slice(0, 10),
        topRevenue: topRevenue.slice(0, 10),
        totalProducts: products.length,
      }
    } catch (error: any) {
      console.error('❌ Fetch product analytics error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// ============ FETCH CUSTOMER ANALYTICS ============
export const fetchCustomerAnalytics = createAsyncThunk(
  'analytics/fetchCustomerAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching customer analytics...')
      
      // Get total customers
      const { count: totalCustomers, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError

      // Get new customers (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: newCustomers, error: newError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (newError) throw newError

      // Get customer orders
      const { data: customerOrders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total_amount')
        .eq('payment_status', 'paid')

      if (ordersError) throw ordersError

      // Calculate customer metrics
      const customerMap = new Map()
      customerOrders?.forEach((order: any) => {
        if (customerMap.has(order.user_id)) {
          const existing = customerMap.get(order.user_id)
          customerMap.set(order.user_id, {
            ...existing,
            total_spent: existing.total_spent + order.total_amount,
            order_count: existing.order_count + 1,
          })
        } else {
          customerMap.set(order.user_id, {
            total_spent: order.total_amount,
            order_count: 1,
          })
        }
      })

      const customers = Array.from(customerMap.values())
      const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0)
      const avgSpentPerCustomer = customers.length > 0 ? totalSpent / customers.length : 0

      return {
        summary: {
          totalCustomers: totalCustomers || 0,
          newCustomers: newCustomers || 0,
          avgSpentPerCustomer,
          totalSpent,
          customerCount: customers.length,
        },
        customerData: customers,
      }
    } catch (error: any) {
      console.error('❌ Fetch customer analytics error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// ============ HELPER FUNCTIONS ============

function processDailySales(salesData: any[]): any[] {
  const dailyMap = new Map()
  
  salesData.forEach((sale) => {
    const date = new Date(sale.created_at).toISOString().split('T')[0]
    if (dailyMap.has(date)) {
      const existing = dailyMap.get(date)
      dailyMap.set(date, {
        date,
        revenue: existing.revenue + sale.total_amount,
        orders: existing.orders + 1,
      })
    } else {
      dailyMap.set(date, {
        date,
        revenue: sale.total_amount,
        orders: 1,
      })
    }
  })

  return Array.from(dailyMap.values())
}

// ============ ANALYTICS SLICE ============

interface AnalyticsState {
  dashboard: {
    summary: {
      totalOrders: number
      totalRevenue: number
      totalUsers: number
      totalProducts: number
      averageOrderValue: number
    }
    recentOrders: any[]
    dailySales: any[]
    topProducts: any[]
    categoryBreakdown: Record<string, number>
    statusBreakdown: Record<string, number>
    dateRange: {
      start: string
      end: string
    }
  } | null
  sales: {
    summary: {
      totalRevenue: number
      totalOrders: number
      averageOrderValue: number
      revenueGrowth: number
      period: string
    }
    dailyData: any[]
    dateRange: {
      start: string
      end: string
    }
  } | null
  products: {
    topSelling: any[]
    topRevenue: any[]
    totalProducts: number
  } | null
  customers: {
    summary: {
      totalCustomers: number
      newCustomers: number
      avgSpentPerCustomer: number
      totalSpent: number
      customerCount: number
    }
    customerData: any[]
  } | null
  loading: {
    dashboard: boolean
    sales: boolean
    products: boolean
    customers: boolean
  }
  error: {
    dashboard: string | null
    sales: string | null
    products: string | null
    customers: string | null
  }
}

const initialState: AnalyticsState = {
  dashboard: null,
  sales: null,
  products: null,
  customers: null,
  loading: {
    dashboard: false,
    sales: false,
    products: false,
    customers: false,
  },
  error: {
    dashboard: null,
    sales: null,
    products: null,
    customers: null,
  },
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.dashboard = null
      state.sales = null
      state.products = null
      state.customers = null
      state.loading = {
        dashboard: false,
        sales: false,
        products: false,
        customers: false,
      }
      state.error = {
        dashboard: null,
        sales: null,
        products: null,
        customers: null,
      }
    },
    clearAnalyticsError: (state) => {
      state.error = {
        dashboard: null,
        sales: null,
        products: null,
        customers: null,
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Analytics
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.loading.dashboard = true
        state.error.dashboard = null
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.loading.dashboard = false
        state.dashboard = action.payload
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.loading.dashboard = false
        state.error.dashboard = action.payload as string
        console.error('❌ Dashboard analytics rejected:', action.payload)
      })

      // Sales Analytics
      .addCase(fetchSalesAnalytics.pending, (state) => {
        state.loading.sales = true
        state.error.sales = null
      })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        state.loading.sales = false
        state.sales = action.payload
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.loading.sales = false
        state.error.sales = action.payload as string
        console.error('❌ Sales analytics rejected:', action.payload)
      })

      // Product Analytics
      .addCase(fetchProductAnalytics.pending, (state) => {
        state.loading.products = true
        state.error.products = null
      })
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.loading.products = false
        state.products = action.payload
      })
      .addCase(fetchProductAnalytics.rejected, (state, action) => {
        state.loading.products = false
        state.error.products = action.payload as string
        console.error('❌ Product analytics rejected:', action.payload)
      })

      // Customer Analytics
      .addCase(fetchCustomerAnalytics.pending, (state) => {
        state.loading.customers = true
        state.error.customers = null
      })
      .addCase(fetchCustomerAnalytics.fulfilled, (state, action) => {
        state.loading.customers = false
        state.customers = action.payload
      })
      .addCase(fetchCustomerAnalytics.rejected, (state, action) => {
        state.loading.customers = false
        state.error.customers = action.payload as string
        console.error('❌ Customer analytics rejected:', action.payload)
      })
  },
})

export const { clearAnalytics, clearAnalyticsError } = analyticsSlice.actions
export default analyticsSlice.reducer