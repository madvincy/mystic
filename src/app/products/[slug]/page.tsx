// src/app/products/[slug]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/lib/store'
import { fetchProducts } from '@/lib/store/productSlice'
import { supabase } from '@/lib/supabase/client'
import ProductGrid from '@/components/ui/ProductGrid'
import ProductDetail from '@/components/ui/ProductDetail'
import { motion } from 'framer-motion'
import { Button } from '@/components/shadCn/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function SlugPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { products, loading } = useSelector((state: RootState) => state.products)
  const [pageType, setPageType] = useState<'product' | 'category' | 'notfound'>('product')
  const [product, setProduct] = useState<any>(null)
  const [categoryProducts, setCategoryProducts] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const slug = params?.slug as string

  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts())
    }
  }, [dispatch, products.length])

  useEffect(() => {
    const checkSlug = async () => {
      if (!slug) {
        setIsLoading(false)
        setPageType('notfound')
        return
      }

      setIsLoading(true)
      console.log('🔍 Checking slug:', slug)

      try {
        // FIRST: Check if it's a product directly from Supabase
        console.log('🔍 Checking product in Supabase...')
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            variants:product_variants(*),
            category:categories(*),
            subcategory:subcategories(*)
          `)
          .eq('slug', slug)
          .maybeSingle()

        if (productData) {
          console.log('✅ Found product:', productData.name)
          setPageType('product')
          setProduct(productData)
          setIsLoading(false)
          return
        }

        if (productError) {
          console.log('❌ Product error:', productError)
        }

        // SECOND: Check if it's a category
        console.log('🔍 Checking category in Supabase...')
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('name, id')
          .eq('slug', slug)
          .maybeSingle()

        if (categoryData) {
          console.log('✅ Found category:', categoryData.name)
          setPageType('category')
          setCategoryName(categoryData.name)
          
          // Filter products from Redux by category
          const filtered = products.filter(p => 
            p.category?.slug === slug ||
            p.category?.name?.toLowerCase() === slug.toLowerCase()
          )
          setCategoryProducts(filtered)
          setIsLoading(false)
          return
        }

        if (categoryError) {
          console.log('❌ Category error:', categoryError)
        }

        // THIRD: Check if the slug matches any category from Redux
        const matchingCategory = products.find(p => 
          p.category?.slug === slug
        )?.category

        if (matchingCategory) {
          console.log('✅ Found category from Redux:', matchingCategory.name)
          setPageType('category')
          setCategoryName(matchingCategory.name)
          const filtered = products.filter(p => p.category_id === matchingCategory.id)
          setCategoryProducts(filtered)
          setIsLoading(false)
          return
        }

        // Not found
        console.log('❌ No product or category found for slug:', slug)
        setPageType('notfound')
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking slug:', error)
        setPageType('notfound')
        setIsLoading(false)
      }
    }

    checkSlug()
  }, [slug, products])

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
        </div>
      </div>
    )
  }

  // Product page
  if (pageType === 'product' && product) {
    return <ProductDetail product={product} />
  }

  // Category page
  if (pageType === 'category') {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/products')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Products
          </Button>

          <h1 className="text-3xl font-bold capitalize mb-2">{categoryName}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''} in this category
          </p>
          <ProductGrid products={categoryProducts} loading={false} showDiscountBadge />
        </motion.div>
      </div>
    )
  }

  // Not found
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
      <Button 
        className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
        onClick={() => router.push('/products')}
      >
        Browse Products
      </Button>
    </div>
  )
}