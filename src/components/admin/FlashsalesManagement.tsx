// src/components/admin/FlashSalesManagement.tsx
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
  Flame,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
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
import { Switch } from '@/components/shadCn/ui/switch'

interface FlashSale {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  is_active: boolean
  products: any[]
  created_at: string
}

export default function FlashSalesManagement() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingFlashSale, setEditingFlashSale] = useState<Partial<FlashSale>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [flashSaleToDelete, setFlashSaleToDelete] = useState<string | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchFlashSales()
  }, [])

  const fetchFlashSales = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          products:flash_sale_products(
            *,
            product:products(name, price, images)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFlashSales(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch flash sales: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const saveFlashSale = async () => {
    try {
      if (!editingFlashSale.name || !editingFlashSale.start_time || !editingFlashSale.end_time) {
        toast.error('Please fill in all required fields')
        return
      }

      const data = {
        name: editingFlashSale.name,
        description: editingFlashSale.description || '',
        start_time: editingFlashSale.start_time,
        end_time: editingFlashSale.end_time,
        is_active: editingFlashSale.is_active !== undefined ? editingFlashSale.is_active : true,
        updated_at: new Date().toISOString(),
      }

      if (editingFlashSale.id) {
        const { error } = await supabase
          .from('flash_sales')
          .update(data)
          .eq('id', editingFlashSale.id)

        if (error) throw error
        toast.success('Flash sale updated')
      } else {
        const { error } = await supabase
          .from('flash_sales')
          .insert({
            ...data,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        toast.success('Flash sale created')
      }

      setShowDialog(false)
      setEditingFlashSale({})
      fetchFlashSales()
    } catch (error: any) {
      toast.error('Failed to save flash sale: ' + error.message)
    }
  }

  const deleteFlashSale = async () => {
    if (!flashSaleToDelete) return
    try {
      // Delete products first
      await supabase
        .from('flash_sale_products')
        .delete()
        .eq('flash_sale_id', flashSaleToDelete)

      // Delete flash sale
      const { error } = await supabase
        .from('flash_sales')
        .delete()
        .eq('id', flashSaleToDelete)

      if (error) throw error
      toast.success('Flash sale deleted')
      fetchFlashSales()
      setShowDeleteDialog(false)
      setFlashSaleToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete flash sale: ' + error.message)
    }
  }

  const filteredFlashSales = flashSales.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredFlashSales.length / itemsPerPage)
  const paginatedFlashSales = filteredFlashSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Flash Sales</h2>
          <p className="text-gray-500">Manage time-limited promotions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFlashSales}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingFlashSale({})
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Flash Sale
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Flash Sales', value: flashSales.length, icon: Flame, color: 'text-red-600' },
          { label: 'Active', value: flashSales.filter(f => f.is_active).length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Inactive', value: flashSales.filter(f => !f.is_active).length, icon: XCircle, color: 'text-gray-600' },
          { label: 'Products', value: flashSales.reduce((sum, f) => sum + (f.products?.length || 0), 0), icon: Package, color: 'text-blue-600' },
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
          placeholder="Search flash sales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Flash Sales Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : paginatedFlashSales.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No flash sales found
          </div>
        ) : (
          paginatedFlashSales.map((flashSale) => (
            <motion.div
              key={flashSale.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium">{flashSale.name}</h3>
                    </div>
                    <Badge className={flashSale.is_active ? 'bg-green-600' : 'bg-red-600'}>
                      {flashSale.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {flashSale.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(flashSale.start_time).toLocaleDateString()}
                    </span>
                    <span>→</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(flashSale.end_time).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {flashSale.products?.length || 0} products
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingFlashSale(flashSale)
                        setShowDialog(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setFlashSaleToDelete(flashSale.id)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFlashSales.length)} of {filteredFlashSales.length}
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

      {/* Flash Sale Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFlashSale.id ? 'Edit Flash Sale' : 'Create Flash Sale'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingFlashSale.name || ''}
                onChange={(e) => setEditingFlashSale({ ...editingFlashSale, name: e.target.value })}
                placeholder="24-Hour Flash Sale"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editingFlashSale.description || ''}
                onChange={(e) => setEditingFlashSale({ ...editingFlashSale, description: e.target.value })}
                placeholder="Massive discounts for 24 hours!"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={editingFlashSale.start_time || ''}
                  onChange={(e) => setEditingFlashSale({ ...editingFlashSale, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={editingFlashSale.end_time || ''}
                  onChange={(e) => setEditingFlashSale({ ...editingFlashSale, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingFlashSale.is_active !== undefined ? editingFlashSale.is_active : true}
                onCheckedChange={(checked) => setEditingFlashSale({ ...editingFlashSale, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveFlashSale}
              >
                {editingFlashSale.id ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDialog(false)
                  setEditingFlashSale({})
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this flash sale and all its products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFlashSale} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}