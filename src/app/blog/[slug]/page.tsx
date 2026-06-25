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
      .select('title, excerpt, featured_image')
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
      openGraph: {
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

    return <BlogPostClient initialPost={post} />
  } catch (error) {
    console.error('Error in blog post page:', error)
    notFound()
  }
}