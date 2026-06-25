// src/app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mysticwines.co.ke'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/verify-email',
        '/checkout/',
        '/cart/',
        '/profile/',
        '/orders/',
        '/wishlist/',
        '/_next/',
        '/_vercel/',
        '/favicon.ico',
        '/*.json$',
        '/*.xml$',
        '/assets/',
        '/images/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}