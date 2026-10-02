import type { Metadata } from 'next'
import { cache } from 'react'
import { supabase } from '@/lib/supabase/client'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mysticwines.co.ke'
const storeName = 'Mystic Wines & Spirits'

const getSeoData = cache(async (slug: string) => {
  const { data: product } = await supabase
    .from('products')
    .select('name, slug, description, price, sale_price, images, stock_status, sku, updated_at, category:categories(name)')
    .eq('slug', slug)
    .maybeSingle()

  if (product) return { product, category: null }

  const { data: category } = await supabase
    .from('categories')
    .select('name, slug, description, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return { product: null, category }
})

type ProductRouteProps = {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Pick<ProductRouteProps, 'params'>): Promise<Metadata> {
  const { slug } = await params
  const { product, category } = await getSeoData(slug)

  if (product) {
    const price = Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price)
      ? product.sale_price
      : product.price
    const description = product.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
      || `Shop ${product.name} from ${storeName} in Kenya. Current price: KSh ${Number(price).toLocaleString()}.`

    return {
      title: `${product.name} - KSh ${Number(price).toLocaleString()}`,
      description,
      alternates: { canonical: `/products/${product.slug}` },
      openGraph: {
        title: `${product.name} | ${storeName}`,
        description,
        url: `/products/${product.slug}`,
        siteName: storeName,
        type: 'website',
        images: product.images?.[0] ? [{ url: product.images[0], alt: product.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | ${storeName}`,
        description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    }
  }

  if (category) {
    const description = category.description || `Shop ${category.name} at ${storeName}. Browse products and current prices in Kenya.`
    return {
      title: `${category.name} - Shop by Category`,
      description,
      alternates: { canonical: `/products/${category.slug}` },
      openGraph: { title: `${category.name} | ${storeName}`, description, url: `/products/${category.slug}`, siteName: storeName },
    }
  }

  return { title: 'Product Not Found', robots: { index: false, follow: false } }
}

export default async function ProductSeoLayout({ params, children }: ProductRouteProps) {
  const { slug } = await params
  const { product } = await getSeoData(slug)

  if (!product) return children

  const price = Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price)
    ? product.sale_price
    : product.price
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    image: product.images || [],
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: storeName },
    url: `${siteUrl}/products/${product.slug}`,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: 'KES',
      price: Number(price).toFixed(2),
      availability: product.stock_status === 'out_of_stock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: storeName, url: siteUrl },
    },
  }

  return <>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} /></>
}