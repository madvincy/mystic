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
  ChevronRight,
  Package,
  Award,
  Clock,
  Tag,
  Info,
  ThumbsUp,
  Wine
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { Badge } from '@/components/shadCn/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { addItem } from '@/lib/store/cartSlice'
import ProductGrid from '@/components/ui/ProductGrid'
import WishlistButton from '@/components/ui/WishlistButton'
import { cn } from '@/lib/utils'

interface RelatedProduct {
  id: string
  name: string
  price: number
  sale_price?: number
  images: string[]
  slug: string
  category_id: string
  is_featured?: boolean
  is_bestseller?: boolean
  is_new?: boolean
  stock_status: string
}

interface ProductDetailProps {
  product: any
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const dispatch = useDispatch()
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [isAdded, setIsAdded] = useState(false)
  const [loadingRelated, setLoadingRelated] = useState(true)

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    }
  }, [product])

  // ✅ Get ABV value from product or selected variant
  const getABV = () => {
    if (selectedVariant?.abv !== null && selectedVariant?.abv !== undefined) {
      return selectedVariant.abv
    }
    return product.abv
  }

  const abvValue = getABV()

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
      variantValue: selectedVariant?.variant_value || undefined,
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
    { icon: Truck, label: 'Free Delivery', description: 'On orders over KSh 5,000', color: 'text-blue-500' },
    { icon: Shield, label: 'Secure Payment', description: '100% secure transactions', color: 'text-green-500' },
    { icon: RefreshCw, label: 'Easy Returns', description: '7 days return policy', color: 'text-purple-500' },
    { icon: Gift, label: 'Gift Ready', description: 'Beautiful gift wrapping', color: 'text-pink-500' },
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: product.category?.name || 'Products', href: `/products/${product.category?.slug}` },
          { label: product.name, href: '#', current: true },
        ]}
      />

      {/* Main Product Card */}
      <Card className="mt-6 overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-inner">
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
                      className="object-contain p-4"
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110 backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110 backdrop-blur-sm"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {hasDiscount && (
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 text-sm font-medium shadow-lg animate-pulse border-0">
                        🔥 {discountPercent}% OFF
                      </Badge>
                    </motion.div>
                  )}
                  {product.is_new && (
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 text-sm font-medium shadow-lg border-0">
                        ✨ New Arrival
                      </Badge>
                    </motion.div>
                  )}
                  {product.is_bestseller && (
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 text-sm font-medium shadow-lg border-0">
                        ⭐ Best Seller
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {/* Wishlist Button */}
                <div className="absolute top-3 right-3">
                  <WishlistButton 
                    productId={product.id} 
                    variantId={selectedVariant?.id}
                    size="lg"
                    className="bg-white/90 dark:bg-gray-900/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm"
                  />
                </div>

                {/* Image Counter */}
                {product.images && product.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
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
              className="space-y-5"
            >
              {/* Title & Category */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                  {product.name}
                </h1>
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

              {/* ✅ ABV Display - Product Detail */}
              {product.product_type === 'alcoholic' && abvValue !== null && abvValue !== undefined && (
                <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/30 px-3 py-1.5 rounded-full w-fit">
                  <Wine className="h-4 w-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-600">
                    {abvValue}% Alcohol by Volume (ABV)
                  </span>
                </div>
              )}

              {/* Rating & Reviews */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
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

              {/* Price Card */}
              <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <span className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">
                    KSh {currentPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        KSh {originalPrice.toLocaleString()}
                      </span>
                      <Badge className="bg-red-500 text-white border-0">
                        {discountPercent}% OFF
                      </Badge>
                    </>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Free Shipping</span>
                  </div>
                </CardContent>
              </Card>

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
                  <h4 className="font-medium text-sm">Select variant:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant: any) => (
                      <motion.button
                        key={variant.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedVariant(variant)}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm",
                          selectedVariant?.id === variant.id
                            ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-600 ring-2 ring-pink-600/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                          variant.stock === 0 && 'opacity-50 cursor-not-allowed'
                        )}
                        disabled={variant.stock === 0}
                      >
                        <div className="flex items-center gap-2">
                          <span>{variant.variant_value}</span>
                          {variant.abv && (
                            <span className="text-xs text-pink-600 bg-pink-100 dark:bg-pink-900/30 px-1.5 py-0.5 rounded-full">
                              {variant.abv}% ABV
                            </span>
                          )}
                        </div>
                        {variant.stock === 0 && ' (Out of stock)'}
                        {variant.stock > 0 && variant.stock < 10 && (
                          <span className="text-xs text-red-500 ml-1">({variant.stock} left)</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h4 className="font-medium text-sm">Quantity:</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(selectedVariant?.stock || 10, quantity + 1))}
                      className="p-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                      disabled={selectedVariant?.stock === 0}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex-1 min-w-[180px] h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
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
                    className="h-12 w-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-pink-400"
                  />
                  <Button size="lg" variant="outline" className="h-12 w-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-pink-400">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
                    >
                      <div className={cn("p-1.5 rounded-lg bg-opacity-20", benefit.color)}>
                        <Icon className={cn("h-4 w-4", benefit.color)} />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{benefit.label}</p>
                        <p className="text-xs text-gray-500">{benefit.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Description & Details Card */}
      <Card className="mt-6 border-0 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Description */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-pink-600" />
                <h3 className="text-lg font-semibold">Product Description</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description || 'No description available'}
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-pink-600" />
                <h3 className="text-lg font-semibold">Product Details</h3>
              </div>
              <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                {product.sku && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">SKU:</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <Link href={`/products/${product.category.slug}`} className="text-pink-600 hover:underline font-medium">
                      {product.category.name}
                    </Link>
                  </div>
                )}
                {product.subcategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subcategory:</span>
                    <span className="font-medium">{product.subcategory.name}</span>
                  </div>
                )}
                {/* ✅ Display ABV in Product Details */}
                {product.product_type === 'alcoholic' && abvValue !== null && abvValue !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Alcohol by Volume:</span>
                    <span className="font-medium text-pink-600">{abvValue}%</span>
                  </div>
                )}
                {product.product_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Product Type:</span>
                    <span className="font-medium capitalize">{product.product_type?.replace('_', ' ')}</span>
                  </div>
                )}
                {product.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Added:</span>
                    <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-6 w-6 text-pink-600" />
              <h2 className="text-2xl font-bold">You might also like</h2>
            </div>
            <Link href={`/products/${product.category?.slug}`} className="text-pink-600 hover:underline text-sm font-medium">
              View all →
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