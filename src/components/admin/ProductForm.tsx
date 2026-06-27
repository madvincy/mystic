// src/components/admin/ProductForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/lib/store'
import { fetchProducts } from '@/lib/store/productSlice'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Textarea } from '@/components/shadCn/ui/textarea'
import { Label } from '@/components/shadCn/ui/label'
import { Switch } from '@/components/shadCn/ui/switch'
import { toast } from 'sonner'
import { Plus, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { clearAllCache } from '@/lib/db/indexedDB'

// ✅ Variant type options with display labels
const VARIANT_TYPE_OPTIONS = [
  {
    field_name: "volume",
    display_label: "Volume / Size",
    options: ["50ml", "187ml", "200ml", "375ml", "500ml", "750ml", "1L", "1.5L", "1.75L", "3L", "12oz", "16oz", "24oz", "64oz"]
  },
  {
    field_name: "container_type",
    display_label: "Container Type",
    options: ["Glass Bottle", "Aluminum Can", "Tetrapak Carton", "Bag-in-Box", "Keg", "Plastic Bottle", "Flask"]
  },
  {
    field_name: "pack_size",
    display_label: "Pack Size",
    options: ["Single", "2-Pack", "4-Pack", "6-Pack", "12-Pack", "18-Pack", "24-Pack Case", "30-Pack Case"]
  },
  {
    field_name: "color_finish",
    display_label: "Color / Finish",
    options: ["Clear", "Amber", "Dark", "Red", "White", "Rosé", "Stainless Steel", "Matte Black", "Brushed Gold", "Polished Copper"]
  },
  {
    field_name: "flavor_profile",
    display_label: "Flavor Profile",
    options: ["Original / Unflavored", "Citrus", "Berry", "Spiced", "Botanical", "Sweet", "Dry", "Smoky"]
  },
  {
    field_name: "material",
    display_label: "Material",
    options: ["Glass", "Crystal", "Stainless Steel", "Silicone", "Wood", "Leather", "Acrylic"]
  },
  {
    field_name: "vintage",
    display_label: "Wine Vintage",
    options: ["Non-Vintage", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]
  },
  {
    field_name: "apparel_size",
    display_label: "Apparel Size",
    options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "One Size Fits All"]
  },
  {
    field_name: "hat_style_fit",
    display_label: "Hat Style & Fit",
    options: ["Snapback", "Fitted (S/M)", "Fitted (L/XL)", "Adjustable Strap", "Beanie (One Size)", "Bucket Hat"]
  },
  {
    field_name: "apparel_style",
    display_label: "Apparel Style",
    options: ["Unisex T-Shirt", "Men's Cut T-Shirt", "Women's Cut T-Shirt", "Pullover Hoodie", "Zip-Up Hoodie", "Polo Shirt", "Tank Top", "Trucker Hat", "Baseball Cap"]
  }
]

// Helper function to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper function to make slug unique
const makeSlugUnique = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug
  let counter = 1
  let isUnique = false

  while (!isUnique) {
    let query = supabase
      .from('products')
      .select('slug', { count: 'exact', head: true })
      .eq('slug', slug)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { count, error } = await query
    
    if (error) {
      console.error('Error checking slug uniqueness:', error)
      isUnique = true
      break
    }
    
    if (count === 0) {
      isUnique = true
    } else {
      slug = `${baseSlug}-${counter}`
      counter++
    }
  }
  
  return slug
}

// Helper function to clean image array
const cleanImageArray = (images: string[]): string[] => {
  return images
    .filter(url => url && typeof url === 'string' && url.trim() !== '')
    .map(url => url.trim())
}

