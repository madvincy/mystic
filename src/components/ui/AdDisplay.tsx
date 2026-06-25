// src/components/ui/AdDisplay.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/shadCn/ui/badge'
import { Button } from '@/components/shadCn/ui/button'
import { ArrowRight } from 'lucide-react'

interface Ad {
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
}

interface AdDisplayProps {
  placement: 'homepage' | 'products' | 'blog' | 'checkout'
  adType?: 'banner' | 'sidebar' | 'inline' | 'popup' | 'footer'
  categoryId?: string | null
  subcategoryId?: string | null
  productId?: string | null
  limit?: number
}

export default function AdDisplay({ 
  placement, 
  adType = 'banner',
  categoryId = null,
  subcategoryId = null,
  productId = null,
  limit = 1
}: AdDisplayProps) {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAds()
  }, [placement, adType, categoryId, subcategoryId, productId])

  const fetchAds = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .eq('placement', placement)
        .eq('ad_type', adType)
        .order('order_position')
        .limit(limit)

      // If category is provided, match ads with same category
      if (categoryId) {
        query = query.or(`category_id.eq.${categoryId},category_id.is.null`)
      }

      // If subcategory is provided, match ads with same subcategory
      if (subcategoryId) {
        query = query.or(`subcategory_id.eq.${subcategoryId},subcategory_id.is.null`)
      }

      // If product is provided, match ads with same product
      if (productId) {
        query = query.or(`product_id.eq.${productId},product_id.is.null`)
      }

      const { data, error } = await query

      if (error) throw error
      setAds(data || [])
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || ads.length === 0) return null

  return (
    <div className="space-y-4">
      {ads.map((ad) => (
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <Link href={ad.link_url || '#'} target="_blank">
            <div className="relative aspect-[21/9] md:aspect-[21/6]">
              <img
                src={ad.image_url}
                alt={ad.title || 'Advertisement'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                <div className="p-8 md:p-12 max-w-lg">
                  <Badge className="bg-pink-600 text-white border-0 mb-3">
                    Sponsored
                  </Badge>
                  {ad.title && (
                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">
                      {ad.title}
                    </h3>
                  )}
                  <Button className="bg-white text-pink-600 hover:bg-white/90">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}