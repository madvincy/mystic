// src/components/admin/DiscountForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Textarea } from '@/components/shadCn/ui/textarea'
import { supabase } from '@/lib/supabase/client'
import { Label } from '@/components/shadCn/ui/label'
import { Switch } from '@/components/shadCn/ui/switch'

const discountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0, 'Value must be positive'),
  code: z.string().min(1, 'Code is required'),
  min_order_amount: z.number().min(0).optional(),
  max_discount_amount: z.number().min(0).optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  is_active: z.boolean().default(true),
  usage_limit: z.number().min(0).optional(),
})

type DiscountFormData = z.infer<typeof discountSchema>

interface DiscountFormProps {
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export default function DiscountForm({ initialData, onSuccess, onCancel }: DiscountFormProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: initialData || {
      discount_type: 'percentage',
      is_active: true,
    }
  })

  const discountType = watch('discount_type')

  const onSubmit = async (data: DiscountFormData) => {
    setLoading(true)
    try {
      if (initialData) {
        const { error } = await supabase
          .from('discounts')
          .update(data)
          .eq('id', initialData.id)
        
        if (error) throw error
        toast.success('Discount updated successfully!')
      } else {
        const { error } = await supabase
          .from('discounts')
          .insert(data)
        
        if (error) throw error
        toast.success('Discount created successfully!')
      }
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save discount')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Discount Name *</Label>
        <Input {...register('name')} placeholder="e.g., Weekend Special" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...register('description')} placeholder="Discount description" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount Type *</Label>
          <select {...register('discount_type')} className="w-full rounded-md border border-input bg-background px-3 py-2">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Discount Value *</Label>
          <Input 
            type="number" 
            {...register('discount_value', { valueAsNumber: true })} 
            placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
          />
          {errors.discount_value && <p className="text-red-500 text-sm">{errors.discount_value.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Promo Code *</Label>
        <Input {...register('code')} placeholder="e.g., SAVE20" />
        {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Min Order Amount</Label>
          <Input type="number" {...register('min_order_amount', { valueAsNumber: true })} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Max Discount Amount</Label>
          <Input type="number" {...register('max_discount_amount', { valueAsNumber: true })} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input type="datetime-local" {...register('start_date')} />
          {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>End Date *</Label>
          <Input type="datetime-local" {...register('end_date')} />
          {errors.end_date && <p className="text-red-500 text-sm">{errors.end_date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Usage Limit</Label>
        <Input type="number" {...register('usage_limit', { valueAsNumber: true })} placeholder="Unlimited" />
      </div>

      <div className="flex items-center gap-2">
        <Switch {...register('is_active')} />
        <Label>Active</Label>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
          {loading ? 'Saving...' : initialData ? 'Update Discount' : 'Create Discount'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}