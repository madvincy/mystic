// src/components/modals/FilterModal.tsx
'use client'

import { motion } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Dialog, DialogContent } from '@/components/shadCn/ui/dialog'
import ProductFilters, { FilterState } from '../ui/ProductFilters'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterState) => void
  initialFilters?: FilterState
}

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between z-10">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <ProductFilters
              onFilterChange={onApply}
              showMobile={false}
            />
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}