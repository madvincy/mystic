// src/components/ui/Breadcrumb.tsx
'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
}

export default function Breadcrumb({ 
  items, 
  className = '',
  separator 
}: BreadcrumbProps) {
  const defaultSeparator = separator || <ChevronRight className="h-4 w-4 text-gray-400" />

  return (
    <nav 
      className={cn("flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap", className)}
      aria-label="Breadcrumb"
    >
      <Link 
        href="/" 
        className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {defaultSeparator}
          {item.current ? (
            <span 
              className="text-gray-900 dark:text-gray-100 font-medium"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href} 
              className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}