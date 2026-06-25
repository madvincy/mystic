export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  sale_price?: number
  category_id: string
  subcategory_id?: string
  images: string[]
  is_featured: boolean
  is_bestseller: boolean
  is_new: boolean
  rating: number
  review_count: number
  stock_status: 'in_stock' | 'out_of_stock' | 'pre_order'
  variants?: ProductVariant[]
  category?: Category
  subcategory?: Subcategory
  discount?: Discount
  flash_sale?: FlashSaleProduct
  featured?: FeaturedProduct
  in_wishlist?: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_type: string
  variant_value: string
  price: number
  stock: number
  sku: string
  discount?: Discount
  flash_sale?: FlashSaleProduct
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  children?: Category[]
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  category_id: string
  description?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Discount {
  id: string
  name: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  code?: string
  min_order_amount?: number
  max_discount_amount?: number
  start_date: string
  end_date: string
  is_active: boolean
  usage_limit?: number
  used_count?: number
  applicable_products?: string[]
  applicable_categories?: string[]
  created_at: string
  updated_at: string
}

export interface FlashSale {
  id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  is_active: boolean
  products?: FlashSaleProduct[]
  created_at: string
  updated_at: string
}

export interface FlashSaleProduct {
  id: string
  flash_sale_id: string
  product_id: string
  variant_id?: string
  discount_percentage: number
  sale_price: number
  quantity_limit?: number
  sold_count: number
  product?: Product
  variant?: ProductVariant
  created_at: string
}

export interface FeaturedProduct {
  id: string
  product_id: string
  variant_id?: string
  display_order: number
  start_date?: string
  end_date?: string
  is_active: boolean
  product?: Product
  variant?: ProductVariant
  created_at: string
  updated_at: string
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  variant_id?: string
  product?: Product
  variant?: ProductVariant
  created_at: string
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  city?: string
  country?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  order_number: string
  total_amount: number
  shipping_cost: number
  tax: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_method: 'mpesa' | 'cash' | 'card'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_address: {
    name: string
    phone: string
    address: string
    city: string
    country: string
  }
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  product?: Product
  variant?: ProductVariant
  created_at: string
}

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  description?: string
  
  variantValue?: string
  price: number
  quantity: number
  image: string
  stock: number
}

export interface Ad {
  id: string
  title: string
  image_url: string
  link_url?: string
  product_id?: string
  order_position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}