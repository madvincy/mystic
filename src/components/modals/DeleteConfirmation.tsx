// src/components/modals/DeleteConfirmation.tsx
'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Dialog, DialogContent } from '@/components/shadCn/ui/dialog'

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  isLoading?: boolean
}

export default function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  isLoading = false
}: DeleteConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-600">{title}</h3>
          <p className="text-gray-500 mt-2">{description}</p>

          <div className="flex gap-3 mt-6">
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}