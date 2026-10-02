// src/app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase/client'
import BlogPostClient from './BlogPostClient'
import { notFound } from 'next/navigation'

// ✅ Add this to prevent the performance error
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  try {
    const { slug } = await params
    
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, excerpt, featured_image, published_at, updated_at, author_name')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (!post) {
      return {
        title: 'Post Not Found',
        description: 'The requested blog post could not be found.',
      }
    }

    return {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on Mystic Wines Blog`,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: {
        title: post.title,
        description: post.excerpt || `Read ${post.title} on Mystic Wines Blog`,
        url: `/blog/${slug}`,
        siteName: 'Mystic Wines & Spirits',
        type: 'article',
        images: post.featured_image ? [post.featured_image] : [],
        publishedTime: post.published_at || undefined,
        modifiedTime: post.updated_at || undefined,
        authors: post.author_name ? [post.author_name] : ['Mystic Wines & Spirits'],
      },
      twitter: {
        card: post.featured_image ? 'summary_large_image' : 'summary',
        title: post.title,
        description: post.excerpt || `Read ${post.title} on Mystic Wines Blog`,
        images: post.featured_image ? [post.featured_image] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Error',
      description: 'An error occurred',
    }
  }
}

export default async function Page({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  try {
    const { slug } = await params
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error || !post) {
      console.error('Post not found for slug:', slug)
      notFound()
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt || undefined,
      image: post.featured_image ? [post.featured_image] : undefined,
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at || post.published_at || undefined,
      author: { '@type': 'Person', name: post.author_name || 'Mystic Wines & Spirits' },
      publisher: {
        '@type': 'Organization',
        name: 'Mystic Wines & Spirits',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mysticwines.co.ke',
        logo: { '@type': 'ImageObject', url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mysticwines.co.ke'}/images/logos/main-logo.png` },
      },
      mainEntityOfPage: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mysticwines.co.ke'}/blog/${post.slug}`,
    }

    return <><BlogPostClient initialPost={post} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} /></>
  } catch (error) {
    console.error('Error in blog post page:', error)
    notFound()
  }
}