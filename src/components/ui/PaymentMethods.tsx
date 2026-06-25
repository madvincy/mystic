// src/components/ui/PaymentMethods.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CreditCard, Smartphone, Wallet, Circle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description?: string
}

interface PaymentMethodsProps {
  selected?: string
  onSelect?: (method: string) => void
  className?: string
  methods?: PaymentMethod[]
}

const defaultMethods: PaymentMethod[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Pay with M-Pesa'
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Pay when you receive'
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Visa, Mastercard, etc.'
  }
]

export default function PaymentMethods({
  selected,
  onSelect,
  className = '',
  methods = defaultMethods
}: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState(selected || '')

  const handleSelect = (id: string) => {
    setSelectedMethod(id)
    onSelect?.(id)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-medium text-sm">Payment Method</h4>
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => handleSelect(method.id)}
          className={cn(
            "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
            selectedMethod === method.id
              ? "border-pink-600 bg-pink-50 dark:bg-pink-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-pink-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-full",
            selectedMethod === method.id
              ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400"
          )}>
            {method.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{method.name}</span>
              {selectedMethod === method.id && (
                <CheckCircle className="h-4 w-4 text-pink-600" />
              )}
            </div>
            {method.description && (
              <p className="text-sm text-gray-500">{method.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}