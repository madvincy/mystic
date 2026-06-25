// src/components/admin/CategoriesManagement.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  FolderTree,
  RefreshCw,
  Layers,
  Upload,
  X,
  Image as ImageIcon
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadCn/ui/tabs'
import { Label } from '@/components/shadCn/ui/label'
import { Textarea } from '@/components/shadCn/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadCn/ui/select'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  image_url: string
  parent_id: string | null
  created_at: string
  updated_at: string
  product_count: number
}

interface Subcategory {
  id: string
  name: string
  slug: string
  category_id: string
  description: string
  image_url: string
  created_at: string
  updated_at: string
  product_count: number
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

export default function CategoriesManagement() {
  // ✅ ALL HOOKS AT THE TOP
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('categories')
  const [uploading, setUploading] = useState(false)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string>('')
  const [subcategoryImagePreview, setSubcategoryImagePreview] = useState<string>('')
  
  // Category state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({})
  const [showCategoryDeleteDialog, setShowCategoryDeleteDialog] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  
  // Subcategory state
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<Subcategory>>({})
  const [showSubcategoryDeleteDialog, setShowSubcategoryDeleteDialog] = useState(false)
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<string | null>(null)

  // File input refs
  const categoryFileInputRef = useRef<HTMLInputElement>(null)
  const subcategoryFileInputRef = useRef<HTMLInputElement>(null)

  const itemsPerPage = 10

  // ✅ FETCH FUNCTIONS
  const fetchCategories = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesError) throw categoriesError

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('category_id')

      if (productsError) throw productsError

      const productCounts: Record<string, number> = {}
      productsData?.forEach(product => {
        if (product.category_id) {
          productCounts[product.category_id] = (productCounts[product.category_id] || 0) + 1
        }
      })

      const categoriesWithCounts = (categoriesData || []).map(category => ({
        ...category,
        product_count: productCounts[category.id] || 0
      }))

