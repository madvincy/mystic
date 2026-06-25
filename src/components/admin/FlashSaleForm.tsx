// src/components/admin/FlashSaleForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Textarea } from '@/components/shadCn/ui/textarea'
import { Label } from '@/components/shadCn/ui/label'
import { Switch } from '@/components/shadCn/ui/switch'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const flashSaleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  is_active: z.boolean().default(true),
  products: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    variant_id: z.string().optional(),
    discount_percentage: z.number().min(0, 'Discount must be positive').max(100, 'Max 100%'),
    sale_price: z.number().min(0, 'Sale price must be positive'),
    quantity_limit: z.number().min(0).optional(),
  })).default([]),
})

type FlashSaleFormData = z.infer<typeof flashSaleSchema>

interface FlashSaleFormProps {
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export default function FlashSaleForm({ initialData, onSuccess, onCancel }: FlashSaleFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const { register, handleSubmit, control, formState: { errors } } = useForm<FlashSaleFormData>({
    resolver: zodResolver(flashSaleSchema),
    defaultValues: initialData || {
      is_active: true,
      products: [],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products'
  })

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, variants(*)')
        .order('name')
      if (data) setProducts(data)
    }
    fetchProducts()
  }, [])

  const onSubmit = async (data: FlashSaleFormData) => {
    setLoading(true)
    try {
      // Create flash sale
      const flashSaleData = {
        name: data.name,
        description: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        is_active: data.is_active,
      }

      let flashSaleId
      if (initialData) {
        const { error } = await supabase
          .from('flash_sales')
          .update(flashSaleData)
          .eq('id', initialData.id)
        
        if (error) throw error
        flashSaleId = initialData.id
        toast.success('Flash sale updated successfully!')
      } else {
        const { data: newFlashSale, error } = await supabase
          .from('flash_sales')
          .insert(flashSaleData)
          .select()
          .single()
        
        if (error) throw error
        flashSaleId = newFlashSale.id
        toast.success('Flash sale created successfully!')
      }

      // Add products
      if (flashSaleId) {
        // Delete existing products if updating
        if (initialData) {
          await supabase
            .from('flash_sale_products')
            .delete()
            .eq('flash_sale_id', flashSaleId)
        }

        // Insert new products
        for (const product of data.products) {
          await supabase
            .from('flash_sale_products')
            .insert({
              flash_sale_id: flashSaleId,
              product_id: product.product_id,
              variant_id: product.variant_id || null,
              discount_percentage: product.discount_percentage,
              sale_price: product.sale_price,
              quantity_limit: product.quantity_limit || null,
            })
        }
      }

      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save flash sale')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Flash Sale Name *</Label>
        <Input {...register('name')} placeholder="e.g., 24-Hour Flash Sale" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...register('description')} placeholder="Flash sale description" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time *</Label>
          <Input type="datetime-local" {...register('start_time')} />
          {errors.start_time && <p className="text-red-500 text-sm">{errors.start_time.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>End Time *</Label>
          <Input type="datetime-local" {...register('end_time')} />
          {errors.end_time && <p className="text-red-500 text-sm">{errors.end_time.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch {...register('is_active')} />
        <Label>Active</Label>
      </div>

      {/* Products */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>Products</Label>
          <Button
            type="button"
            onClick={() => append({
              product_id: '',
              variant_id: '',
              discount_percentage: 20,
              sale_price: 0,
              quantity_limit: 100,
            })}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>

        {/* Product Search */}
        <div className="relative">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {fields.map((field, index) => {
            const product = products.find(p => p.id === field.product_id)
            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Product *</Label>
                    <select
                      {...register(`products.${index}.product_id`)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Select product</option>
                      {filteredProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (KSh {p.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Variant</Label>
                    <select
                      {...register(`products.${index}.variant_id`)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">All variants</option>
                      {product?.variants?.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.variant_value} (KSh {v.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Discount % *</Label>
                    <Input
                      type="number"
                      {...register(`products.${index}.discount_percentage`, { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label>Sale Price *</Label>
                    <Input
                      type="number"
                      {...register(`products.${index}.sale_price`, { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label>Quantity Limit</Label>
                    <Input
                      type="number"
                      {...register(`products.${index}.quantity_limit`, { valueAsNumber: true })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => remove(index)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
          {loading ? 'Saving...' : initialData ? 'Update Flash Sale' : 'Create Flash Sale'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}