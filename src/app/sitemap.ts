// src/app/sitemap-index.ts
import type { MetadataRoute } from 'next'

export default function sitemapIndex(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mysticwines.co.ke'

  return [
    {
      url: `${baseUrl}/sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-products.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-categories.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-pages.xml`,
      lastModified: new Date(),
    },
  ]
}