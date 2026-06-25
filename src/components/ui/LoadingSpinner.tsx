// src/components/ui/LoadingSpinner.tsx
'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'white'
  className?: string
  label?: string
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className = '',
  label
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  }

  const variantClasses = {
    default: 'border-gray-200 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-300',
    primary: 'border-pink-200 border-t-pink-600',
    white: 'border-white/30 border-t-white'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{label}</p>
      )}
    </div>
  )
}