// src/components/ui/ProductCard.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { ShoppingCart, Heart, Star, Eye, Check, Wine } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { addItem } from '@/lib/store/cartSlice'
import { toast } from 'sonner'
import WishlistButton from './WishlistButton'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: any
  showDiscountBadge?: boolean
  showTimer?: boolean
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export default function ProductCard({ 
  product, 
  showDiscountBadge = false,
  showTimer = false,
  variant = 'default',
  className = ''
}: ProductCardProps) {
  const dispatch = useDispatch()
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  // Set default variant when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    }
  }, [product])

  // Update price when variant changes
  const currentPrice = selectedVariant?.price || product.sale_price || product.price
  const originalPrice = product.price
  const hasDiscount = currentPrice < originalPrice
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

  // Get stock status from selected variant or product
  const stock = selectedVariant?.stock ?? 0
  const isOutOfStock = product.stock_status === 'out_of_stock' || stock === 0

  // ✅ Get ABV value from product or selected variant
  const getABV = () => {
    // If there's a selected variant with ABV, use that
    if (selectedVariant?.abv !== null && selectedVariant?.abv !== undefined) {
      return selectedVariant.abv
    }
    // Otherwise use product ABV
    return product.abv
  }

  const abvValue = getABV()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isOutOfStock) {
      toast.error('Out of stock')
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
      quantity: 1,
      image: product.images?.[0] || '/images/placeholder.jpg',
      stock: stock,
    }))
    
    setIsAdded(true)
    toast.success('Added to cart! 🛒')
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleVariantClick = (e: React.MouseEvent, variant: any) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedVariant(variant)
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all dark:shadow-[0_4px_20px_rgba(236,72,153,0.15)] dark:hover:shadow-[0_8px_30px_rgba(236,72,153,0.25)]">
        <Link href={`/products/${product.slug}`} className="shrink-0">
          <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={imageError ? '/images/placeholder.jpg' : (product.images?.[0] || '/images/placeholder.jpg')}
              alt={product.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.slug}`}>
            <h4 className="font-medium text-sm hover:text-pink-600 transition line-clamp-1">
              {product.name}
            </h4>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-pink-600 text-sm">
              KSh {currentPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                KSh {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full mt-1 bg-pink-600 hover:bg-pink-700 text-white text-xs"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    )
  }

  // Featured variant (larger)
  if (variant === 'featured') {
    return (
      <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden dark:shadow-[0_8px_40px_rgba(236,72,153,0.2)] dark:hover:shadow-[0_12px_60px_rgba(236,72,153,0.35)] transition-shadow duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative aspect-square md:aspect-auto md:h-full bg-gray-100 dark:bg-gray-700">
            <Link href={`/products/${product.slug}`}>
              <Image
                src={imageError ? '/images/placeholder.jpg' : (product.images?.[0] || '/images/placeholder.jpg')}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            </Link>
            {showDiscountBadge && hasDiscount && (
              <div className="absolute top-4 left-4">
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-3 py-1.5 rounded-full shadow-lg font-medium animate-pulse">
                  -{discountPercent}%
                </span>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <WishlistButton productId={product.id} variantId={selectedVariant?.id || null} />
            </div>
          </div>
          <div className="p-6 flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {product.description || 'Premium quality product'}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.review_count || 0})</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-pink-600">
                KSh {currentPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  KSh {originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* ✅ ABV Display for Featured Card */}
            {product.product_type === 'alcoholic' && abvValue !== null && abvValue !== undefined && (
              <div className="flex items-center gap-1 mb-3">
                <Wine className="h-4 w-4 text-pink-600" />
                <span className="text-sm font-medium text-pink-600">
                  {abvValue}% ABV
                </span>
              </div>
            )}

            {/* Variants for featured card */}
            {product.variants && product.variants.length > 1 && (
              <div className="flex gap-1 mt-2 mb-4 flex-wrap">
                {product.variants.slice(0, 3).map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={(e) => handleVariantClick(e, variant)}
                    className={cn(
                      "text-xs px-3 py-1 rounded-full border transition",
                      selectedVariant?.id === variant.id
                        ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-600'
                        : 'border-gray-300 dark:border-gray-600 hover:border-pink-400'
                    )}
                  >
                    {variant.variant_value}
                    {variant.abv && (
                      <span className="text-xs text-gray-400 ml-1">({variant.abv}%)</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isAdded ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default card - with hot pink shadow on dark theme
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300",
        "dark:shadow-[0_4px_20px_rgba(236,72,153,0.15)] dark:hover:shadow-[0_8px_40px_rgba(236,72,153,0.3)]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={imageError ? '/images/placeholder.jpg' : (product.images?.[0] || '/images/placeholder.jpg')}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          
          {/* Quick View Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Quick view logic
              }}
            >
              <Eye className="h-4 w-4" />
              Quick View
            </Button>
          </motion.div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {showDiscountBadge && hasDiscount && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                -{discountPercent}%
              </span>
            )}
            {product.is_new && (
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full">
                New
              </span>
            )}
            {product.is_bestseller && (
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-1 rounded-full">
                Best Seller
              </span>
            )}
            {product.flash_sale && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                🔥 Flash Sale
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <div className="absolute top-2 right-2">
            <WishlistButton 
              productId={product.id}
              variantId={selectedVariant?.id || null}
            />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-sm md:text-base line-clamp-1 hover:text-pink-600 transition">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.floor(product.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.review_count || 0})</span>
        </div>

        {/* ✅ ABV Display for Default Card */}
        {product.product_type === 'alcoholic' && abvValue !== null && abvValue !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <Wine className="h-3 w-3 text-pink-600" />
            <span className="text-xs font-medium text-pink-600">
              {abvValue}% ABV
            </span>
          </div>
        )}

        {/* Price - Updates with variant selection */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="font-bold text-pink-600 dark:text-pink-400">
            KSh {currentPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              KSh {originalPrice.toLocaleString()}
            </span>
          )}
          {hasDiscount && (
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-1.5 py-0.5 rounded-full">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {product.variants.slice(0, 3).map((variant: any) => (
              <button
                key={variant.id}
                onClick={(e) => handleVariantClick(e, variant)}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border transition",
                  selectedVariant?.id === variant.id
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-pink-400'
                )}
              >
                {variant.variant_value}
                {variant.abv && (
                  <span className="text-xs text-gray-400 ml-1">({variant.abv}%)</span>
                )}
              </button>
            ))}
            {product.variants.length > 3 && (
              <span className="text-xs text-gray-400">+{product.variants.length - 3}</span>
            )}
          </div>
        )}

        {/* Add to Cart - Plain Pink */}
        <div className="mt-3">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm transition-all"
            disabled={isOutOfStock}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                {isOutOfStock ? 'Out of Stock' : 'ADD TO CART'}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}