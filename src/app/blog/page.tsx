// src/app/blog/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, User, Clock, ArrowRight, Search, Tag, Filter, X, Sparkles, TrendingUp, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Badge } from '@/components/shadCn/ui/badge'
import { cn } from '@/lib/utils'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string
  author_name: string
  published_at: string
  reading_time: number
  tags: string[]
  views: number
  is_featured: boolean
  categories?: any[]
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })

      if (error) throw error
      
      const postsData = data || []
      setPosts(postsData)
      
      // Set featured post
      const featured = postsData.find(p => p.is_featured)
      if (featured) {
        setFeaturedPost(featured)
      } else if (postsData.length > 0) {
        setFeaturedPost(postsData[0])
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Get all unique tags from posts
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])))

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag))
    return matchesSearch && matchesTag
  })

  // Get regular posts (excluding featured)
  const regularPosts = filteredPosts.filter(p => p.id !== featuredPost?.id)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section with Featured Post */}
      {featuredPost && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 dark:from-pink-900/30 dark:to-purple-900/30" />
          <div className="container mx-auto px-4 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <Badge className="mb-4 bg-pink-600 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured Article
              </Badge>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {featuredPost.title}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(featuredPost.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featuredPost.reading_time || 5} min read
                    </span>
                    {featuredPost.tags && featuredPost.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {featuredPost.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white">
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  {featuredPost.featured_image ? (
                    <Image
                      src={featuredPost.featured_image}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
                      🍷
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Blog Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-pink-600" />
              Latest Articles
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'} found
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {allTags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedTag(null)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm transition-colors",
                          !selectedTag
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                      >
                        All
                      </button>
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm transition-colors",
                            selectedTag === tag
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                          )}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(searchTerm || selectedTag) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedTag(null)
                    }}
                    className="text-pink-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Grid */}
        {regularPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm('')
                setSelectedTag(null)
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {post.featured_image ? (
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
                          🍷
                        </div>
                      )}
                      {post.is_featured && (
                        <Badge className="absolute top-3 left-3 bg-pink-600 text-white border-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="absolute bottom-3 left-3 flex gap-1">
                          {post.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-black/60 text-white border-0 text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {post.tags.length > 2 && (
                            <Badge variant="secondary" className="bg-black/60 text-white border-0 text-xs">
                              +{post.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time || 5} min
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {post.views || 0}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author_name || 'Admin'}
                        </span>
                        <span className="text-sm text-pink-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Read More
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}