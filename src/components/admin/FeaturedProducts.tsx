// src/components/admin/FeaturedProducts.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Trash2,
  Star,
  RefreshCw,
  MoveUp,
  MoveDown,
  Package
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

interface FeaturedProduct {
  id: string
  product_id: string
  display_order: number
  is_active: boolean
  product: {
    name: string
    price: number
    images: string[]
  }
}

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState<FeaturedProduct[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [featuredToDelete, setFeaturedToDelete] = useState<string | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchFeatured()
    fetchAvailableProducts()
  }, [])

  const fetchFeatured = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('featured_products')
        .select(`
          *,
          product:products(name, price, images)
        `)
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      setFeatured(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch featured products: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images')
        .not('id', 'in', featured.map(f => f.product_id))
        .limit(100)

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Error fetching products:', error)
    }
  }

  const addFeatured = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product')
      return
    }

    try {
      const displayOrder = featured.length + 1
      const { error } = await supabase
        .from('featured_products')
        .insert({
          product_id: selectedProduct,
          display_order: displayOrder,
          is_active: true,
          created_at: new Date().toISOString(),
        })

      if (error) throw error
      toast.success('Product added to featured')
      setShowAddDialog(false)
      setSelectedProduct(null)
      fetchFeatured()
      fetchAvailableProducts()
    } catch (error: any) {
      toast.error('Failed to add featured product: ' + error.message)
    }
  }

  const removeFeatured = async () => {
    if (!featuredToDelete) return
    try {
      const { error } = await supabase
        .from('featured_products')
        .delete()
        .eq('id', featuredToDelete)

      if (error) throw error
      toast.success('Product removed from featured')
      fetchFeatured()
      fetchAvailableProducts()
      setShowDeleteDialog(false)
      setFeaturedToDelete(null)
    } catch (error: any) {
      toast.error('Failed to remove featured product: ' + error.message)
    }
  }

  const updateOrder = async (id: string, direction: 'up' | 'down') => {
    const current = featured.find(f => f.id === id)
    if (!current) return

    const index = featured.indexOf(current)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= featured.length) return

    const swapped = [...featured]
    ;[swapped[index], swapped[newIndex]] = [swapped[newIndex], swapped[index]]

    // Update display_order for both items
    const updates = [
      { id: swapped[index].id, display_order: index + 1 },
      { id: swapped[newIndex].id, display_order: newIndex + 1 },
    ]

    for (const update of updates) {
      await supabase
        .from('featured_products')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    }

    fetchFeatured()
  }

  const filteredFeatured = featured.filter(f =>
    f.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredFeatured.length / itemsPerPage)
  const paginatedFeatured = filteredFeatured.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <p className="text-gray-500">Manage products displayed on homepage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFeatured}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Featured Products', value: featured.length, icon: Star, color: 'text-yellow-600' },
          { label: 'Available Products', value: products.length, icon: Package, color: 'text-blue-600' },
          { label: 'Total Products', value: featured.length + products.length, icon: Package, color: 'text-green-600' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search featured products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Featured List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto" />
                  </td>
                </tr>
              ) : paginatedFeatured.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No featured products
                  </td>
                </tr>
              ) : (
                paginatedFeatured.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <img 
                            src={item.product?.images?.[0] || '/images/placeholder.jpg'} 
                            alt={item.product?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{item.product?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      KSh {item.product?.price?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateOrder(item.id, 'up')}
                          disabled={item.display_order === 1}
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <span className="text-sm">{item.display_order}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateOrder(item.id, 'down')}
                          disabled={item.display_order === featured.length}
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setFeaturedToDelete(item.id)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFeatured.length)} of {filteredFeatured.length}
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
      </div>

      {/* Add Featured Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Featured Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <select
                value={selectedProduct || ''}
                onChange={(e) => setSelectedProduct(e.target.value || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - KSh {product.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={addFeatured}
              >
                Add to Featured
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowAddDialog(false)
                  setSelectedProduct(null)
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
            <AlertDialogTitle>Remove from Featured?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will no longer appear in the featured section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeFeatured} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}