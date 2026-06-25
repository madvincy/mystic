// src/components/ui/ProductDetail.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Minus, 
  Plus, 
  Share2, 
  Check,
  Truck,
  Shield,
  RefreshCw,
  Gift,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { addItem } from '@/lib/store/cartSlice'
import ProductGrid from '@/components/ui/ProductGrid'
import WishlistButton from '@/components/ui/WishlistButton'
import DiscountBadge from '@/components/ui/DiscountBadge'
import { cn } from '@/lib/utils'

interface ProductDetailProps {
  product: any
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const dispatch = useDispatch()
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isAdded, setIsAdded] = useState(false)
  const [loadingRelated, setLoadingRelated] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Set default variant
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    }
  }, [product])

  // Fetch related products
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.category_id) {
        setLoadingRelated(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', product.category_id)
          .neq('id', product.id)
          .limit(4)

        if (error) throw error
        setRelatedProducts(data || [])
      } catch (error) {
        console.error('Error fetching related products:', error)
      } finally {
        setLoadingRelated(false)
      }
    }

    fetchRelated()
  }, [product])

  const handleAddToCart = () => {
    if (!product) return
    
    if (selectedVariant && selectedVariant.stock < quantity) {
      toast.error('Not enough stock available')
      return
    }

    const price = selectedVariant?.price || product.sale_price || product.price
    
    dispatch(addItem({
      id: selectedVariant?.id || product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantValue: selectedVariant?.variant_value,
      price: price,
      quantity: quantity,
      image: product.images?.[0] || '/images/placeholder.jpg',
      stock: selectedVariant?.stock || 0,
    }))
    
    setIsAdded(true)
    toast.success('Added to cart! 🛒')
    setTimeout(() => setIsAdded(false), 2000)
  }

  const currentPrice = selectedVariant?.price || product.sale_price || product.price
  const originalPrice = product.price
  const hasDiscount = currentPrice < originalPrice
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

  const benefits = [
    { icon: Truck, label: 'Free Delivery', description: 'On orders over KSh 5,000' },
    { icon: Shield, label: 'Secure Payment', description: '100% secure transactions' },
    { icon: RefreshCw, label: 'Easy Returns', description: '7 days return policy' },
    { icon: Gift, label: 'Gift Ready', description: 'Beautiful gift wrapping' },
  ]

  const nextImage = () => {
    if (product?.images) {
      setSelectedImage((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product?.images) {
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  if (!product) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: product.category?.name || 'Products', href: `/products/${product.category?.slug}` },
          { label: product.name, href: '#', current: true },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Product Images */}
        <div className="relative">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
              >
                <Image
                  src={imageError ? '/images/placeholder.jpg' : (product.images?.[selectedImage] || '/images/placeholder.jpg')}
                  alt={product.name}
                  fill
                  className="object-contain"
                  priority
                  onError={() => setImageError(true)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {hasDiscount && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-4 py-1.5 rounded-full shadow-lg font-medium animate-pulse">
                    🔥 {discountPercent}% OFF
                  </span>
                </motion.div>
              )}
              {product.is_new && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-4 py-1.5 rounded-full shadow-lg font-medium">
                    ✨ New Arrival
                  </span>
                </motion.div>
              )}
              {product.is_bestseller && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm px-4 py-1.5 rounded-full shadow-lg font-medium">
                    ⭐ Best Seller
                  </span>
                </motion.div>
              )}
            </div>

            {/* Wishlist Button */}
            <div className="absolute top-4 right-4">
              <WishlistButton 
                productId={product.id} 
                variantId={selectedVariant?.id}
                size="lg"
                className="bg-white/90 dark:bg-gray-900/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm"
              />
            </div>

            {/* Image Counter */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                {selectedImage + 1} / {product.images.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
              {product.images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                    selectedImage === index 
                      ? 'border-pink-600 ring-2 ring-pink-600/20 scale-105' 
                      : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
            {product.category && (
              <Link 
                href={`/products/${product.category.slug}`}
                className="text-sm text-pink-600 hover:underline inline-flex items-center gap-1 mt-1"
              >
                {product.category.name}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < Math.floor(product.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating || 0}</span>
            </div>
            <span className="text-sm text-gray-500">
              ({product.review_count || 0} reviews)
            </span>
            {product.review_count > 0 && (
              <button className="text-sm text-pink-600 hover:underline">
                Read reviews
              </button>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
            <span className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">
              KSh {currentPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  KSh {originalPrice.toLocaleString()}
                </span>
                <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-1 rounded-full font-medium">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              product.stock_status === 'in_stock' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : product.stock_status === 'pre_order'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            )}>
              {product.stock_status === 'in_stock' && '✓ In Stock'}
              {product.stock_status === 'pre_order' && '📦 Pre-Order Available'}
              {product.stock_status === 'out_of_stock' && '✗ Out of Stock'}
            </span>
            {product.flash_sale && (
              <span className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full animate-pulse font-medium">
                🔥 Flash Sale
              </span>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Select variant:</h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant: any) => (
                  <motion.button
                    key={variant.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border-2 transition-all font-medium",
                      selectedVariant?.id === variant.id
                        ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-600 ring-2 ring-pink-600/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                      variant.stock === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={variant.stock === 0}
                  >
                    {variant.variant_value}
                    {variant.stock === 0 && ' (Out of stock)'}
                    {variant.stock > 0 && variant.stock < 10 && (
                      <span className="text-xs text-red-500 ml-1">({variant.stock} left)</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <h4 className="font-medium">Quantity:</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedVariant?.stock || 10, quantity + 1))}
                className="p-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                disabled={selectedVariant?.stock === 0}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex-1 min-w-[150px] h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={handleAddToCart}
              disabled={product.stock_status === 'out_of_stock' || selectedVariant?.stock === 0}
            >
              {isAdded ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.stock_status === 'out_of_stock' || selectedVariant?.stock === 0 
                    ? 'Out of Stock' 
                    : 'Add to Cart'}
                </>
              )}
            </Button>
            <WishlistButton 
              productId={product.id} 
              variantId={selectedVariant?.id}
              size="lg"
              className="h-14 w-14 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-pink-400"
            />
            <Button size="lg" variant="outline" className="h-14 w-14 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-pink-400">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Icon className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{benefit.label}</p>
                    <p className="text-xs text-gray-500">{benefit.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Description */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="font-medium mb-3">Description</h4>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {product.description || 'No description available'}
            </p>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
            {product.sku && (
              <div>
                <span className="font-medium text-gray-500">SKU:</span>
                <span className="ml-1">{product.sku}</span>
              </div>
            )}
            {product.category && (
              <div>
                <span className="font-medium text-gray-500">Category:</span>{' '}
                <Link href={`/products/${product.category.slug}`} className="text-pink-600 hover:underline">
                  {product.category.name}
                </Link>
              </div>
            )}
            {product.subcategory && (
              <div>
                <span className="font-medium text-gray-500">Subcategory:</span>{' '}
                <span className="ml-1">{product.subcategory.name}</span>
              </div>
            )}
            {product.created_at && (
              <div>
                <span className="font-medium text-gray-500">Added:</span>
                <span className="ml-1">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">You might also like</h2>
            <Link href={`/products/${product.category?.slug}`} className="text-pink-600 hover:underline text-sm">
              View all
            </Link>
          </div>
          <ProductGrid 
            products={relatedProducts} 
            loading={loadingRelated} 
            showDiscountBadge
          />
        </div>
      )}
    </div>
  )
}
