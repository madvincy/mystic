// src/app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase/client'
import BlogPostClient from './BlogPostClient'
import { notFound } from 'next/navigation'

// ✅ Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, featured_image')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

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
}

// ✅ Server Component - Fetches data and passes to client
export default async function Page({ params }: { params: { slug: string } }) {
  console.log('🔍 Fetching post with slug:', params.slug)
  
  // Fetch the post data on the server
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  console.log('📦 Post data:', post)
  console.log('❌ Error:', error)

  // If no post found, show 404
  if (!post || error) {
    console.log('❌ Post not found, showing 404')
    notFound()
  }

  // Pass the post data to the client component
  return <BlogPostClient initialPost={post} />
}