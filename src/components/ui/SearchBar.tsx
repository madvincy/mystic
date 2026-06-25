// src/components/ui/SearchBar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/shadCn/ui/input'
import { Button } from '@/components/shadCn/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'

interface SearchBarProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
  autoFocus?: boolean
  variant?: 'default' | 'compact' | 'expanded'
}

interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
}

export default function SearchBar({
  className = '',
  placeholder = 'Search for wines, spirits, and more...',
  onSearch,
  autoFocus = false,
  variant = 'default'
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close results on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, images')
        .ilike('name', `%${searchQuery}%`)
        .limit(8)

      if (error) throw error
      setResults(data || [])
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query)
      router.push(`/products?search=${encodeURIComponent(query)}`)
      setShowResults(false)
    }
  }

  const handleResultClick = (slug: string) => {
    router.push(`/products/${slug}`)
    setShowResults(false)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSearch} className={cn("relative", className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="pl-9 pr-9 h-9 rounded-full text-sm bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            autoFocus={autoFocus}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    )
  }

  if (variant === 'expanded') {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              className="pl-12 pr-12 py-6 text-lg rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setShowResults(true)}
              autoFocus={autoFocus}
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-pink-600 hover:bg-pink-700 text-white rounded-full px-6"
          >
            Search
          </Button>
        </form>
      </div>
    )
  }

  // Default
  return (
    <div ref={searchContainerRef} className={cn("relative", className)}>
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          autoFocus={autoFocus}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (results.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Searching...</div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result.slug)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      <img
                        src={result.images?.[0] || '/images/placeholder.jpg'}
                        alt={result.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.name}</p>
                      <p className="text-sm text-pink-600">KSh {result.price.toLocaleString()}</p>
                    </div>
                    <Search className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
                <div className="p-2 text-center">
                  <button
                    onClick={handleSearch}
                    className="text-sm text-pink-600 hover:underline"
                  >
                    View all results for "{query}"
                  </button>
                </div>
              </div>
            ) : query.length >= 2 && (
              <div className="p-4 text-center text-gray-500">
                No products found for "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}