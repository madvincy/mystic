// src/components/ui/WishlistButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Heart } from 'lucide-react'
import { toggleWishlist, fetchWishlist } from '@/lib/store/wishlistSlice'
import { AppDispatch, RootState } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'

interface WishlistButtonProps {
  productId: string
  variantId?: string | null // Allow null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function WishlistButton({ 
  productId, 
  variantId = null, // Default to null instead of undefined
  className = '',
  size = 'md'
}: WishlistButtonProps) {
  const { user, isLoading: authLoading } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const [isLoading, setIsLoading] = useState(false)
  const [localInWishlist, setLocalInWishlist] = useState(false)
  
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
  const wishlistError = useSelector((state: RootState) => state.wishlist.error)

  // Check if product is in wishlist - handle null variantId
  const inWishlist = wishlistItems.some(
    w => {
      // If variantId is null or undefined, match products without variant
      if (!variantId) {
        return w.product_id === productId && !w.variant_id
      }
      // Otherwise match both product and variant
      return w.product_id === productId && w.variant_id === variantId
    }
  )

  // Update local state when wishlist changes
  useEffect(() => {
    setLocalInWishlist(inWishlist)
  }, [inWishlist])

  // Show error toast if wishlist error occurs
  useEffect(() => {
    if (wishlistError) {
      toast.error(wishlistError)
    }
  }, [wishlistError])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if user is logged in
    if (!user) {
      toast.error('Please login to add to wishlist', {
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/auth/login'
        }
      })
      return
    }

    // Check if user ID exists
    if (!user?.id) {
      toast.error('User ID not found. Please re-login.')
      return
    }

    // Prevent multiple clicks
    if (isLoading) return

    setIsLoading(true)
    
    try {
      console.log('🔄 Toggling wishlist for product:', productId, 'variant:', variantId || 'none')
      
      // Optimistic update
      setLocalInWishlist(!localInWishlist)
      
      const result = await dispatch(toggleWishlist({
        userId: user.id,
        productId,
        variantId: variantId || undefined // Pass undefined if null/empty
      })).unwrap()
      
      // Refresh wishlist to ensure consistency
      await dispatch(fetchWishlist(user.id)).unwrap()
      
      toast.success(
        result.action === 'added' 
          ? 'Added to wishlist ❤️' 
          : 'Removed from wishlist'
      )
    } catch (error: any) {
      // Revert optimistic update on error
      setLocalInWishlist(inWishlist)
      console.error('Wishlist error:', error)
      
      // Show user-friendly error message
      if (error === 'User not authenticated') {
        toast.error('Please login to manage wishlist')
      } else if (error === 'Please login to add items to wishlist') {
        toast.error('Please login to add items to wishlist')
      } else {
        toast.error(error || 'Failed to update wishlist')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={handleToggle}
      disabled={isLoading || !user}
      className={cn(
        "relative rounded-full transition-colors",
        sizeClasses[size],
        localInWishlist 
          ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-pink-600',
        className
      )}
      aria-label={localInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={user ? (localInWishlist ? 'Remove from wishlist' : 'Add to wishlist') : 'Login to add to wishlist'}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "transition-all",
          localInWishlist ? 'fill-pink-600 scale-110' : ''
        )}
      />
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
        </span>
      )}
      {!user && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-gray-400 rounded-full animate-pulse" />
      )}
    </motion.button>
  )
}