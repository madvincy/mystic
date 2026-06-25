// src/components/ui/PhoneInput.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/shadCn/ui/input'
import { Label } from '@/components/shadCn/ui/label'
import { isValidMpesaPhone } from '@/lib/utils/mpesa'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  required?: boolean
}

export default function PhoneInput({
  value,
  onChange,
  label = 'Phone Number',
  placeholder = '0712 345 678',
  className = '',
  required = false
}: PhoneInputProps) {
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const handleBlur = () => {
    setTouched(true)
    if (value && !isValidMpesaPhone(value)) {
      setError('Please enter a valid phone number (e.g., 0712345678)')
    } else {
      setError('')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (touched) {
      if (val && !isValidMpesaPhone(val)) {
        setError('Please enter a valid phone number (e.g., 0712345678)')
      } else {
        setError('')
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor="phone">{label}</Label>}
      <Input
        id="phone"
        type="tel"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(error && "border-red-500 focus-visible:ring-red-500")}
        required={required}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">Format: 0712 345 678 or 254712345678</p>
    </div>
  )
}