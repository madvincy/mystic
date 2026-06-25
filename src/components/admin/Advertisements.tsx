// src/components/admin/Advertisements.tsx
'use client'

import { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Badge } from '@/components/shadCn/ui/badge'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
  image_url: string
  link_url: string
  product_id: string | null
  category_id: string | null
  subcategory_id: string | null
  placement: string
  ad_type: string
  order_position: number
  is_active: boolean
  start_date: string
  end_date: string
  clicks: number
  impressions: number
  created_at: string
  product?: {
    name: string
  }
  category?: {
    name: string
  }
  subcategory?: {
    name: string
  }
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
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPlacement, setFilterPlacement] = useState<string>('all')

  const itemsPerPage = 10

  useEffect(() => {
    fetchAds()
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchAds = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select(`
          *,
          product:products(name),
          category:categories(name),
          subcategory:subcategories(name)
        `)
        .order('order_position')

      if (error) throw error
      setAds(data || [])
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
        .select('id, name')
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

  const saveAd = async () => {
    try {
      if (!editingAd.image_url) {
        toast.error('Image URL is required')
        return
      }

      const data = {
        title: editingAd.title || '',
        image_url: editingAd.image_url,
        link_url: editingAd.link_url || '',
        product_id: editingAd.product_id || null,
        category_id: editingAd.category_id || null,
        subcategory_id: editingAd.subcategory_id || null,
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

  const filteredAds = ads.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              setEditingAd({ is_active: true, placement: 'all', ad_type: 'banner' })
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
                    {ad.product && (
                      <p className="text-sm text-gray-500">
                        Product: {ad.product.name}
                      </p>
                    )}
                    {ad.category && (
                      <p className="text-sm text-gray-500">
                        Category: {ad.category.name}
                      </p>
                    )}
                    {ad.subcategory && (
                      <p className="text-sm text-gray-500">
                        Subcategory: {ad.subcategory.name}
                      </p>
                    )}
                    {ad.link_url && (
                      <p className="text-xs text-gray-400 truncate">
                        Link: {ad.link_url}
                      </p>
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
                placeholder="Ad title"
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                value={editingAd.image_url || ''}
                onChange={(e) => setEditingAd({ ...editingAd, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input
                value={editingAd.link_url || ''}
                onChange={(e) => setEditingAd({ ...editingAd, link_url: e.target.value })}
                placeholder="https://example.com"
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
                <Label>Product (optional)</Label>
                <Select
                  value={editingAd.product_id || ''}
                  onValueChange={(value) => {
                    setEditingAd({ ...editingAd, product_id: value || null })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order Position</Label>
                <Input
                  type="number"
                  value={editingAd.order_position || ads.length + 1}
                  onChange={(e) => setEditingAd({ ...editingAd, order_position: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category (for targeted ads)</Label>
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
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory (for targeted ads)</Label>
                <Select
                  value={editingAd.subcategory_id || ''}
                  onValueChange={(value) => setEditingAd({ ...editingAd, subcategory_id: value || null })}
                  disabled={!editingAd.category_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="flex items-center gap-2">
              <Switch
                checked={editingAd.is_active !== undefined ? editingAd.is_active : true}
                onCheckedChange={(checked) => setEditingAd({ ...editingAd, is_active: checked })}
              />
              <Label>Active</Label>
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