      setCategories(categoriesWithCounts)
    } catch (error: any) {
      toast.error('Failed to fetch categories: ' + error.message)
    }
  }, [])

  const fetchSubcategories = useCallback(async () => {
    try {
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .order('name')

      if (subcategoriesError) throw subcategoriesError

      const categoryIds = subcategoriesData?.map(s => s.category_id).filter(Boolean) || []
      let categoryMap: Record<string, { id: string; name: string; slug: string }> = {}
      
      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, slug')
          .in('id', categoryIds)

        if (!categoriesError && categoriesData) {
          categoryMap = categoriesData.reduce((acc, cat) => {
            acc[cat.id] = cat
            return acc
          }, {} as Record<string, { id: string; name: string; slug: string }>)
        }
      }

      const { data: productSubcategoriesData, error: productSubError } = await supabase
        .from('products')
        .select('subcategory_id')

      if (productSubError) throw productSubError

      const productCounts: Record<string, number> = {}
      productSubcategoriesData?.forEach(product => {
        if (product.subcategory_id) {
          productCounts[product.subcategory_id] = (productCounts[product.subcategory_id] || 0) + 1
        }
      })

      const subcategoriesWithCounts = (subcategoriesData || []).map(subcategory => ({
        ...subcategory,
        product_count: productCounts[subcategory.id] || 0,
        category: subcategory.category_id ? categoryMap[subcategory.category_id] || null : null
      }))

      setSubcategories(subcategoriesWithCounts)
    } catch (error: any) {
      toast.error('Failed to fetch subcategories: ' + error.message)
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCategories(),
        fetchSubcategories()
      ])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [fetchCategories, fetchSubcategories])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ✅ IMAGE UPLOAD HANDLERS
  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `category-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('category-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(fileName)

      setCategoryImagePreview(publicUrl)
      setEditingCategory(prev => ({
        ...prev,
        image_url: publicUrl
      }))
      
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message)
    } finally {
      setUploading(false)
      if (categoryFileInputRef.current) {
        categoryFileInputRef.current.value = ''
      }
    }
  }

  const handleSubcategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `subcategory-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('category-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(fileName)

      setSubcategoryImagePreview(publicUrl)
      setEditingSubcategory(prev => ({
        ...prev,
        image_url: publicUrl
      }))
      
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message)
    } finally {
      setUploading(false)
      if (subcategoryFileInputRef.current) {
        subcategoryFileInputRef.current.value = ''
      }
    }
  }

  const removeCategoryImage = () => {
    setCategoryImagePreview('')
    setEditingCategory(prev => ({
      ...prev,
      image_url: ''
    }))
  }

  const removeSubcategoryImage = () => {
    setSubcategoryImagePreview('')
    setEditingSubcategory(prev => ({
      ...prev,
      image_url: ''
    }))
  }

  // ✅ Category CRUD Operations - FIXED with proper trigger handling
  const saveCategory = async () => {
    try {
      if (!editingCategory.name) {
        toast.error('Category name is required')
        return
      }

      // ✅ Get the image URL from state
      const imageUrl = editingCategory.image_url || categoryImagePreview || ''
      console.log('📸 Saving category with image URL:', imageUrl)

      // ✅ Build data WITHOUT updated_at (trigger will handle it)
      const data = {
        name: editingCategory.name.trim(),
        slug: editingCategory.slug?.trim() || editingCategory.name.toLowerCase().trim().replace(/\s+/g, '-'),
        description: editingCategory.description || '',
        image_url: imageUrl,
        parent_id: editingCategory.parent_id || null,
      }

      console.log('📦 Category data to save:', data)

      let result
      if (editingCategory.id) {
        // ✅ UPDATE - trigger handles updated_at
        const { data: updated, error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editingCategory.id)
          .select()

        if (error) {
          console.error('❌ Update error:', error)
          throw error
        }
        
        result = updated
        console.log('✅ Category updated:', result)
        toast.success('Category updated successfully')
      } else {
        // ✅ INSERT - include created_at
        const { data: created, error } = await supabase
          .from('categories')
          .insert({
            ...data,
            created_at: new Date().toISOString(),
          })
          .select()

        if (error) {
          console.error('❌ Insert error:', error)
          throw error
        }
        
        result = created
        console.log('✅ Category created:', result)
        toast.success('Category created successfully')
      }

      // ✅ Verify the image_url was saved
      if (result && result.length > 0) {
        console.log('✅ Saved category:', result[0])
        console.log('✅ Image URL in DB:', result[0].image_url)
      }

      setShowCategoryDialog(false)
      setEditingCategory({})
      setCategoryImagePreview('')
      await fetchCategories()
    } catch (error: any) {
      console.error('❌ Save category error:', error)
      toast.error('Failed to save category: ' + error.message)
    }
  }

  const deleteCategory = async () => {
    if (!categoryToDelete) return
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete)

      if (error) throw error
      toast.success('Category deleted successfully')
      await fetchCategories()
      setShowCategoryDeleteDialog(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete category: ' + error.message)
    }
  }

  // ✅ Subcategory CRUD Operations - FIXED with proper trigger handling
  const saveSubcategory = async () => {
    try {
      if (!editingSubcategory.name) {
        toast.error('Subcategory name is required')
        return
      }
      if (!editingSubcategory.category_id) {
        toast.error('Please select a parent category')
        return
      }

      // ✅ Get the image URL from state
      const imageUrl = editingSubcategory.image_url || subcategoryImagePreview || ''
      console.log('📸 Saving subcategory with image URL:', imageUrl)

      // ✅ Build data WITHOUT updated_at (trigger will handle it)
      const data = {
        name: editingSubcategory.name.trim(),
        slug: editingSubcategory.slug?.trim() || editingSubcategory.name.toLowerCase().trim().replace(/\s+/g, '-'),
        category_id: editingSubcategory.category_id,
        description: editingSubcategory.description || '',
        image_url: imageUrl,
      }

      console.log('📦 Subcategory data to save:', data)

      let result
      if (editingSubcategory.id) {
        // ✅ UPDATE - trigger handles updated_at
        const { data: updated, error } = await supabase
          .from('subcategories')
          .update(data)
          .eq('id', editingSubcategory.id)
          .select()

        if (error) {
          console.error('❌ Update error:', error)
          throw error
        }
        
        result = updated
        console.log('✅ Subcategory updated:', result)
        toast.success('Subcategory updated successfully')
      } else {
        // ✅ INSERT - include created_at
        const { data: created, error } = await supabase
          .from('subcategories')
          .insert({
            ...data,
            created_at: new Date().toISOString(),
          })
          .select()

        if (error) {
          console.error('❌ Insert error:', error)
          throw error
        }
        
        result = created
        console.log('✅ Subcategory created:', result)
        toast.success('Subcategory created successfully')
      }

      // ✅ Verify the image_url was saved
      if (result && result.length > 0) {
        console.log('✅ Saved subcategory:', result[0])
        console.log('✅ Image URL in DB:', result[0].image_url)
      }

      setShowSubcategoryDialog(false)
      setEditingSubcategory({})
      setSubcategoryImagePreview('')
      await fetchSubcategories()
    } catch (error: any) {
      console.error('❌ Save subcategory error:', error)
      toast.error('Failed to save subcategory: ' + error.message)
    }
  }

  const deleteSubcategory = async () => {
    if (!subcategoryToDelete) return
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryToDelete)

      if (error) throw error
      toast.success('Subcategory deleted successfully')
      await fetchSubcategories()
      setShowSubcategoryDeleteDialog(false)
      setSubcategoryToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete subcategory: ' + error.message)
    }
  }

  // Filtering and pagination
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSubcategories = subcategories.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(
    (activeTab === 'categories' ? filteredCategories.length : filteredSubcategories.length) / itemsPerPage
  )
  
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const paginatedSubcategories = filteredSubcategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Categories & Subcategories</h2>
          <p className="text-gray-500">Manage product categories and subcategories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {activeTab === 'categories' ? (
            <Button 
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => {
                setEditingCategory({})
                setCategoryImagePreview('')
                setShowCategoryDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          ) : (
            <Button 
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => {
                setEditingSubcategory({})
                setSubcategoryImagePreview('')
                setShowSubcategoryDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subcategory
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        setCurrentPage(1)
        setSearchTerm('')
      }}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="subcategories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Subcategories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : paginatedCategories.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {searchTerm ? 'No categories found matching your search' : 'No categories created yet'}
              </div>
            ) : (
              paginatedCategories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="relative h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                        {category.image_url ? (
                          <img 
                            src={category.image_url} 
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderTree className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2 bg-black/50">
                          {category.product_count || 0} products
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {category.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Slug: {category.slug}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingCategory(category)
                            setCategoryImagePreview(category.image_url || '')
                            setShowCategoryDialog(true)
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
                            setCategoryToDelete(category.id)
                            setShowCategoryDeleteDialog(true)
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
        </TabsContent>

        <TabsContent value="subcategories" className="mt-6">
          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : paginatedSubcategories.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {searchTerm ? 'No subcategories found matching your search' : 'No subcategories created yet'}
              </div>
            ) : (
              paginatedSubcategories.map((subcategory) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="relative h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                        {subcategory.image_url ? (
                          <img 
                            src={subcategory.image_url} 
                            alt={subcategory.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Layers className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2 bg-black/50">
                          {subcategory.product_count || 0} products
                        </Badge>
                        <Badge className="absolute top-2 left-2 bg-purple-600 text-xs">
                          {subcategory.category?.name || 'Uncategorized'}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-medium">{subcategory.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {subcategory.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Slug: {subcategory.slug}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingSubcategory(subcategory)
                            setSubcategoryImagePreview(subcategory.image_url || '')
                            setShowSubcategoryDialog(true)
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
                            setSubcategoryToDelete(subcategory.id)
                            setShowSubcategoryDeleteDialog(true)
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
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
              currentPage * itemsPerPage, 
              activeTab === 'categories' ? filteredCategories.length : filteredSubcategories.length
            )} of {activeTab === 'categories' ? filteredCategories.length : filteredSubcategories.length}
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

      {/* Category Dialog with Image Upload */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory.id ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingCategory.name || ''}
                onChange={(e) => {
                  const name = e.target.value
                  setEditingCategory({ 
                    ...editingCategory, 
                    name,
                    slug: editingCategory.slug || name.toLowerCase().replace(/\s+/g, '-')
                  })
                }}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={editingCategory.slug || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                placeholder="auto-generated from name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingCategory.description || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                placeholder="Category description"
                rows={3}
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={categoryFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => categoryFileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {editingCategory.image_url && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={removeCategoryImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Image Preview */}
              {editingCategory.image_url && (
                <div className="relative mt-2 w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={editingCategory.image_url} 
                    alt="Category preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {/* Or enter URL */}
              <div className="mt-2">
                <Label className="text-xs text-gray-500">Or enter image URL</Label>
                <Input
                  value={editingCategory.image_url || ''}
                  onChange={(e) => {
                    const url = e.target.value
                    setEditingCategory(prev => ({ 
                      ...prev, 
                      image_url: url 
                    }))
                    setCategoryImagePreview(url)
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveCategory}
              >
                {editingCategory.id ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowCategoryDialog(false)
                  setEditingCategory({})
                  setCategoryImagePreview('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog with Image Upload */}
      <Dialog open={showSubcategoryDialog} onOpenChange={setShowSubcategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory.id ? 'Edit Subcategory' : 'Add Subcategory'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parent Category *</Label>
              <Select
                value={editingSubcategory.category_id || ''}
                onValueChange={(value) => setEditingSubcategory({ ...editingSubcategory, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingSubcategory.name || ''}
                onChange={(e) => {
                  const name = e.target.value
                  setEditingSubcategory({ 
                    ...editingSubcategory, 
                    name,
                    slug: editingSubcategory.slug || name.toLowerCase().replace(/\s+/g, '-')
                  })
                }}
                placeholder="Subcategory name"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={editingSubcategory.slug || ''}
                onChange={(e) => setEditingSubcategory({ ...editingSubcategory, slug: e.target.value })}
                placeholder="auto-generated from name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingSubcategory.description || ''}
                onChange={(e) => setEditingSubcategory({ ...editingSubcategory, description: e.target.value })}
                placeholder="Subcategory description"
                rows={3}
              />
            </div>

            {/* Image Upload Section for Subcategory */}
            <div className="space-y-2">
              <Label>Subcategory Image</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={subcategoryFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSubcategoryImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => subcategoryFileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {editingSubcategory.image_url && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={removeSubcategoryImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Image Preview */}
              {editingSubcategory.image_url && (
                <div className="relative mt-2 w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={editingSubcategory.image_url} 
                    alt="Subcategory preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {/* Or enter URL */}
              <div className="mt-2">
                <Label className="text-xs text-gray-500">Or enter image URL</Label>
                <Input
                  value={editingSubcategory.image_url || ''}
                  onChange={(e) => {
                    const url = e.target.value
                    setEditingSubcategory(prev => ({ 
                      ...prev, 
                      image_url: url 
                    }))
                    setSubcategoryImagePreview(url)
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveSubcategory}
              >
                {editingSubcategory.id ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowSubcategoryDialog(false)
                  setEditingSubcategory({})
                  setSubcategoryImagePreview('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation */}
      <AlertDialog open={showCategoryDeleteDialog} onOpenChange={setShowCategoryDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category and all associated subcategories and products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCategory} className="bg-red-600 hover:bg-red-700">
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subcategory Delete Confirmation */}
      <AlertDialog open={showSubcategoryDeleteDialog} onOpenChange={setShowSubcategoryDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subcategory and all associated products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSubcategory} className="bg-red-600 hover:bg-red-700">
              Delete Subcategory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}