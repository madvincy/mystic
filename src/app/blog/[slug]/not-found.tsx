// src/app/blog/[slug]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/shadCn/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-2xl font-bold mb-2">Post not found</h2>
      <p className="text-gray-500 mb-6">The article you're looking for doesn't exist.</p>
      <Link href="/blog">
        <Button>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>
      </Link>
    </div>
  )
}