// src/components/ui/MobileMenu.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Heart, 
  ShoppingBag, 
  LogOut, 
  Package, 
  Settings,
  ChevronDown,
  ChevronRight,
  Wine,
  Beer,
  Martini,
  MoreHorizontal,
  Home,
  Sparkles,
  Gift,
  Newspaper,
  Phone,
  Sun,
  Moon,
  ShoppingCart,
  Menu
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

// Category structure with subcategories
const categoryStructure = {
  'Wine': {
    icon: Wine,
    subcategories: [
      { name: 'Red Wine', slug: 'red-wine' },
      { name: 'White Wine', slug: 'white-wine' },
      { name: 'Rose Wine', slug: 'rose-wine' },
      { name: 'Sparkling Wine', slug: 'sparkling-wine' },
      { name: 'Dessert Wine', slug: 'dessert-wine' }
    ]
  },
  'Beer': {
    icon: Beer,
    subcategories: [
      { name: 'Lager', slug: 'lager' },
      { name: 'Ale', slug: 'ale' },
      { name: 'Stout', slug: 'stout' },
      { name: 'Pilsner', slug: 'pilsner' },
      { name: 'Craft Beer', slug: 'craft-beer' },
      { name: 'Imported Beer', slug: 'imported-beer' }
    ]
  },
  'Spirits': {
    icon: Martini,
    subcategories: [
      { name: 'Whiskey', slug: 'whiskey' },
      { name: 'Vodka', slug: 'vodka' },
      { name: 'Gin', slug: 'gin' },
      { name: 'Rum', slug: 'rum' },
      { name: 'Tequila', slug: 'tequila' },
      { name: 'Brandy', slug: 'brandy' },
      { name: 'Cognac', slug: 'cognac' },
      { name: 'Liqueurs', slug: 'liqueurs' }
    ]
  }
}

const otherCategories = [
  { name: 'Energy Drinks', slug: 'energy-drinks', icon: '⚡' },
  { name: 'Merchandise', slug: 'merchandise', icon: '👕' },
  { name: 'Cigarattes', slug: 'cigarattes & Vapes', icon: '🚬' },
  { name: 'Gift Sets', slug: 'gifts', icon: '🎁' },
  { name: 'Jaba Juice', slug: 'nicotine', icon: '🥤' },
  { name: 'Accessories', slug: 'extras', icon: '🛍️' }
]

export default function MobileMenu({ isOpen, onClose, className = '' }: MobileMenuProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showMore, setShowMore] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // ✅ Use SupabaseAuthProvider
  const { user, isAdmin, signOut } = useSupabaseAuth()
  
  // Get cart count from Redux
  const { itemCount } = useSelector((state: RootState) => state.cart)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      onClose()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Main navigation items
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'All Products', href: '/products', icon: ShoppingBag },
    { name: 'New Arrivals', href: '/products?new=true', icon: Sparkles },
    { name: 'Gifts', href: '/gifts', icon: Gift },
    { name: 'Blog', href: '/blog', icon: Newspaper },
    { name: 'Contact', href: '/contact', icon: Phone },
  ]

  const userLinks = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Wishlist', href: '/wishlist', icon: Heart },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className={cn(
              "fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 z-50 shadow-xl overflow-y-auto",
              className
            )}
          >
            <div className="p-4 pb-20">
              {/* Header with Cart and Menu Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    M
                  </div>
                  <span className="font-bold text-lg bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    MysticWines
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* ✅ Cart Button - Visible on mobile */}
                  <Link href="/cart" onClick={onClose} className="relative">
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                      <ShoppingCart className="h-5 w-5" />
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                          {itemCount > 99 ? '99+' : itemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  {/* ✅ Close Button - Mobile menu toggle */}
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* User Info */}
              {user ? (
                <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-semibold">
                    {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.user_metadata?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="block w-full mb-4" onClick={onClose}>
                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                    Sign In
                  </Button>
                </Link>
              )}

              {/* Main Navigation */}
              <nav className="space-y-1 mb-4">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                      onClick={onClose}
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {/* Categories Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Categories
                </p>
              </div>

              {/* Category Accordion: Wine */}
              <div>
                <button
                  onClick={() => toggleCategory('Wine')}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  <span className="flex items-center gap-3">
                    <Wine className="h-4 w-4 text-pink-600" />
                    Wine
                  </span>
                  {expandedCategories.has('Wine') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedCategories.has('Wine') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-6 space-y-1 overflow-hidden border-l-2 border-pink-200 dark:border-pink-800/30 pl-3"
                    >
                      {categoryStructure.Wine.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/products?subcategory=${sub.slug}`}
                          className="block px-3 py-2 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 rounded-lg transition-colors"
                          onClick={onClose}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Category Accordion: Beer */}
              <div>
                <button
                  onClick={() => toggleCategory('Beer')}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  <span className="flex items-center gap-3">
                    <Beer className="h-4 w-4 text-amber-500" />
                    Beer
                  </span>
                  {expandedCategories.has('Beer') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedCategories.has('Beer') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-6 space-y-1 overflow-hidden border-l-2 border-amber-200 dark:border-amber-800/30 pl-3"
                    >
                      {categoryStructure.Beer.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/products?subcategory=${sub.slug}`}
                          className="block px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 rounded-lg transition-colors"
                          onClick={onClose}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Category Accordion: Spirits */}
              <div>
                <button
                  onClick={() => toggleCategory('Spirits')}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  <span className="flex items-center gap-3">
                    <Martini className="h-4 w-4 text-purple-500" />
                    Spirits
                  </span>
                  {expandedCategories.has('Spirits') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedCategories.has('Spirits') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-6 space-y-1 overflow-hidden border-l-2 border-purple-200 dark:border-purple-800/30 pl-3"
                    >
                      {categoryStructure.Spirits.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/products?subcategory=${sub.slug}`}
                          className="block px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 rounded-lg transition-colors"
                          onClick={onClose}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* More Categories Accordion */}
              <div>
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  <span className="flex items-center gap-3">
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    More Categories
                  </span>
                  {showMore ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <AnimatePresence>
                  {showMore && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-6 space-y-1 overflow-hidden border-l-2 border-gray-200 dark:border-gray-700 pl-3"
                    >
                      {otherCategories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          onClick={onClose}
                        >
                          <span>{cat.icon}</span>
                          {cat.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Links */}
              {user && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
                  <nav className="space-y-1">
                    {userLinks.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                          onClick={onClose}
                        >
                          <Icon className="h-4 w-4 text-gray-500" />
                          {item.name}
                        </Link>
                      )
                    })}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-pink-600"
                        onClick={onClose}
                      >
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </nav>
                </>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <p className="text-xs text-gray-500 text-center">
                  © {new Date().getFullYear()} Mystic Wines
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}