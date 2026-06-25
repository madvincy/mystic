// src/app/blog/[slug]/loading.tsx
export default function BlogPostLoading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        </div>
        <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}