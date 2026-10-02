import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wine & Spirits Stories, Guides and News',
  description: 'Read wine and spirits guides, serving tips and stories from Mystic Wines & Spirits in Kenya.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Wine & Spirits Stories, Guides and News',
    description: 'Wine and spirits guides, serving tips and stories from Mystic Wines & Spirits in Kenya.',
    url: '/blog',
    siteName: 'Mystic Wines & Spirits',
    type: 'website',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}