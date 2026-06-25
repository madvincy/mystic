// src/components/modals/ReviewModal.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Star } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Textarea } from '@/components/shadCn/ui/textarea'
import { Label } from '@/components/shadCn/ui/label'
import { Dialog, DialogContent } from '@/components/shadCn/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  onSuccess?: () => void
}

export default function ReviewModal({ isOpen, onClose, productId, productName, onSuccess }: ReviewModalProps) {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please login to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          title,
          comment,
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success('Review submitted successfully!')
      onSuccess?.()
      onClose()
      resetForm()
    } catch (error: any) {
      toast.error('Failed to submit review: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setRating(0)
    setHoveredRating(0)
    setTitle('')
    setComment('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Write a Review</h3>
              <p className="text-sm text-gray-500">for {productName}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Review Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                required
              />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}