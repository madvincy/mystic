// src/components/modals/CheckoutModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Dialog, DialogContent } from '@/components/shadCn/ui/dialog'
import { toast } from 'sonner'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  total: number
  itemCount: number
}

export default function CheckoutModal({ isOpen, onClose, onConfirm, total, itemCount }: CheckoutModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleConfirm = async () => {
    setIsLoading(true)
    setStatus('processing')
    try {
      await onConfirm()
      setStatus('success')
      toast.success('Order placed successfully! 🎉')
      setTimeout(() => {
        router.push('/orders')
        onClose()
      }, 2000)
    } catch (error: any) {
      setStatus('error')
      setErrorMessage(error.message || 'Failed to place order')
      toast.error('Failed to place order')
    } finally {
      setIsLoading(false)
    }
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
            <h3 className="text-xl font-semibold">Confirm Order</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          {status === 'idle' && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-pink-600">KSh {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Order'
                  )}
                </Button>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </>
          )}

          {status === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-pink-600" />
              <p className="mt-4 text-gray-600">Processing your order...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="mt-4 text-xl font-semibold text-green-600">Order Placed!</p>
              <p className="text-gray-500 mt-2">Your order has been confirmed.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
              <p className="mt-4 text-xl font-semibold text-red-600">Something went wrong</p>
              <p className="text-gray-500 mt-2">{errorMessage}</p>
              <Button onClick={() => setStatus('idle')} className="mt-4">
                Try Again
              </Button>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}