// Updated Zod schema with product_type and abv
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  category_id: z.string().min(1, 'Category is required'),
  subcategory_id: z.string().optional().nullable(),
  product_type: z.enum(['alcoholic', 'non_alcoholic', 'non_applicable']).default('non_applicable'),
  abv: z.number().min(0, 'ABV must be between 0 and 100').max(100, 'ABV must be between 0 and 100').optional().nullable(),
  is_featured: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  is_new: z.boolean().default(false),
  stock_status: z.enum(['in_stock', 'out_of_stock', 'pre_order']),
  images: z.array(z.string()).default([]),
  variants: z.array(z.object({
    variant_type: z.string().min(1, 'Variant type is required'),
    variant_value: z.string().min(1, 'Variant value is required'),
    price: z.number().min(0, 'Price must be positive'),
    stock: z.number().min(0, 'Stock must be positive'),
    sku: z.string().optional(),
    abv: z.number().min(0, 'ABV must be between 0 and 100').max(100, 'ABV must be between 0 and 100').optional().nullable(),
  })).default([]),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (initialData?.images && Array.isArray(initialData.images)) {
      return cleanImageArray(initialData.images)
    }
    return []
  })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isSlugAutoGenerated, setIsSlugAutoGenerated] = useState(true)

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      ...initialData,
      subcategory_id: initialData.subcategory_id || undefined,
      product_type: initialData.product_type || 'non_applicable',
      abv: initialData.abv || null,
      variants: initialData.variants || [],
      images: cleanImageArray(initialData.images || []),
    } : {
      stock_status: 'in_stock',
      is_featured: false,
      is_bestseller: false,
      is_new: false,
      product_type: 'non_applicable',
      abv: null,
      variants: [],
      slug: '',
      subcategory_id: undefined,
      images: [],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants'
  })

  const selectedCategory = watch('category_id')
  const productName = watch('name')
  const productType = watch('product_type')

  // Set initial values when editing
  useEffect(() => {
    if (initialData) {
      if (initialData.images && Array.isArray(initialData.images)) {
        setImageUrls(cleanImageArray(initialData.images))
        setValue('images', cleanImageArray(initialData.images))
      }
      
      const autoSlug = generateSlug(initialData.name)
      if (initialData.slug === autoSlug) {
        setIsSlugAutoGenerated(true)
      } else {
        setIsSlugAutoGenerated(false)
      }
      
      if (initialData.variants && Array.isArray(initialData.variants)) {
        initialData.variants.forEach((variant: any, index: number) => {
          setValue(`variants.${index}.variant_type`, variant.variant_type || '')
          setValue(`variants.${index}.variant_value`, variant.variant_value || '')
          setValue(`variants.${index}.price`, variant.price || 0)
          setValue(`variants.${index}.stock`, variant.stock || 0)
          setValue(`variants.${index}.sku`, variant.sku || '')
          setValue(`variants.${index}.abv`, variant.abv || null)
        })
      }
    }
  }, [initialData, setValue])

  useEffect(() => {
    const cleanedImages = cleanImageArray(imageUrls)
    setValue('images', cleanedImages)
  }, [imageUrls, setValue])

  useEffect(() => {
    if (isSlugAutoGenerated && productName && !initialData) {
      const newSlug = generateSlug(productName)
      setValue('slug', newSlug)
    }
  }, [productName, isSlugAutoGenerated, setValue, initialData])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      const fetchSubcategories = async () => {
        const { data } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', selectedCategory)
          .order('name')
        if (data) setSubcategories(data)
      }
      fetchSubcategories()
    } else {
      setSubcategories([])
    }
  }, [selectedCategory])

  // Auto-generate SKU for variants
  const generateSKU = (productName: string, variantValue: string, index: number): string => {
    const productPrefix = productName.substring(0, 3).toUpperCase()
    const variantPrefix = variantValue.substring(0, 3).toUpperCase()
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${productPrefix}-${variantPrefix}-${randomNum}`
  }

  // Get options for a variant type
  const getVariantOptions = (variantType: string) => {
    const found = VARIANT_TYPE_OPTIONS.find(opt => opt.field_name === variantType)
    return found ? found.options : []
  }

  // Get display label for variant type
  const getVariantDisplayLabel = (variantType: string) => {
    const found = VARIANT_TYPE_OPTIONS.find(opt => opt.field_name === variantType)
    return found ? found.display_label : 'Variant Type'
  }

  const addImage = () => {
    if (newImageUrl.trim()) {
      const updatedImages = [...imageUrls, newImageUrl.trim()]
      setImageUrls(updatedImages)
      setValue('images', cleanImageArray(updatedImages))
      setNewImageUrl('')
      toast.success('Image added')
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = imageUrls.filter((_, i) => i !== index)
    setImageUrls(updatedImages)
    setValue('images', cleanImageArray(updatedImages))
    toast.info('Image removed')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      const updatedImages = [...imageUrls, publicUrl]
      setImageUrls(updatedImages)
      setValue('images', cleanImageArray(updatedImages))
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image: ' + error.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // CREATE PRODUCT
  const createProduct = async (data: ProductFormData) => {
    try {
      let slug = data.slug
      if (!slug || slug.trim() === '') {
        slug = generateSlug(data.name)
      }
      
      const uniqueSlug = await makeSlugUnique(slug)
      const images = data.images || []

      const productData: any = {
        name: data.name,
        slug: uniqueSlug,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        product_type: data.product_type || 'non_applicable',
        is_featured: data.is_featured,
        is_bestseller: data.is_bestseller,
        is_new: data.is_new,
        stock_status: data.stock_status,
        images: images,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (data.product_type === 'alcoholic' && data.abv !== null && data.abv !== undefined) {
        productData.abv = data.abv
      }

      if (data.subcategory_id && data.subcategory_id !== '') {
        productData.subcategory_id = data.subcategory_id
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (productError) throw productError

      if (data.variants && data.variants.length > 0) {
        const variantsData = data.variants.map(variant => ({
          ...variant,
          product_id: product.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sku: variant.sku || generateSKU(data.name, variant.variant_value, 0),
        }))

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsData)

        if (variantsError) throw variantsError
      }

      return product
    } catch (error: any) {
      console.error('Create product error:', error)
      throw new Error(error.message || 'Failed to create product')
    }
  }

  // UPDATE PRODUCT
  const updateProduct = async (id: string, data: ProductFormData) => {
    try {
      let slug = data.slug
      if (!slug || slug.trim() === '') {
        slug = generateSlug(data.name)
      }
      
      if (initialData && slug !== initialData.slug) {
        const uniqueSlug = await makeSlugUnique(slug, id)
        slug = uniqueSlug
      }

      const images = data.images || []

      const productData: any = {
        name: data.name,
        slug: slug,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        product_type: data.product_type || 'non_applicable',
        is_featured: data.is_featured,
        is_bestseller: data.is_bestseller,
        is_new: data.is_new,
        stock_status: data.stock_status,
        images: images,
        updated_at: new Date().toISOString(),
      }

      if (data.product_type === 'alcoholic' && data.abv !== null && data.abv !== undefined) {
        productData.abv = data.abv
      }

      if (data.subcategory_id && data.subcategory_id !== '') {
        productData.subcategory_id = data.subcategory_id
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single()

      if (productError) throw productError

      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id)

      if (deleteError) throw deleteError

      if (data.variants && data.variants.length > 0) {
        const variantsData = data.variants.map((variant, index) => ({
          ...variant,
          product_id: id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sku: variant.sku || generateSKU(data.name, variant.variant_value, index),
        }))

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsData)

        if (variantsError) throw variantsError
      }

      return product
    } catch (error: any) {
      console.error('Update product error:', error)
      throw new Error(error.message || 'Failed to update product')
    }
  }

  // SUBMIT HANDLER
  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    try {
      const formData = {
        ...data,
        images: cleanImageArray(imageUrls),
      }
      
      if (initialData) {
        await updateProduct(initialData.id, formData)
        toast.success('Product updated successfully!')
      } else {
        await createProduct(formData)
        toast.success('Product created successfully!')
      }
      
      await clearAllCache()
      await dispatch(fetchProducts()).unwrap()
      
      toast.info('Products synced', { duration: 2000 })
      onSuccess?.()
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input 
            {...register('name')} 
            placeholder="Enter product name"
            value={watch('name') || initialData?.name || ''}
            onChange={(e) => {
              setValue('name', e.target.value)
              if (isSlugAutoGenerated) {
                const newSlug = generateSlug(e.target.value)
                setValue('slug', newSlug)
              }
            }}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Price *</Label>
          <Input 
            type="number" 
            step="0.01"
            {...register('price', { valueAsNumber: true })} 
            placeholder="0.00"
            value={watch('price') || initialData?.price || ''}
          />
          {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
        </div>
      </div>

      {/* Slug Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Auto-generate</span>
            <Switch
              checked={isSlugAutoGenerated}
              onCheckedChange={setIsSlugAutoGenerated}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            {...register('slug')}
            placeholder="auto-generated from name"
            disabled={isSlugAutoGenerated}
            className={isSlugAutoGenerated ? 'bg-gray-50 dark:bg-gray-800' : ''}
            value={watch('slug') || initialData?.slug || ''}
          />
          {!isSlugAutoGenerated && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const name = watch('name')
                if (name) {
                  const newSlug = generateSlug(name)
                  setValue('slug', newSlug)
                  toast.info('Slug regenerated from name')
                }
              }}
            >
              Regenerate
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          The slug is used in the product URL. It should be unique and URL-friendly.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea 
          {...register('description')} 
          rows={4} 
          placeholder="Product description"
          value={watch('description') || initialData?.description || ''}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <select 
            {...register('category_id')} 
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={watch('category_id') || initialData?.category_id || ''}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Subcategory</Label>
          <select 
            {...register('subcategory_id')} 
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={watch('subcategory_id') || initialData?.subcategory_id || ''}
          >
            <option value="">Select subcategory</option>
            {subcategories.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Type & ABV Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Product Type</Label>
          <select
            {...register('product_type')}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={watch('product_type') || initialData?.product_type || 'non_applicable'}
          >
            <option value="non_applicable">Non-Applicable</option>
            <option value="non_alcoholic">Non-Alcoholic</option>
            <option value="alcoholic">Alcoholic</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Alcohol by Volume (ABV) %</Label>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="100"
            {...register('abv', { valueAsNumber: true })}
            placeholder="e.g., 12.5"
            disabled={productType !== 'alcoholic'}
            className={productType !== 'alcoholic' ? 'bg-gray-50 dark:bg-gray-800 opacity-50' : ''}
            value={watch('abv') || initialData?.abv || ''}
          />
          {productType === 'alcoholic' && (
            <p className="text-xs text-gray-500">Enter ABV value between 0% and 100%</p>
          )}
          {errors.abv && <p className="text-red-500 text-sm">{errors.abv.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Stock Status</Label>
        <select 
          {...register('stock_status')} 
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          value={watch('stock_status') || initialData?.stock_status || 'in_stock'}
        >
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="pre_order">Pre-Order</option>
        </select>
      </div>

      {/* Switches */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch 
            {...register('is_featured')} 
            checked={watch('is_featured') || initialData?.is_featured || false}
            onCheckedChange={(checked) => setValue('is_featured', checked)}
          />
          <Label>Featured</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            {...register('is_bestseller')} 
            checked={watch('is_bestseller') || initialData?.is_bestseller || false}
            onCheckedChange={(checked) => setValue('is_bestseller', checked)}
          />
          <Label>Best Seller</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            {...register('is_new')} 
            checked={watch('is_new') || initialData?.is_new || false}
            onCheckedChange={(checked) => setValue('is_new', checked)}
          />
          <Label>New Arrival</Label>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Product Images</Label>
          <span className="text-sm text-gray-500">
            {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          <label htmlFor="image-upload">
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </span>
            </Button>
          </label>
          
          <div className="flex-1 flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or enter image URL"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addImage()
                }
              }}
            />
            <Button type="button" onClick={addImage} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {imageUrls.length > 0 ? (
            imageUrls.map((url, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <img 
                  src={url} 
                  alt={`Product ${index + 1}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center col-span-2 md:col-span-4">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No images uploaded</p>
                <p className="text-xs text-gray-400">Upload images or add URLs above</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variants with ABV Support and Predefined Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Product Variants</Label>
          <Button
            type="button"
            onClick={() => {
              append({
                variant_type: '',
                variant_value: '',
                price: 0,
                stock: 0,
                sku: '',
                abv: null,
              })
            }}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Variant
          </Button>
        </div>

        <AnimatePresence>
          {fields.map((field, index) => {
            const variantType = watch(`variants.${index}.variant_type`) || initialData?.variants?.[index]?.variant_type || ''
            const variantValue = watch(`variants.${index}.variant_value`) || initialData?.variants?.[index]?.variant_value || ''
            const productName = watch('name') || initialData?.name || 'PROD'
            
            // Get options for the selected variant type
            const options = getVariantOptions(variantType)
            const displayLabel = getVariantDisplayLabel(variantType)
            
            // Auto-generate SKU when variant value changes
            useEffect(() => {
              const currentSku = watch(`variants.${index}.sku`)
              if (!currentSku && variantValue) {
                const newSku = generateSKU(productName, variantValue, index)
                setValue(`variants.${index}.sku`, newSku)
              }
            }, [variantValue, productName, index, watch, setValue])

            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* Variant Type - Dropdown with predefined options */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Variant Type</Label>
                  <select
                    {...register(`variants.${index}.variant_type`)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={watch(`variants.${index}.variant_type`) || initialData?.variants?.[index]?.variant_type || ''}
                    onChange={(e) => {
                      setValue(`variants.${index}.variant_type`, e.target.value)
                      // Clear variant value when type changes
                      setValue(`variants.${index}.variant_value`, '')
                    }}
                  >
                    <option value="">Select type...</option>
                    {VARIANT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.field_name} value={opt.field_name}>
                        {opt.display_label}
                      </option>
                    ))}
                  </select>
                  {errors.variants?.[index]?.variant_type && (
                    <p className="text-red-500 text-xs mt-1">{errors.variants[index]?.variant_type?.message}</p>
                  )}
                </div>

                {/* Variant Value - Dropdown with options or text input */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {displayLabel}
                  </Label>
                  {options.length > 0 ? (
                    <select
                      {...register(`variants.${index}.variant_value`)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={watch(`variants.${index}.variant_value`) || initialData?.variants?.[index]?.variant_value || ''}
                      onChange={(e) => {
                        setValue(`variants.${index}.variant_value`, e.target.value)
                      }}
                    >
                      <option value="">Select {displayLabel}...</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      {...register(`variants.${index}.variant_value`)}
                      placeholder={`Enter ${displayLabel}`}
                      value={watch(`variants.${index}.variant_value`) || initialData?.variants?.[index]?.variant_value || ''}
                      onChange={(e) => {
                        setValue(`variants.${index}.variant_value`, e.target.value)
                      }}
                    />
                  )}
                  {errors.variants?.[index]?.variant_value && (
                    <p className="text-red-500 text-xs mt-1">{errors.variants[index]?.variant_value?.message}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`variants.${index}.price`, { valueAsNumber: true })}
                    placeholder="Price"
                    value={watch(`variants.${index}.price`) || initialData?.variants?.[index]?.price || 0}
                  />
                  {errors.variants?.[index]?.price && (
                    <p className="text-red-500 text-xs mt-1">{errors.variants[index]?.price?.message}</p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stock</Label>
                  <Input
                    type="number"
                    {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                    placeholder="Stock"
                    value={watch(`variants.${index}.stock`) || initialData?.variants?.[index]?.stock || 0}
                  />
                  {errors.variants?.[index]?.stock && (
                    <p className="text-red-500 text-xs mt-1">{errors.variants[index]?.stock?.message}</p>
                  )}
                </div>

                {/* ABV % */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">ABV %</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    {...register(`variants.${index}.abv`, { valueAsNumber: true })}
                    placeholder="e.g., 12.5"
                    value={watch(`variants.${index}.abv`) || initialData?.variants?.[index]?.abv || ''}
                  />
                  {errors.variants?.[index]?.abv && (
                    <p className="text-red-500 text-xs mt-1">{errors.variants[index]?.abv?.message}</p>
                  )}
                </div>

                {/* SKU and Delete */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">SKU</Label>
                  <div className="flex gap-2">
                    <Input
                      {...register(`variants.${index}.sku`)}
                      placeholder="Auto-generated"
                      value={watch(`variants.${index}.sku`) || initialData?.variants?.[index]?.sku || ''}
                      className="flex-1 text-xs"
                    />
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      variant="destructive"
                      size="icon"
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <p className="text-xs text-gray-500">
          Select a variant type to see predefined options. SKU is auto-generated but can be customized.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={loading}
          className="bg-pink-600 hover:bg-pink-700"
        >
          {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}