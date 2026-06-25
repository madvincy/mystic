// hooks/useProductFilters.ts

import { useSelector } from 'react-redux'
import { RootState } from '../lib/store'
import { useMemo } from 'react'

export function useProductFilters() {
  const { products, filters } = useSelector((state: RootState) => state.products)

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Category filter
    if (filters.category) {
      result = result.filter(p => 
        p.category?.slug === filters.category ||
        p.category?.name.toLowerCase() === filters.category?.toLowerCase()
      )
    }

    // Subcategory filter
    if (filters.subcategory) {
      result = result.filter(p => 
        p.subcategory?.slug === filters.subcategory ||
        p.subcategory?.name.toLowerCase() === filters.subcategory?.toLowerCase()
      )
    }

    // Price range
    if (filters.minPrice !== undefined) {
      result = result.filter(p => p.price >= filters.minPrice!)
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter(p => p.price <= filters.maxPrice!)
    }

    // In stock
    if (filters.inStock) {
      result = result.filter(p => p.stock_status === 'in_stock')
    }

    // On sale
    if (filters.onSale) {
      result = result.filter(p => p.discount || p.flash_sale || p.sale_price)
    }

    // Featured
    if (filters.featured) {
      result = result.filter(p => p.is_featured || p.featured)
    }

    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      )
    }

    return result
  }, [products, filters])

  return {
    products: filteredProducts,
    filters,
    totalCount: filteredProducts.length,
    categories: [...new Set(products.map(p => p.category?.name).filter(Boolean))],
    priceRange: {
      min: Math.min(...products.map(p => p.price)),
      max: Math.max(...products.map(p => p.price)),
    },
  }
}