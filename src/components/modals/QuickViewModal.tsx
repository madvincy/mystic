// src/components/modals/QuickViewModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Heart, Star, Minus, Plus, Check, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadCn/ui/dialog'
import { Button } from '@/components/shadCn/ui/button'
import { Badge } from '@/components/shadCn/ui/badge'
import { addItem } from '@/lib/store/cartSlice'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DiscountBadge from '../ui/DiscountBadge'
import WishlistButton from '../ui/WishlistButton'

interface QuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
}

export default function QuickViewModal({ isOpen, onClose, productId }: QuickViewModalProps) {
  const dispatch = useDispatch()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isAdded, setIsAdded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct()
    }
  }, [isOpen, productId])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*),
          category:categories(*),
          subcategory:subcategories(*)
        `)
        .eq('id', productId)
        .single()

      if (error) throw error
      setProduct(data)
      setSelectedVariant(data.variants?.[0] || null)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
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

  const currentPrice = selectedVariant?.price || product?.sale_price || product?.price || 0
  const originalPrice = product?.price || 0
  const hasDiscount = currentPrice < originalPrice

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!product) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-12">
            <p className="text-gray-500">Product not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-700">
              <Image
                src={imageError ? '/images/placeholder.jpg' : (product.images?.[selectedImage] || '/images/placeholder.jpg')}
                alt={product.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
              {hasDiscount && (
                <div className="absolute top-4 left-4">
                  <DiscountBadge product={product} />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {product.images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-16 h-16 rounded overflow-hidden border-2 flex-shrink-0 ${
                      selectedImage === index ? 'border-pink-600' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{product.name}</h2>
                <p className="text-sm text-gray-500">{product.category?.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.review_count || 0})</span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-bold text-pink-600">KSh {currentPrice.toLocaleString()}</span>
              {hasDiscount && (
                <span className="text-gray-400 line-through">KSh {originalPrice.toLocaleString()}</span>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Select variant:</h4>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                        selectedVariant?.id === variant.id
                          ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-600'
                          : 'border-gray-300 dark:border-gray-600 hover:border-pink-400'
                      } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={variant.stock === 0}
                    >
                      {variant.variant_value}
                      {variant.stock === 0 && ' (Out of stock)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mt-4">
              <span className="font-medium text-sm">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="p-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                disabled={product.stock_status === 'out_of_stock'}
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              <WishlistButton productId={product.id} variantId={selectedVariant?.id} />
              <Link href={`/products/${product.slug}`}>
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </Link>
            </div>

            {/* Description */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {product.description}
              </p>
            </div>

            {/* Stock Status */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-sm ${product.stock_status === 'in_stock' ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock_status === 'in_stock' ? '✓ In Stock' : 'Out of Stock'}
              </span>
              {product.flash_sale && (
                <Badge className="bg-red-500 animate-pulse">🔥 Flash Sale</Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}