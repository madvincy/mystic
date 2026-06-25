// src/components/admin/ShippingManagement.tsx
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
  Truck,
  RefreshCw,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Package,
  Globe,
  Map,
  Warehouse,
  Mail,
  Phone
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

interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimated_days: string
  is_active: boolean
  is_free: boolean
  min_order_amount: number
  max_weight: number
  regions: string[]
  created_at: string
  updated_at: string
}

interface ShippingRegion {
  id: string
  name: string
  code: string
  countries: string[]
  shipping_method_id: string
  price_multiplier: number
  is_active: boolean
}

export default function ShippingManagement() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [shippingRegions, setShippingRegions] = useState<ShippingRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingMethod, setEditingMethod] = useState<Partial<ShippingMethod>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null)
  const [showRegionDialog, setShowRegionDialog] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Partial<ShippingRegion>>({})

  const itemsPerPage = 10

  useEffect(() => {
    fetchShippingMethods()
    fetchShippingRegions()
  }, [])

  const fetchShippingMethods = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error
      setShippingMethods(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch shipping methods: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchShippingRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_regions')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setShippingRegions(data || [])
    } catch (error: any) {
      console.error('Error fetching shipping regions:', error)
    }
  }

  const saveShippingMethod = async () => {
    try {
      if (!editingMethod.name || editingMethod.price === undefined) {
        toast.error('Name and price are required')
        return
      }

      const data = {
        name: editingMethod.name,
        description: editingMethod.description || '',
        price: editingMethod.price,
        estimated_days: editingMethod.estimated_days || '3-5 business days',
        is_active: editingMethod.is_active !== undefined ? editingMethod.is_active : true,
        is_free: editingMethod.is_free || false,
        min_order_amount: editingMethod.min_order_amount || 0,
        max_weight: editingMethod.max_weight || 100,
        regions: editingMethod.regions || [],
        updated_at: new Date().toISOString(),
      }

      if (editingMethod.id) {
        const { error } = await supabase
          .from('shipping_methods')
          .update(data)
          .eq('id', editingMethod.id)

        if (error) throw error
        toast.success('Shipping method updated')
      } else {
        const { error } = await supabase
          .from('shipping_methods')
          .insert({
            ...data,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        toast.success('Shipping method created')
      }

      setShowDialog(false)
      setEditingMethod({})
      fetchShippingMethods()
    } catch (error: any) {
      toast.error('Failed to save shipping method: ' + error.message)
    }
  }

  const deleteShippingMethod = async () => {
    if (!methodToDelete) return
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', methodToDelete)

      if (error) throw error
      toast.success('Shipping method deleted')
      fetchShippingMethods()
      setShowDeleteDialog(false)
      setMethodToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete shipping method: ' + error.message)
    }
  }

  const toggleMethodStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`Shipping method ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchShippingMethods()
    } catch (error: any) {
      toast.error('Failed to update shipping method: ' + error.message)
    }
  }

  const filteredMethods = shippingMethods.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredMethods.length / itemsPerPage)
  const paginatedMethods = filteredMethods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get regions for a specific method
  const getRegionsForMethod = (methodId: string) => {
    return shippingRegions.filter(r => r.shipping_method_id === methodId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Shipping Management</h2>
          <p className="text-gray-500">Manage shipping methods and regions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchShippingMethods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingMethod({})
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Shipping Method
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Methods', value: shippingMethods.length, icon: Truck, color: 'text-blue-600' },
          { label: 'Active', value: shippingMethods.filter(m => m.is_active).length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Free Shipping', value: shippingMethods.filter(m => m.is_free).length, icon: DollarSign, color: 'text-purple-600' },
          { label: 'Regions', value: shippingRegions.length, icon: Globe, color: 'text-orange-600' },
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
          placeholder="Search shipping methods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Shipping Methods Grid */}
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
        ) : paginatedMethods.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No shipping methods found
          </div>
        ) : (
          paginatedMethods.map((method) => {
            const methodRegions = getRegionsForMethod(method.id)
            return (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-pink-600" />
                        <h3 className="font-medium">{method.name}</h3>
                      </div>
                      <Badge className={method.is_active ? 'bg-green-600' : 'bg-red-600'}>
                        {method.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {method.description || 'No description'}
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Price</span>
                        {method.is_free ? (
                          <span className="font-bold text-green-600">FREE</span>
                        ) : (
                          <span className="font-bold">KSh {method.price.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Estimated Delivery</span>
                        <span>{method.estimated_days}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Min Order</span>
                        <span>KSh {method.min_order_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Regions</span>
                        <span className="text-pink-600">{methodRegions.length} regions</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingMethod(method)
                          setShowDialog(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant={method.is_active ? "destructive" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleMethodStatus(method.id, method.is_active)}
                      >
                        {method.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setMethodToDelete(method.id)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMethods.length)} of {filteredMethods.length}
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

      {/* Shipping Method Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMethod.id ? 'Edit Shipping Method' : 'Add Shipping Method'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingMethod.name || ''}
                onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                placeholder="Standard Shipping"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingMethod.description || ''}
                onChange={(e) => setEditingMethod({ ...editingMethod, description: e.target.value })}
                placeholder="Standard delivery within 3-5 business days"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (KSh) *</Label>
                <Input
                  type="number"
                  value={editingMethod.price || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, price: parseFloat(e.target.value) })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order Amount</Label>
                <Input
                  type="number"
                  value={editingMethod.min_order_amount || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, min_order_amount: parseFloat(e.target.value) })}
                  placeholder="5000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Weight (kg)</Label>
                <Input
                  type="number"
                  value={editingMethod.max_weight || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, max_weight: parseFloat(e.target.value) })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Delivery</Label>
                <Input
                  value={editingMethod.estimated_days || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, estimated_days: e.target.value })}
                  placeholder="3-5 business days"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingMethod.is_active !== undefined ? editingMethod.is_active : true}
                  onCheckedChange={(checked) => setEditingMethod({ ...editingMethod, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingMethod.is_free || false}
                  onCheckedChange={(checked) => setEditingMethod({ ...editingMethod, is_free: checked })}
                />
                <Label>Free Shipping</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveShippingMethod}
              >
                {editingMethod.id ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDialog(false)
                  setEditingMethod({})
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
            <AlertDialogTitle>Delete Shipping Method?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shipping method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteShippingMethod} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}