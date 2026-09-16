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
  Wine,
  Link2
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
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    }
  }, [product])

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

  // ✅ Share = copy current product link to clipboard
  const handleShare = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : ''
      if (navigator.share) {
        // Native share sheet on supported devices (mobile)
        await navigator.share({ title: product.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      // AbortError fires if user cancels native share sheet — not a real failure
      if ((error as any)?.name !== 'AbortError') {
        toast.error('Could not copy link')
      }
    }
  }

  const currentPrice = selectedVariant?.price || product.sale_price || product.price
  const originalPrice = product.price
  const hasDiscount = currentPrice < originalPrice
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

  const benefits = [
    { icon: Truck, label: 'Free Delivery', description: 'Orders over KSh 5,000', color: 'text-blue-500' },
    { icon: Shield, label: 'Secure Payment', description: '100% secure', color: 'text-green-500' },
    { icon: RefreshCw, label: 'Easy Returns', description: '7 day policy', color: 'text-purple-500' },
    { icon: Gift, label: 'Gift Ready', description: 'Gift wrapping', color: 'text-pink-500' },
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
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: product.category?.name || 'Products', href: `/products/${product.category?.slug}` },
          { label: product.name, href: '#', current: true },
        ]}
      />

      {/* Main Product Card */}
      <Card className="mt-4 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Images */}
            <div className="relative">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-inner max-w-md mx-auto lg:max-w-none">
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
                      className="object-contain p-3"
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110 backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110 backdrop-blur-sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  {hasDiscount && (
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1 text-xs font-medium shadow-md animate-pulse border-0">
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
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2.5 py-1 text-xs font-medium shadow-md border-0">
                        ✨ New
                      </Badge>
                    </motion.div>
                  )}
                  {product.is_bestseller && (
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2.5 py-1 text-xs font-medium shadow-md border-0">
                        ⭐ Best Seller
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {/* Wishlist Button */}
                <div className="absolute top-2 right-2">
                  <WishlistButton 
                    productId={product.id} 
                    variantId={selectedVariant?.id}
                    className="bg-white/90 dark:bg-gray-900/90 shadow-md hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm"
                  />
                </div>

                {/* Image Counter */}
                {product.images && product.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {selectedImage + 1} / {product.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center">
                  {product.images.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "relative w-12 h-12 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all",
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
              className="space-y-3.5"
            >
              {/* Title & Category */}
              <div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight">
                  {product.name}
                </h1>
                {product.category && (
                  <Link 
                    href={`/products/${product.category.slug}`}
                    className="text-xs text-pink-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    {product.category.name}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {/* ABV Display */}
              {product.product_type === 'alcoholic' && abvValue !== null && abvValue !== undefined && (
                <div className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-950/30 px-2.5 py-1 rounded-full w-fit">
                  <Wine className="h-3.5 w-3.5 text-pink-600" />
                  <span className="text-xs font-medium text-pink-600">
                    {abvValue}% ABV
                  </span>
                </div>
              )}

              {/* Rating & Reviews */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < Math.floor(product.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{product.rating || 0}</span>
                </div>
                <span className="text-xs text-gray-500">
                  ({product.review_count || 0} reviews)
                </span>
                {product.review_count > 0 && (
                  <button className="text-xs text-pink-600 hover:underline">
                    Read reviews
                  </button>
                )}
              </div>

              {/* Price Card */}
              <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                  <span className="text-2xl md:text-3xl font-bold text-pink-600 dark:text-pink-400">
                    KSh {currentPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-base text-gray-400 line-through">
                        KSh {originalPrice.toLocaleString()}
                      </span>
                      <Badge className="bg-red-500 text-white border-0 text-xs">
                        {discountPercent}% OFF
                      </Badge>
                    </>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Free Shipping</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  product.stock_status === 'in_stock' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : product.stock_status === 'pre_order'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                )}>
                  {product.stock_status === 'in_stock' && '✓ In Stock'}
                  {product.stock_status === 'pre_order' && '📦 Pre-Order'}
                  {product.stock_status === 'out_of_stock' && '✗ Out of Stock'}
                </span>
                {product.flash_sale && (
                  <span className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1 rounded-full animate-pulse font-medium">
                    🔥 Flash Sale
                  </span>
                )}
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-medium text-xs text-gray-600 dark:text-gray-400">Select variant:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.map((variant: any) => (
                      <motion.button
                        key={variant.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedVariant(variant)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border-2 transition-all font-medium text-xs",
                          selectedVariant?.id === variant.id
                            ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-600 ring-2 ring-pink-600/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                          variant.stock === 0 && 'opacity-50 cursor-not-allowed'
                        )}
                        disabled={variant.stock === 0}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{variant.variant_value}</span>
                          {variant.abv && (
                            <span className="text-[10px] text-pink-600 bg-pink-100 dark:bg-pink-900/30 px-1.5 py-0.5 rounded-full">
                              {variant.abv}% ABV
                            </span>
                          )}
                        </div>
                        {variant.stock === 0 && ' (Out of stock)'}
                        {variant.stock > 0 && variant.stock < 10 && (
                          <span className="text-[10px] text-red-500 ml-1">({variant.stock} left)</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-xs text-gray-600 dark:text-gray-400">Quantity:</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(selectedVariant?.stock || 10, quantity + 1))}
                      className="p-1.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                      disabled={selectedVariant?.stock === 0}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* ✅ Solid pink Add to Cart, matching ProductCard */}
                  <Button
                    size="lg"
                    className="bg-pink-600 hover:bg-pink-700 text-white flex-1 min-w-[160px] h-11 text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                    onClick={handleAddToCart}
                    disabled={product.stock_status === 'out_of_stock' || selectedVariant?.stock === 0}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.stock_status === 'out_of_stock' || selectedVariant?.stock === 0 
                          ? 'Out of Stock' 
                          : 'Add to Cart'}
                      </>
                    )}
                  </Button>
                  <WishlistButton 
                    productId={product.id} 
                    variantId={selectedVariant?.id}
                    className="h-11 w-11 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-pink-400"
                  />
                  {/* ✅ Share = copy link */}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleShare}
                    className="h-11 w-11 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-pink-400"
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50"
                    >
                      <div className={cn("p-1 rounded-md bg-opacity-20", benefit.color)}>
                        <Icon className={cn("h-3.5 w-3.5", benefit.color)} />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium leading-tight">{benefit.label}</p>
                        <p className="text-[10px] text-gray-500 leading-tight">{benefit.description}</p>
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
      <Card className="mt-4 border-0 shadow-md">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-pink-600" />
                <h3 className="text-base font-semibold">Product Description</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description || 'No description available'}
              </p>
            </div>

            {/* Product Details — spec-table styling */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-pink-600" />
                <h3 className="text-base font-semibold">Product Details</h3>
              </div>
              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
                {product.sku && (
                  <div className="flex justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-500 text-xs">SKU</span>
                    <span className="font-medium text-xs">{product.sku}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-500 text-xs">Category</span>
                    <Link href={`/products/${product.category.slug}`} className="text-pink-600 hover:underline font-medium text-xs">
                      {product.category.name}
                    </Link>
                  </div>
                )}
                {product.subcategory && (
                  <div className="flex justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-500 text-xs">Subcategory</span>
                    <span className="font-medium text-xs">{product.subcategory.name}</span>
                  </div>
                )}
                {product.product_type === 'alcoholic' && abvValue !== null && abvValue !== undefined && (
                  <div className="flex justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-500 text-xs">Alcohol by Volume</span>
                    <span className="font-medium text-pink-600 text-xs">{abvValue}%</span>
                  </div>
                )}
                {product.product_type && (
                  <div className="flex justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-500 text-xs">Product Type</span>
                    <span className="font-medium capitalize text-xs">{product.product_type?.replace('_', ' ')}</span>
                  </div>
                )}
                {product.created_at && (
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-gray-500 text-xs">Added</span>
                    <span className="font-medium text-xs">{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-pink-600" />
              <h2 className="text-lg font-bold">You might also like</h2>
            </div>
            <Link href={`/products/${product.category?.slug}`} className="text-pink-600 hover:underline text-xs font-medium">
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
