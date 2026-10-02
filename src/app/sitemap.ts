import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mysticwines.co.ke'
  const staticRoutes = ['', '/products', '/blog', '/gifts', '/about', '/contact', '/faq'].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === '' ? 'daily' as const : 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }))

  const [{ data: products }, { data: categories }, { data: posts }] = await Promise.all([
    supabase.from('products').select('slug, updated_at, images'),
    supabase.from('categories').select('slug, updated_at'),
    supabase.from('blog_posts').select('slug, updated_at, published_at').eq('status', 'published'),
  ])

  return [
    ...staticRoutes,
    ...(products || []).map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updated_at || undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: product.images || [],
    })),
    ...(categories || []).map((category) => ({
      url: `${baseUrl}/products/${category.slug}`,
      lastModified: category.updated_at || undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...(posts || []).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at || post.published_at || undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}