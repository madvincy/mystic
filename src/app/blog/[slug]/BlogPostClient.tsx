// src/app/blog/[slug]/BlogPostClient.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, User, Clock, ArrowLeft, Tag, Share2, Heart, MessageCircle, Eye, TrendingUp, Bookmark } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/shadCn/ui/button'
import { Badge } from '@/components/shadCn/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image: string
  author_name: string
  published_at: string
  reading_time: number
  tags: string[]
  views: number
  is_featured: boolean
  created_at: string
}

interface BlogPostClientProps {
  initialPost: BlogPost
}

export default function BlogPostClient({ initialPost }: BlogPostClientProps) {
  const [post] = useState<BlogPost>(initialPost)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [viewCounted, setViewCounted] = useState(false)

  // Fetch related posts and update view count
  useEffect(() => {
    const fetchRelatedAndUpdateViews = async () => {
      // Update view count (non-blocking)
      if (!viewCounted) {
        setViewCounted(true)
        supabase
          .from('blog_posts')
          .update({ views: (initialPost.views || 0) + 1 })
          .eq('id', initialPost.id)
          .then(({ error }) => {
            if (error) console.error('Error updating view count:', error)
          })
      }

      // Fetch related posts
      const { data: relatedData } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .neq('id', initialPost.id)
        .order('published_at', { ascending: false })
        .limit(3)

      if (relatedData) {
        setRelatedPosts(relatedData)
      }
    }

    fetchRelatedAndUpdateViews()
  }, [initialPost.id, initialPost.views, viewCounted])

  const handleLike = () => {
    setLiked(!liked)
    toast.success(liked ? 'Removed like' : 'Liked! ❤️')
  }

  const handleBookmark = () => {
    setBookmarked(!bookmarked)
    toast.success(bookmarked ? 'Removed bookmark' : 'Bookmarked! 📌')
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8">
        <Link href="/blog">
          <Button variant="ghost" className="gap-2 hover:bg-pink-50 dark:hover:bg-pink-900/20">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 5).map(tag => (
                <Badge key={tag} variant="secondary" className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                  #{tag}
                </Badge>
              ))}
              {post.tags.length > 5 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  +{post.tags.length - 5} more
                </Badge>
              )}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time || 5} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views || 0} views
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author_name || 'Admin'}
            </span>
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 shadow-xl bg-gray-100 dark:bg-gray-800">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-xl text-gray-600 dark:text-gray-400 border-l-4 border-pink-600 pl-4 mb-8 italic leading-relaxed">
              {post.excerpt}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={cn(
                "gap-2 transition-all",
                liked && "text-pink-600 border-pink-600 bg-pink-50 dark:bg-pink-900/20"
              )}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-pink-600")} />
              {liked ? 'Liked' : 'Like'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              className={cn(
                "gap-2 transition-all",
                bookmarked && "text-purple-600 border-purple-600 bg-purple-50 dark:bg-purple-900/20"
              )}
            >
              <Bookmark className={cn("h-4 w-4", bookmarked && "fill-purple-600")} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const subject = encodeURIComponent(`Check out: ${post.title}`)
                const body = encodeURIComponent(`${post.excerpt || ''}\n\nRead more: ${window.location.href}`)
                window.location.href = `mailto:?subject=${subject}&body=${body}`
              }}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Email
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="prose prose-lg prose-pink dark:prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-pink-600" />
              You Might Also Like
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts
                .filter(related => related.id !== post.id)
                .slice(0, 3)
                .map(related => (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        {related.featured_image ? (
                          <Image
                            src={related.featured_image}
                            alt={related.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
                            🍷
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold line-clamp-2 group-hover:text-pink-600 transition-colors">
                          {related.title}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {new Date(related.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        {related.tags && related.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {related.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs text-gray-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </motion.div>
        )}
      </article>
    </div>
  )
}