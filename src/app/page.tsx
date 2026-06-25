// src/app/page.tsx
'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { fetchProducts, fetchCategories } from '@/lib/store/productSlice'
import { AppDispatch, RootState } from '@/lib/store'
import AdSlider from '@/components/ui/AdSlider'
import ProductGrid from '@/components/ui/ProductGrid'
import { Button } from '@/components/shadCn/ui/button'
import { 
  ArrowRight, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Clock
} from 'lucide-react'
import Link from 'next/link'
import FlashSaleBanner from '@/components/ui/FlashSaleBanner'

// ✅ Fallback image if category has no image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1800&auto=format&fit=crop'

export default function Home() {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    products, 
    loading, 
    featuredProducts, 
    discountedProducts,
    categories,
    flashSales 
  } = useSelector((state: RootState) => state.products)

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchCategories())
  }, [dispatch])

  // Get products with flash sales for timer display
  const flashSaleProducts = products.filter(p => p.flash_sale).slice(0, 4)
  const bestSellers = products.filter(p => p.is_bestseller).slice(0, 4)
  const newArrivals = products.filter(p => p.is_new).slice(0, 4)
  const featured = featuredProducts.slice(0, 4)
  console.log(categories, 'categories')

  // ✅ Prepare category data using database image_url
  const categoryData = categories.slice(0, 6).map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image_url || FALLBACK_IMAGE, // ✅ Use database image_url
    count: products.filter(p => p.category_id === cat.id).length
  }))

  return (
    <div className="min-h-screen">
      {/* Ad Slider */}
      <section className="container mx-auto mt-8">
        <AdSlider />
      </section> 

      {/* Flash Sale Banner */}
      {flashSales.length > 0 && (
        <section className="container mx-auto px-4 mt-8">
          <FlashSaleBanner />
        </section>
      )}

      {/* Categories - Beautiful Card Grid */}
      <section className="container mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Browse our curated collection of premium wines & spirits
            </p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="text-pink-600 hover:text-pink-700 group">
              View All Categories
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {categoryData.map((category, index) => (
            <motion.div
              key={category.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-xl cursor-pointer h-56 flex flex-col justify-end"
            >
              <Link href={`/products/${category.slug}`}>
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // ✅ Fallback if image fails to load
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE
                    }}
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Content */}
                <div className="relative p-6 w-full flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-white text-2xl font-semibold">
                      {category.name}
                    </h3>
                    <p className="text-white/90 font-medium text-sm">
                      {category.count || 0} products
                    </p>
                  </div>

                  {/* Arrow Icon - Appears on Hover */}
                  <motion.div
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out"
                  >
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-600" />
              <h2 className="text-xl md:text-2xl font-bold">Featured Products</h2>
            </div>
            <Link href="/products?featured=true">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={featured} loading={loading} showDiscountBadge />
        </section>
      )}

      {/* Flash Sale Products */}
      {flashSaleProducts.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              <h2 className="text-xl md:text-2xl font-bold">Flash Sale</h2>
              <Clock className="h-4 w-4 text-red-500 ml-2" />
            </div>
            <Link href="/products?flash-sale=true">
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid 
            products={flashSaleProducts} 
            loading={loading}
            showDiscountBadge
            showTimer
          />
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-xl md:text-2xl font-bold">Best Sellers</h2>
            </div>
            <Link href="/products?bestseller=true">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={bestSellers} loading={loading} showDiscountBadge />
        </section>
      )}

      {/* Discounted Products */}
      {discountedProducts.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <h2 className="text-xl md:text-2xl font-bold">Special Offers</h2>
            </div>
            <Link href="/products?on-sale=true">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid 
            products={discountedProducts.slice(0, 4)} 
            loading={loading}
            showDiscountBadge
          />
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl md:text-2xl font-bold">New Arrivals</h2>
            </div>
            <Link href="/products?new=true">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={newArrivals} loading={loading} showDiscountBadge />
        </section>
      )}

      {/* Newsletter Section */}
      <section className="container mx-auto px-4 mt-16 mb-8">
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Join Our Newsletter</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-6">
            Get the latest updates on new arrivals, exclusive offers, and special events.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
            <Button type="submit" className="bg-white text-pink-600 hover:bg-white/90 font-semibold px-6 py-3 rounded-xl">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-white/60 mt-4">
            By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  )
}