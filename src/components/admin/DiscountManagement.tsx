// src/components/admin/DiscountsManagement.tsx
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
  Percent,
  RefreshCw,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
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

interface Discount {
  id: string
  name: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  code: string
  min_order_amount: number
  max_discount_amount: number
  start_date: string
  end_date: string
  is_active: boolean
  usage_limit: number
  used_count: number
  created_at: string
}

export default function DiscountsManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Partial<Discount>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const fetchDiscounts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiscounts(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch discounts: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const saveDiscount = async () => {
    try {
      if (!editingDiscount.name || !editingDiscount.code || !editingDiscount.discount_value) {
        toast.error('Please fill in all required fields')
        return
      }

      const data = {
        name: editingDiscount.name,
        description: editingDiscount.description || '',
        discount_type: editingDiscount.discount_type || 'percentage',
        discount_value: editingDiscount.discount_value,
        code: editingDiscount.code.toUpperCase(),
        min_order_amount: editingDiscount.min_order_amount || 0,
        max_discount_amount: editingDiscount.max_discount_amount || 0,
        start_date: editingDiscount.start_date || new Date().toISOString(),
        end_date: editingDiscount.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: editingDiscount.is_active !== undefined ? editingDiscount.is_active : true,
        usage_limit: editingDiscount.usage_limit || null,
        updated_at: new Date().toISOString(),
      }

      if (editingDiscount.id) {
        const { error } = await supabase
          .from('discounts')
          .update(data)
          .eq('id', editingDiscount.id)

        if (error) throw error
        toast.success('Discount updated')
      } else {
        const { error } = await supabase
          .from('discounts')
          .insert({
            ...data,
            used_count: 0,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        toast.success('Discount created')
      }

      setShowDialog(false)
      setEditingDiscount({})
      fetchDiscounts()
    } catch (error: any) {
      toast.error('Failed to save discount: ' + error.message)
    }
  }

  const deleteDiscount = async () => {
    if (!discountToDelete) return
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountToDelete)

      if (error) throw error
      toast.success('Discount deleted')
      fetchDiscounts()
      setShowDeleteDialog(false)
      setDiscountToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete discount: ' + error.message)
    }
  }

  const toggleDiscountStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('discounts')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`Discount ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchDiscounts()
    } catch (error: any) {
      toast.error('Failed to update discount: ' + error.message)
    }
  }

  const filteredDiscounts = discounts.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredDiscounts.length / itemsPerPage)
  const paginatedDiscounts = filteredDiscounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Discounts</h2>
          <p className="text-gray-500">Manage discount codes and promotions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDiscounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingDiscount({})
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Discount
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Discounts', value: discounts.length, icon: Percent, color: 'text-blue-600' },
          { label: 'Active', value: discounts.filter(d => d.is_active).length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Inactive', value: discounts.filter(d => !d.is_active).length, icon: XCircle, color: 'text-red-600' },
          { label: 'Expired', value: discounts.filter(d => new Date(d.end_date) < new Date()).length, icon: Clock, color: 'text-gray-600' },
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
          placeholder="Search discounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Discounts Grid */}
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
        ) : paginatedDiscounts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No discounts found
          </div>
        ) : (
          paginatedDiscounts.map((discount) => (
            <motion.div
              key={discount.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{discount.name}</h3>
                      <p className="text-sm text-gray-500">{discount.description}</p>
                    </div>
                    <Badge className={discount.is_active ? 'bg-green-600' : 'bg-red-600'}>
                      {discount.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-mono">
                        {discount.code}
                      </Badge>
                      {discount.discount_type === 'percentage' ? (
                        <span className="text-pink-600 font-bold">{discount.discount_value}% OFF</span>
                      ) : (
                        <span className="text-pink-600 font-bold">KSh {discount.discount_value} OFF</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Min: KSh {discount.min_order_amount || 0}</span>
                      <span>•</span>
                      <span>Used: {discount.used_count || 0}/{discount.usage_limit || '∞'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(discount.start_date).toLocaleDateString()} - {new Date(discount.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingDiscount(discount)
                        setShowDialog(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant={discount.is_active ? "destructive" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleDiscountStatus(discount.id, discount.is_active)}
                    >
                      {discount.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDiscountToDelete(discount.id)
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDiscounts.length)} of {filteredDiscounts.length}
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

      {/* Discount Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount.id ? 'Edit Discount' : 'Add Discount'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingDiscount.name || ''}
                onChange={(e) => setEditingDiscount({ ...editingDiscount, name: e.target.value })}
                placeholder="Weekend Special"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editingDiscount.description || ''}
                onChange={(e) => setEditingDiscount({ ...editingDiscount, description: e.target.value })}
                placeholder="20% off all wines"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <select
                  value={editingDiscount.discount_type || 'percentage'}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  type="number"
                  value={editingDiscount.discount_value || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, discount_value: parseFloat(e.target.value) })}
                  placeholder={editingDiscount.discount_type === 'percentage' ? '20' : '500'}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Promo Code *</Label>
              <Input
                value={editingDiscount.code || ''}
                onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Order Amount</Label>
                <Input
                  type="number"
                  value={editingDiscount.min_order_amount || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, min_order_amount: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Discount Amount</Label>
                <Input
                  type="number"
                  value={editingDiscount.max_discount_amount || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, max_discount_amount: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={editingDiscount.start_date || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={editingDiscount.end_date || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Usage Limit</Label>
              <Input
                type="number"
                value={editingDiscount.usage_limit || ''}
                onChange={(e) => setEditingDiscount({ ...editingDiscount, usage_limit: parseInt(e.target.value) })}
                placeholder="Unlimited"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingDiscount.is_active !== undefined ? editingDiscount.is_active : true}
                onCheckedChange={(checked) => setEditingDiscount({ ...editingDiscount, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveDiscount}
              >
                {editingDiscount.id ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDialog(false)
                  setEditingDiscount({})
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
              This will permanently delete this discount.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDiscount} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}