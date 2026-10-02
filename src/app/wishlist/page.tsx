// src/app/wishlist/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Check, Heart, HeartOff, Package, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '@/lib/store'
import { fetchWishlist, removeWishlistProducts } from '@/lib/store/wishlistSlice'
import { useAuth } from '@/lib/hooks/useAuth'
import WishlistButton from '@/components/ui/WishlistButton'
import { toast } from 'sonner'

export default function WishlistPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const { items, loading } = useSelector((state: RootState) => state.wishlist)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWishlist(user.id))
    }
  }, [user, dispatch])

  const wishlistProducts = useMemo(() => {
    const uniqueProducts = new Map<string, any>()
    for (const item of items) {
      if (item.product && !uniqueProducts.has(item.product_id)) {
        uniqueProducts.set(item.product_id, item.product)
      }
    }
    return Array.from(uniqueProducts.entries()).map(([id, product]) => ({ id, product }))
  }, [items])

  useEffect(() => {
    const availableIds = new Set(wishlistProducts.map(item => item.id))
    setSelectedProductIds(previous => new Set([...previous].filter(id => availableIds.has(id))))
  }, [wishlistProducts])

  const allSelected = wishlistProducts.length > 0 && selectedProductIds.size === wishlistProducts.length

  const toggleSelected = (productId: string) => {
    setSelectedProductIds(previous => {
      const next = new Set(previous)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const removeSelected = async () => {
    if (!user?.id || selectedProductIds.size === 0) return
    try {
      const productIds = Array.from(selectedProductIds)
      await dispatch(removeWishlistProducts({ userId: user.id, productIds })).unwrap()
      setSelectedProductIds(new Set())
      toast.success(`${productIds.length} ${productIds.length === 1 ? 'item' : 'items'} removed from your wishlist`)
    } catch (error: any) {
      toast.error(error || 'Could not remove selected items')
    }
  }

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

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-pink-50/60 via-background to-background dark:from-pink-950/15">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-pink-600 dark:text-pink-400"><Heart className="h-4 w-4 fill-current" />Your saved collection</p>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">My Wishlist</h1>
            <p className="mt-2 text-sm text-muted-foreground">{wishlistProducts.length} {wishlistProducts.length === 1 ? 'product' : 'products'} saved for later</p>
          </div>
          {wishlistProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setSelectedProductIds(allSelected ? new Set() : new Set(wishlistProducts.map(item => item.id)))}>
                <Check className="mr-2 h-4 w-4" />{allSelected ? 'Deselect all' : 'Select all'}
              </Button>
              <Button variant="destructive" onClick={removeSelected} disabled={selectedProductIds.size === 0 || loading}>
                <Trash2 className="mr-2 h-4 w-4" />Remove selected{selectedProductIds.size > 0 ? ` (${selectedProductIds.size})` : ''}
              </Button>
            </div>
          )}
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="mx-auto max-w-lg py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300"><HeartOff className="h-8 w-8" /></div>
            <h3 className="font-display text-2xl font-semibold">Nothing saved just yet</h3>
            <p className="mx-auto mb-6 mt-2 max-w-sm text-sm text-muted-foreground">Tap the heart on anything you like and it will be waiting here when you are ready.</p>
            <Link href="/products">
              <Button className="bg-pink-600 text-white hover:bg-pink-700">
                <ShoppingBag className="mr-2 h-4 w-4" />Browse products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {wishlistProducts.map(({ id, product }, index) => {
              const price = Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price) ? product.sale_price : product.price
              const selected = selectedProductIds.has(id)
              return (
                <motion.article key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.24) }} className={`group overflow-hidden rounded-xl border bg-card text-card-foreground transition-shadow hover:shadow-lg ${selected ? 'border-pink-500 ring-1 ring-pink-500/30' : 'border-border'}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="absolute inset-0">
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-muted-foreground" /></div>}
                    </Link>
                    <label className="absolute left-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background/95 shadow-sm" aria-label={`Select ${product.name}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleSelected(id)} className="sr-only" />
                      <span className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? 'border-pink-600 bg-pink-600 text-white' : 'border-muted-foreground/50 bg-background'}`}>{selected && <Check className="h-3.5 w-3.5" />}</span>
                    </label>
                    <div className="absolute right-3 top-3 rounded-full border border-border bg-background/95 shadow-sm"><WishlistButton productId={id} size="sm" /></div>
                    {product.is_new && <span className="absolute bottom-3 left-3 rounded-full bg-pink-600 px-2.5 py-1 text-[11px] font-semibold text-white">New</span>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.category?.name || 'Mystic collection'}</p>
                    <Link href={`/products/${product.slug}`} className="mt-1 block font-semibold leading-snug hover:text-pink-600">{product.name}</Link>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div><p className="font-bold text-pink-600 dark:text-pink-400">KSh {Number(price).toLocaleString()}</p>{Number(price) < Number(product.price) && <p className="text-xs text-muted-foreground line-through">KSh {Number(product.price).toLocaleString()}</p>}</div>
                      <Link href={`/products/${product.slug}`}><Button size="sm" variant="outline">View product</Button></Link>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </motion.div>
      </div>
    </div>
  )
}