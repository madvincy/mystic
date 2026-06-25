// src/components/admin/InventoryManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Edit,
  Plus,
  Minus,
  Grid,
  List,
  Badge
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/shadCn/ui/button'
import { Dialog, DialogHeader } from '@/components/shadCn/ui/dialog'
import { Input } from '@/components/shadCn/ui/input'
import { supabase } from '@/lib/supabase/client'
import { DialogContent, DialogTitle } from '@radix-ui/react-dialog'

interface InventoryItem {
  id: string
  product_id: string
  variant_type: string
  variant_value: string
  stock: number
  price: number
  sku: string
  product: {
    name: string
    images: string[]
    price: number
  }
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [bulkStockValue, setBulkStockValue] = useState(0)
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  const itemsPerPage = 10

  // ✅ Responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 640)
      setIsTablet(width >= 640 && width < 1024)
      // Auto-set view mode based on screen size
      if (width < 768) {
        setViewMode('grid')
      } else {
        setViewMode('table')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          variant_type,
          variant_value,
          stock,
          price,
          sku,
          product:products(name, images, price)
        `)
        .order('stock', { ascending: true })

      if (error) throw error
      
      const transformedData = data?.map(item => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product
      })) || []
      
      setItems(transformedData)
    } catch (error: any) {
      toast.error('Failed to fetch inventory: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (id: string, newStock: number) => {
    if (newStock < 0) return
    setUpdating(prev => ({ ...prev, [id]: true }))
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', id)

      if (error) throw error
      toast.success('Stock updated')
      setItems(items.map(item => item.id === id ? { ...item, stock: newStock } : item))
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message)
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }))
    }
  }

  const exportInventory = async () => {
    try {
      const headers = ['Product', 'Variant Type', 'Variant Value', 'Stock', 'Price', 'SKU']
      const csvRows = [
        headers.join(','),
        ...items.map(item => [
          `"${item.product?.name || ''}"`,
          `"${item.variant_type || ''}"`,
          `"${item.variant_value || 'Default'}"`,
          item.stock,
          item.product?.price || 0,
          `"${item.sku || ''}"`
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Inventory exported')
    } catch (error: any) {
      toast.error('Failed to export: ' + error.message)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variant_value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variant_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLowStock = filterLowStock ? item.stock < lowStockThreshold : true
    return matchesSearch && matchesLowStock
  })

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0)
  const lowStockItems = items.filter(item => item.stock < lowStockThreshold)
  const outOfStockItems = items.filter(item => item.stock === 0)

  const stats = [
    { label: 'Total Items', value: items.length, icon: Package, color: 'text-blue-600' },
    { label: 'Total Stock', value: totalStock, icon: Package, color: 'text-green-600' },
    { label: 'Low Stock', value: lowStockItems.length, icon: AlertTriangle, color: 'text-yellow-600' },
    { label: 'Out of Stock', value: outOfStockItems.length, icon: AlertTriangle, color: 'text-red-600' },
  ]

  // ✅ Responsive grid columns
  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1'
    if (isTablet) return 'grid-cols-2'
    return 'grid-cols-3 lg:grid-cols-4'
  }

  // ✅ Responsive stats grid
  const getStatsCols = () => {
    if (isMobile) return 'grid-cols-2'
    return 'grid-cols-2 md:grid-cols-4'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Inventory Management</h2>
          <p className="text-sm text-gray-500">Manage product stock levels</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportInventory} className="text-xs sm:text-sm">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Export</span>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchInventory} className="text-xs sm:text-sm">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats - Responsive */}
      <div className={`grid ${getStatsCols()} gap-3 sm:gap-4`}>
        {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters - Responsive */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search inventory..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 sm:pl-10 text-sm" 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={filterLowStock ? 'default' : 'outline'} onClick={() => setFilterLowStock(!filterLowStock)} className={`${filterLowStock ? 'bg-yellow-600 hover:bg-yellow-700' : ''} text-xs sm:text-sm`}>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Low Stock</span>
          </Button>
          <Input 
            type="number" 
            value={lowStockThreshold} 
            onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)} 
            className="w-16 sm:w-20 text-center text-sm" 
            min={1} 
          />
          {!isMobile && (
            <div className="flex gap-1">
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'bg-pink-600' : ''}>
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-pink-600' : ''}>
                <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Responsive Table with horizontal scroll on mobile */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={7} className="px-3 sm:px-6 py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto" /></td></tr>
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 sm:px-6 py-8 text-center text-gray-500">No inventory found</td></tr>
                ) : (
                  paginatedItems.map((item) => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            <img src={item.product?.images?.[0] || '/images/placeholder.jpg'} alt={item.product?.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">{item.product?.name}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div>
                          <span className="text-xs sm:text-sm font-medium">{item.variant_value}</span>
                          <span className="text-xs text-gray-500 ml-1">({item.variant_type})</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{item.sku || '-'}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">KSh {item.price?.toLocaleString() || 0}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button variant="outline" size="sm" onClick={() => updateStock(item.id, item.stock - 1)} disabled={updating[item.id] || item.stock <= 0} className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Input type="number" value={item.stock} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 0) updateStock(item.id, val); }} className="w-14 sm:w-20 text-center text-sm" min={0} />
                          <Button variant="outline" size="sm" onClick={() => updateStock(item.id, item.stock + 1)} disabled={updating[item.id]} className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        {item.stock === 0 ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">Out of Stock</Badge>
                        ) : item.stock < lowStockThreshold ? (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">In Stock</Badge>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setBulkStockValue(item.stock); setShowStockDialog(true); }} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="flex items-center px-2 sm:px-3 text-xs sm:text-sm">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // ✅ Responsive Grid View
        <div className={`grid ${getGridCols()} gap-3 sm:gap-4`}>
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))
          ) : paginatedItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">No inventory found</div>
          ) : (
            paginatedItems.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                  <img src={item.product?.images?.[0] || '/images/placeholder.jpg'} alt={item.product?.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    {item.stock === 0 ? (
                      <Badge className="bg-red-600 text-xs">Out of Stock</Badge>
                    ) : item.stock < lowStockThreshold ? (
                      <Badge className="bg-yellow-600 text-xs">Low Stock</Badge>
                    ) : (
                      <Badge className="bg-green-600 text-xs">In Stock</Badge>
                    )}
                  </div>
                </div>
                <div className="p-2 sm:p-3">
                  <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                  <p className="text-xs text-gray-500">{item.variant_value} <span className="text-xs">({item.variant_type})</span></p>
                  <p className="text-xs text-gray-400">SKU: {item.sku || '-'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold">KSh {item.price?.toLocaleString() || 0}</span>
                    <span className="text-sm font-bold text-pink-600">{item.stock} units</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setSelectedItem(item); setBulkStockValue(item.stock); setShowStockDialog(true); }}>
                      <Edit className="h-3 w-3 mr-1" /> Update
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Stock Update Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedItem?.product?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Current Stock: {selectedItem?.stock}</p>
              <Input type="number" value={bulkStockValue} onChange={(e) => setBulkStockValue(parseInt(e.target.value) || 0)} min={0} className="mt-2" />
            </div>
            <Button onClick={() => { if (selectedItem) { updateStock(selectedItem.id, bulkStockValue); setShowStockDialog(false); } }} className="w-full bg-pink-600 hover:bg-pink-700">
              Update Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}