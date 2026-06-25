// src/components/admin/Advertisements.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Tag,
  Filter,
  Calendar,
  X,
  ShoppingBag,
  Layers
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Badge } from '@/components/shadCn/ui/badge'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadCn/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadCn/ui/alert-dialog'
import { Label } from '@/components/shadCn/ui/label'
import { Switch } from '@/components/shadCn/ui/switch'
import { Textarea } from '@/components/shadCn/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadCn/ui/select'

interface Advertisement {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  product_ids: string[]
  category_id: string | null
  subcategory_id: string | null
  display_type: 'product' | 'category' | 'subcategory' | 'custom' | 'multiple_products'
  cta_text: string
  placement: string
  ad_type: string
  order_position: number
  is_active: boolean
  start_date: string
  end_date: string
  clicks: number
  impressions: number
  created_at: string
  products?: Product[]
  category?: {
    id: string
    name: string
  }
  subcategory?: {
    id: string
    name: string
  }
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  slug: string
}

export default function Advertisements() {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAd, setEditingAd] = useState<Partial<Advertisement>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [adToDelete, setAdToDelete] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPlacement, setFilterPlacement] = useState<string>('all')

  // ✅ Product search states for multi-select
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchAds()
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchAds = async () => {
    setLoading(true)
    try {
      // First fetch ads
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name)
        `)
        .order('order_position')

      if (adsError) throw adsError

      // Fetch products for each ad that has product_ids
      const adsWithProducts = await Promise.all(
        (adsData || []).map(async (ad) => {
          if (ad.product_ids && ad.product_ids.length > 0) {
            const { data: productsData } = await supabase
              .from('products')
              .select('id, name, price, images, slug')
              .in('id', ad.product_ids)
            
            return { ...ad, products: productsData || [] }
          }
          return { ...ad, products: [] }
        })
      )

      setAds(adsWithProducts || [])
    } catch (error: any) {
      toast.error('Failed to fetch ads: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images, slug')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSubcategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name')

      if (error) throw error
      setSubcategories(data || [])
    } catch (error: any) {
      console.error('Error fetching subcategories:', error)
    }
  }

  // ✅ Product search handler with debounce
  const handleProductSearch = (value: string) => {
    setProductSearch(value)
    setShowDropdown(value.length >= 3)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (value.length >= 3) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const filtered = products.filter(p => 
            p.name.toLowerCase().includes(value.toLowerCase()) &&
            !selectedProducts.some(sp => sp.id === p.id)
          )
          setSearchResults(filtered.slice(0, 10))
        } catch (error) {
          console.error('Error searching products:', error)
        } finally {
          setIsSearching(false)
        }
      }, 300)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // ✅ Add product to selection
  const addProduct = (product: Product) => {
    setSelectedProducts([...selectedProducts, product])
    setSearchResults(searchResults.filter(p => p.id !== product.id))
    setProductSearch('')
    setShowDropdown(false)
  }

  // ✅ Remove product from selection
  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const saveAd = async () => {
    try {
      if (!editingAd.image_url) {
        toast.error('Image URL is required')
        return
      }

      // ✅ Get product IDs from selected products
      const productIds = selectedProducts.map(p => p.id)

      const data = {
        title: editingAd.title || '',
        description: editingAd.description || '',
        image_url: editingAd.image_url,
        link_url: editingAd.link_url || '',
        product_ids: productIds,
        category_id: editingAd.category_id || null,
        subcategory_id: editingAd.subcategory_id || null,
        display_type: editingAd.display_type || 'custom',
        cta_text: editingAd.cta_text || 'Shop Now',
        placement: editingAd.placement || 'all',
        ad_type: editingAd.ad_type || 'banner',
        order_position: editingAd.order_position || ads.length + 1,
        is_active: editingAd.is_active !== undefined ? editingAd.is_active : true,
        start_date: editingAd.start_date || null,
        end_date: editingAd.end_date || null,
        updated_at: new Date().toISOString(),
      }

      if (editingAd.id) {
        const { error } = await supabase
          .from('advertisements')
          .update(data)
          .eq('id', editingAd.id)

        if (error) throw error
        toast.success('Advertisement updated')
      } else {
        const { error } = await supabase
          .from('advertisements')
          .insert({
            ...data,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        toast.success('Advertisement created')
      }

      setShowDialog(false)
      setEditingAd({})
      setSelectedProducts([])
      setProductSearch('')
      setSearchResults([])
      fetchAds()
    } catch (error: any) {
      toast.error('Failed to save ad: ' + error.message)
    }
  }

  const deleteAd = async () => {
    if (!adToDelete) return
    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adToDelete)

      if (error) throw error
      toast.success('Ad deleted')
      fetchAds()
      setShowDeleteDialog(false)
      setAdToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete ad: ' + error.message)
    }
  }

  const toggleAdStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`Ad ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchAds()
    } catch (error: any) {
      toast.error('Failed to update ad: ' + error.message)
    }
  }

  const updateOrder = async (id: string, direction: 'up' | 'down') => {
    const current = ads.find(a => a.id === id)
    if (!current) return

    const index = ads.indexOf(current)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= ads.length) return

    const swapped = [...ads]
    ;[swapped[index], swapped[newIndex]] = [swapped[newIndex], swapped[index]]

    const updates = [
      { id: swapped[index].id, order_position: index + 1 },
      { id: swapped[newIndex].id, order_position: newIndex + 1 },
    ]

    for (const update of updates) {
      await supabase
        .from('advertisements')
        .update({ order_position: update.order_position })
        .eq('id', update.id)
    }

    fetchAds()
  }

  // ✅ Load selected products when editing
  useEffect(() => {
    if (editingAd.id && editingAd.product_ids) {
      const productsData = editingAd.products || []
      setSelectedProducts(productsData)
    } else {
      setSelectedProducts([])
    }
  }, [editingAd])

  const filteredAds = ads.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || a.ad_type === filterType
    const matchesPlacement = filterPlacement === 'all' || a.placement === filterPlacement
    return matchesSearch && matchesType && matchesPlacement
  })

  const totalPages = Math.ceil(filteredAds.length / itemsPerPage)
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      banner: 'bg-blue-100 text-blue-800',
      sidebar: 'bg-purple-100 text-purple-800',
      inline: 'bg-green-100 text-green-800',
      popup: 'bg-yellow-100 text-yellow-800',
      footer: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100'
  }

  const getPlacementBadge = (placement: string) => {
    const colors: Record<string, string> = {
      all: 'bg-indigo-100 text-indigo-800',
      homepage: 'bg-pink-100 text-pink-800',
      products: 'bg-orange-100 text-orange-800',
      blog: 'bg-cyan-100 text-cyan-800',
      checkout: 'bg-emerald-100 text-emerald-800',
    }
    return colors[placement] || 'bg-gray-100'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advertisements</h2>
          <p className="text-gray-500">Manage site banners and promotions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAds}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingAd({ is_active: true, placement: 'all', ad_type: 'banner', display_type: 'custom' })
              setSelectedProducts([])
              setProductSearch('')
              setSearchResults([])
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Ad
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search ads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ad Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="sidebar">Sidebar</SelectItem>
            <SelectItem value="inline">Inline</SelectItem>
            <SelectItem value="popup">Popup</SelectItem>
            <SelectItem value="footer">Footer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlacement} onValueChange={setFilterPlacement}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Placement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Placements</SelectItem>
            <SelectItem value="homepage">Homepage</SelectItem>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="checkout">Checkout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : paginatedAds.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No advertisements found
          </div>
        ) : (
          paginatedAds.map((ad) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className={`hover:shadow-lg transition-shadow ${!ad.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                    <img 
                      src={ad.image_url} 
                      alt={ad.title || 'Advertisement'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <Badge className={getTypeBadge(ad.ad_type || 'banner')}>
                        {ad.ad_type || 'banner'}
                      </Badge>
                      <Badge className={getPlacementBadge(ad.placement || 'all')}>
                        {ad.placement || 'all'}
                      </Badge>
                    </div>
                    <Badge 
                      className={`absolute bottom-2 right-2 ${
                        ad.is_active ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className="absolute bottom-2 left-2 bg-black/50">
                      #{ad.order_position}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-medium">{ad.title || 'Untitled'}</h3>
                    {ad.display_type === 'multiple_products' && ad.products && ad.products.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Layers className="h-3 w-3 text-pink-600" />
                        <span className="text-xs text-gray-500">
                          {ad.products.length} products
                        </span>
                      </div>
                    )}
                    {ad.display_type === 'category' && ad.category && (
                      <p className="text-sm text-blue-600">Category: {ad.category.name}</p>
                    )}
                    {ad.display_type === 'subcategory' && ad.subcategory && (
                      <p className="text-sm text-purple-600">Subcategory: {ad.subcategory.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>Clicks: {ad.clicks || 0}</span>
                      <span>•</span>
                      <span>Views: {ad.impressions || 0}</span>
                    </div>
                    {ad.start_date && ad.end_date && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(ad.start_date).toLocaleDateString()}</span>
                        <span>→</span>
                        <span>{new Date(ad.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrder(ad.id, 'up')}
                      disabled={ad.order_position === 1}
                    >
                      <MoveUp className="h-3 w-3 mr-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrder(ad.id, 'down')}
                      disabled={ad.order_position === ads.length}
                    >
                      <MoveDown className="h-3 w-3 mr-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingAd(ad)
                        setSelectedProducts(ad.products || [])
                        if (ad.category_id) {
                          fetchSubcategories(ad.category_id)
                        }
                        setShowDialog(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setAdToDelete(ad.id)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAds.length)} of {filteredAds.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Ad Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAd.id ? 'Edit Advertisement' : 'Add Advertisement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editingAd.title || ''}
                onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                placeholder="Johnnie Walker Family"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingAd.description || ''}
                onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                placeholder="Explore the complete Johnnie Walker collection"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                value={editingAd.image_url || ''}
                onChange={(e) => setEditingAd({ ...editingAd, image_url: e.target.value })}
                placeholder="https://example.com/johnnie-walker-family.jpg"
              />
            </div>

            {/* Display Type Selection */}
            <div className="space-y-2">
              <Label>Display Type</Label>
              <Select
                value={editingAd.display_type || 'custom'}
                onValueChange={(value: any) => {
                  setEditingAd({ 
                    ...editingAd, 
                    display_type: value,
                    product_ids: [],
                    category_id: null,
                    subcategory_id: null
                  })
                  if (value !== 'multiple_products') {
                    setSelectedProducts([])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select display type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom (Link Only)</SelectItem>
                  <SelectItem value="multiple_products">Multiple Products</SelectItem>
                  <SelectItem value="category">Category Products</SelectItem>
                  <SelectItem value="subcategory">Subcategory Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multiple Products Selection */}
            {editingAd.display_type === 'product' ||editingAd.display_type === 'multiple_products' && (
              <div className="space-y-2">
                <Label>Select Products</Label>
                <div className="relative">
                  <Input
                    placeholder="Search products (min 3 characters)..."
                    value={productSearch}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    className="pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-600 border-t-transparent" />
                    </div>
                  )}
                  
                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {showDropdown && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addProduct(product)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                          >
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                              <img 
                                src={product.images?.[0] || '/images/placeholder.jpg'} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">KSh {product.price.toLocaleString()}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showDropdown && productSearch.length >= 3 && searchResults.length === 0 && !isSearching && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-500">
                      No products found
                    </div>
                  )}
                </div>

                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProducts.map((product) => (
                      <Badge
                        key={product.id}
                        className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 flex items-center gap-1 px-3 py-1.5"
                      >
                        <img 
                          src={product.images?.[0] || '/images/placeholder.jpg'} 
                          alt={product.name}
                          className="w-5 h-5 rounded object-cover"
                        />
                        {product.name}
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="ml-1 hover:text-pink-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {/* Category Selection */}
            {editingAd.display_type === 'category' && (
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={editingAd.category_id || ''}
                  onValueChange={(value) => {
                    setEditingAd({ ...editingAd, category_id: value || null })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subcategory Selection */}
            {editingAd.display_type === 'subcategory' && (
              <div className="space-y-2">
                <Label>Select Category First</Label>
                <Select
                  value={editingAd.category_id || ''}
                  onValueChange={(value) => {
                    setEditingAd({ ...editingAd, category_id: value || null })
                    if (value) {
                      fetchSubcategories(value)
                    } else {
                      setSubcategories([])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingAd.category_id && (
                  <>
                    <Label className="mt-2">Select Subcategory</Label>
                    <Select
                      value={editingAd.subcategory_id || ''}
                      onValueChange={(value) => setEditingAd({ ...editingAd, subcategory_id: value || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>CTA Text</Label>
              <Input
                value={editingAd.cta_text || ''}
                onChange={(e) => setEditingAd({ ...editingAd, cta_text: e.target.value })}
                placeholder="Shop Now"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Type</Label>
                <Select
                  value={editingAd.ad_type || 'banner'}
                  onValueChange={(value: any) => setEditingAd({ ...editingAd, ad_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Placement</Label>
                <Select
                  value={editingAd.placement || 'all'}
                  onValueChange={(value: any) => setEditingAd({ ...editingAd, placement: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    <SelectItem value="homepage">Homepage</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="checkout">Checkout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Position</Label>
                <Input
                  type="number"
                  value={editingAd.order_position || ads.length + 1}
                  onChange={(e) => setEditingAd({ ...editingAd, order_position: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch
                  checked={editingAd.is_active !== undefined ? editingAd.is_active : true}
                  onCheckedChange={(checked) => setEditingAd({ ...editingAd, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (optional)</Label>
                <Input
                  type="date"
                  value={editingAd.start_date?.split('T')[0] || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input
                  type="date"
                  value={editingAd.end_date?.split('T')[0] || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveAd}
              >
                {editingAd.id ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDialog(false)
                  setEditingAd({})
                  setSelectedProducts([])
                  setProductSearch('')
                  setSearchResults([])
                  setSubcategories([])
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAd} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}