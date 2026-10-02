import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Wines, Spirits & Premium Drinks in Kenya',
  description: 'Explore Mystic Wines & Spirits products in Kenya. Compare current prices, discover wines and spirits, and shop our collection online.',
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'Shop Wines, Spirits & Premium Drinks in Kenya',
    description: 'Explore Mystic Wines & Spirits products in Kenya and compare current prices.',
    url: '/products',
    siteName: 'Mystic Wines & Spirits',
    type: 'website',
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}