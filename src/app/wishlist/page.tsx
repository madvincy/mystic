// src/app/wishlist/page.tsx
'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Heart } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '@/lib/store'
import { fetchWishlist } from '@/lib/store/wishlistSlice'
import ProductGrid from '@/components/ui/ProductGrid'
import { useAuth } from '@/lib/hooks/useAuth'

export default function WishlistPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const { items, loading } = useSelector((state: RootState) => state.wishlist)

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWishlist(user.id))
    }
  }, [user, dispatch])

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login to view wishlist</h2>
          <p className="text-gray-500 mb-4">Save your favorite products for later</p>
          <Link href="/auth/login">
            <Button className="bg-pink-600 hover:bg-pink-700">Login</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  const wishlistProducts = items
    .map(w => w.product)
    .filter(Boolean)

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-gray-500 mb-8">
          {items.length} items saved
        </p>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-4">Start adding products you love</p>
            <Link href="/products">
              <Button className="bg-pink-600 hover:bg-pink-700">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <ProductGrid products={wishlistProducts} loading={loading} />
        )}
      </motion.div>
    </div>
  )
}