// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { 
  fetchProducts, 
  fetchCategories 
} from '@/lib/store/productSlice'
import { AppDispatch, RootState } from '@/lib/store'
import AdSlider from '@/components/ui/AdSlider'
import ProductGrid from '@/components/ui/ProductGrid'
import { Button } from '@/components/shadCn/ui/button'
import { 
  ArrowRight, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Clock,
  Calendar,
  User,
  BookOpen,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { Badge } from '@/components/shadCn/ui/badge'
import { Input } from '@/components/shadCn/ui/input'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import FlashSaleBanner from '@/components/ui/FlashSaleBanner'

// ✅ Fallback image if category has no image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1800&auto=format&fit=crop'

// ✅ Ad interface
interface Advertisement {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  cta_text: string
  type: 'banner' | 'sidebar' | 'inline' | 'popup' | 'footer'
  category_id: string | null
  subcategory_id: string | null
  placement: string
  display_order: number
  is_active: boolean
}

// ✅ Blog Post interface
interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string
  published_at: string
  reading_time: number
  author_name: string
  tags: string[]
}

export default function Home() {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    products, 
    loading, 
    featuredProducts, 
    discountedProducts,
    categories,
    flashSales 
  } = useSelector((state: RootState) => state.products)
  
  // ✅ State for ads and blog posts
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [recentBlogPosts, setRecentBlogPosts] = useState<BlogPost[]>([])
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchCategories())
    fetchAdvertisements()
    fetchRecentBlogPosts()
  }, [dispatch])

  // ✅ Fetch advertisements
  const fetchAdvertisements = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('display_order', { ascending: true })

      if (error) throw error
      setAdvertisements(data || [])
    } catch (error) {
      console.error('Error fetching advertisements:', error)
    }
  }

  // ✅ Fetch recent blog posts
  const fetchRecentBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setRecentBlogPosts(data || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    }
  }

  // ✅ Newsletter subscription handler
  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newsletterEmail) {
      toast.error('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newsletterEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubscribing(true)

    try {
      const { data: existing, error: checkError } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, status')
        .eq('email', newsletterEmail.toLowerCase().trim())
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        if (existing.status === 'active') {
          toast.info("You're already subscribed! 🎉")
          setSubscribed(true)
          setNewsletterEmail('')
          return
        } else if (existing.status === 'unsubscribed') {
          const { error: updateError } = await supabase
            .from('newsletter_subscribers')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (updateError) throw updateError
          
          toast.success("Welcome back! You've been resubscribed 🎉")
          setSubscribed(true)
          setNewsletterEmail('')
          return
        }
      }

      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: newsletterEmail.toLowerCase().trim(),
          status: 'active',
          subscribed_at: new Date().toISOString(),
          source: 'homepage_newsletter',
        })

      if (insertError) throw insertError

      toast.success("Subscribed successfully! 🎉")
      setSubscribed(true)
      setNewsletterEmail('')

    } catch (error: any) {
      console.error('Newsletter subscription error:', error)
      if (error.code === '23505') {
        toast.info("You're already subscribed! 🎉")
        setSubscribed(true)
        setNewsletterEmail('')
      } else {
        toast.error(error.message || 'Failed to subscribe. Please try again.')
      }
    } finally {
      setIsSubscribing(false)
    }
  }

  // Get products with flash sales for timer display
  const flashSaleProducts = products.filter(p => p.flash_sale).slice(0, 4)
  const bestSellers = products.filter(p => p.is_bestseller).slice(0, 4)
  const newArrivals = products.filter(p => p.is_new).slice(0, 4)
  const featured = featuredProducts.slice(0, 4)

  // ✅ Prepare category data using database image_url
  const categoryData = categories.slice(0, 6).map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image_url || FALLBACK_IMAGE,
    count: products.filter(p => p.category_id === cat.id).length
  }))

  // ✅ Get inline ads (for inserting between product rows)
  const inlineAds = advertisements.filter(ad => ad.type === 'inline' && ad.placement === 'homepage')

  return (
    <div className="min-h-screen">
      {/* Ad Slider */}
      <section className="container mx-auto mt-8">
        <AdSlider />
      </section> 

      {/* Flash Sale Banner */}
      {flashSales.length > 0 && (
        <section className="container mx-auto px-4 mt-8">
          <FlashSaleBanner />
        </section>
      )}

      {/* Categories - Beautiful Card Grid */}
      <section className="container mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Browse our curated collection of premium wines & spirits
            </p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="text-pink-600 hover:text-pink-700 group">
              View All Categories
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {categoryData.map((category, index) => (
            <motion.div
              key={category.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-xl cursor-pointer h-56 flex flex-col justify-end"
            >
              <Link href={`/products/${category.slug}`}>
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE
                    }}
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Content */}
                <div className="relative p-6 w-full flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-white text-2xl font-semibold">
                      {category.name}
                    </h3>
                    <p className="text-white/90 font-medium text-sm">
                      {category.count || 0} products
                    </p>
                  </div>

                  <motion.div
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out"
                  >
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-600" />
              <h2 className="text-xl md:text-2xl font-bold">Featured Products</h2>
            </div>
            <Link href="/products?featured=true">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={featured} loading={loading} showDiscountBadge />
        </section>
      )}

      {/* ✅ Inline Ad - After Featured Products */}
      {inlineAds.length > 0 && (
        <section className="container mx-auto px-4 mt-8">
          {inlineAds.slice(0, 1).map((ad) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl"
            >
              <Link href={ad.link_url || '#'} target="_blank">
                <div className="relative aspect-[21/9] md:aspect-[21/6]">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                    <div className="p-8 md:p-12 max-w-lg">
                      <Badge className="bg-pink-600 text-white border-0 mb-3">
                        Sponsored
                      </Badge>
                      <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">
                        {ad.title}
                      </h3>
                      {ad.description && (
                        <p className="text-white/80 text-sm md:text-base mb-4">
                          {ad.description}
                        </p>
                      )}
                      <Button className="bg-white text-pink-600 hover:bg-white/90">
                        {ad.cta_text || 'Learn More'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </section>
      )}

      {/* Flash Sale Products */}
      {flashSaleProducts.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              <h2 className="text-xl md:text-2xl font-bold">Flash Sale</h2>
              <Clock className="h-4 w-4 text-red-500 ml-2" />
            </div>
            <Link href="/products?flash-sale=true">
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid 
            products={flashSaleProducts} 
            loading={loading}
            showDiscountBadge
            showTimer
          />
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-xl md:text-2xl font-bold">Best Sellers</h2>
            </div>
            <Link href="/products?bestseller=true">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={bestSellers} loading={loading} showDiscountBadge />
        </section>
      )}

      {/* ✅ Inline Ad - After Best Sellers */}
      {inlineAds.length > 1 && (
        <section className="container mx-auto px-4 mt-8">
          {inlineAds.slice(1, 2).map((ad) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl"
            >
              <Link href={ad.link_url || '#'} target="_blank">
                <div className="relative aspect-[21/9] md:aspect-[21/5]">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent flex items-center justify-end">
                    <div className="p-8 md:p-12 max-w-lg text-right">
                      <Badge className="bg-purple-600 text-white border-0 mb-3">
                        Sponsored
                      </Badge>
                      <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">
                        {ad.title}
                      </h3>
                      {ad.description && (
                        <p className="text-white/80 text-sm md:text-base mb-4">
                          {ad.description}
                        </p>
                      )}
                      <Button className="bg-white text-purple-600 hover:bg-white/90">
                        {ad.cta_text || 'Learn More'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </section>
      )}

      {/* Discounted Products */}
      {discountedProducts.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <h2 className="text-xl md:text-2xl font-bold">Special Offers</h2>
            </div>
            <Link href="/products?on-sale=true">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <ProductGrid 
            products={discountedProducts.slice(0, 4)} 
            loading={loading}
            showDiscountBadge
          />
        </section>
      )}

      {/* ✅ Blog Section */}
      {recentBlogPosts.length > 0 && (
        <section className="container mx-auto px-4 mt-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-pink-600" />
              <h2 className="text-2xl font-bold">Latest from Our Blog</h2>
            </div>
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 group">
                View All
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentBlogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
                          🍷
                        </div>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0 text-xs">
                          #{post.tags[0]}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time || 5} min read
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-3">
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
        </section>
      )}

      {/* ✅ Newsletter Section - Fixed Subscription */}
      <section className="container mx-auto px-4 mt-16 mb-8">
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Join Our Newsletter</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-6">
            Get the latest updates on new arrivals, exclusive offers, and special events.
          </p>
          <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={isSubscribing || subscribed}
                className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                required
              />
              {subscribed && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" />
              )}
            </div>
            <Button 
              type="submit" 
              className="bg-white text-pink-600 hover:bg-white/90 font-semibold px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubscribing || subscribed}
            >
              {isSubscribing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-600 border-t-transparent" />
                  Subscribing...
                </div>
              ) : subscribed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Subscribed!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Subscribe
                </span>
              )}
            </Button>
          </form>
          {subscribed ? (
            <p className="text-xs text-green-300 mt-4 flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              You're subscribed to our newsletter!
            </p>
          ) : (
            <p className="text-xs text-white/60 mt-4">
              By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}