// src/app/gifts/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Gift, Heart, PackageCheck, Sparkles, Wine } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'

const giftCollections = [
  {
    id: 'premium',
    eyebrow: 'For the connoisseur',
    name: 'The good bottle',
    description: 'A thoughtful bottle for the person who knows what they like.',
    href: '/products?category=wine',
    tone: 'from-pink-700 to-rose-900',
    mark: '01',
  },
  {
    id: 'luxury',
    eyebrow: 'For the big occasion',
    name: 'A little ceremony',
    description: 'Bring a bottle of bubbles to the moments worth keeping.',
    href: '/products?subcategory=sparkling-wine',
    tone: 'from-purple-700 to-fuchsia-900',
    mark: '02',
  },
  {
    id: 'corporate',
    eyebrow: 'For the host',
    name: 'The open-door set',
    description: 'Easy-going favourites for dinners, reunions and new keys.',
    href: '/products?category=spirits',
    tone: 'from-gray-800 to-pink-900',
    mark: '03',
  },
]

const details = [
  { icon: Wine, title: 'Start with their taste', copy: 'Wine, spirits or something celebratory. Pick a direction and explore.' },
  { icon: PackageCheck, title: 'Make it personal', copy: 'Need a hand putting something together? We can help you choose.' },
  { icon: Heart, title: 'Give for a reason', copy: 'A dinner invite, a milestone, or simply because they came to mind.' },
]

export default function GiftsPage() {
  return (
    <div className="bg-background text-foreground">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
        <section className="relative overflow-hidden bg-gradient-to-br from-pink-700 via-pink-700 to-purple-900 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:min-h-[470px] md:grid-cols-[1fr_0.8fr] md:py-20">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-pink-100"><Sparkles className="h-4 w-4" /> The Mystic gift edit</p>
              <h1 className="font-display text-5xl font-semibold leading-[1.04] sm:text-6xl">Make the<br />moment <span className="block text-pink-100">matter.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/75">Good gifts are less about the occasion and more about knowing the person. Start with what they love.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#gift-edit">
                  <Button className="bg-white text-pink-700 hover:bg-pink-50">Find their bottle <ArrowDown className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">Ask for a hand <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            </div>
            <div aria-hidden="true" className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center md:h-80">
              <div className="absolute h-56 w-56 rounded-full border border-white/20 md:h-72 md:w-72" />
              <div className="absolute h-44 w-44 rounded-full border border-white/10 md:h-60 md:w-60" />
              <div className="relative flex h-48 w-48 rotate-[-7deg] items-center justify-center border border-white/40 bg-gradient-to-br from-pink-400 to-purple-600 shadow-[18px_22px_0_rgba(30,10,45,0.35)] md:h-56 md:w-56">
                <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-white/40" />
                <div className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 bg-white/40" />
                <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-pink-700"><Gift className="h-7 w-7" /></div>
              </div>
              <span className="absolute bottom-4 right-0 rotate-6 font-display text-2xl italic text-pink-100">just because</span>
            </div>
          </div>
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-white/5" />
        </section>

        <section id="gift-edit" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-600 dark:text-pink-400">A good place to begin</p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Three ways to say it.</h2>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 pb-1 text-sm font-semibold hover:text-pink-600 dark:hover:text-pink-400">Browse all bottles <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {giftCollections.map((collection, index) => (
              <motion.article key={collection.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.08 }} className={`group relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-gradient-to-br ${collection.tone} p-6 text-white sm:p-7`}>
                <span className="absolute -right-3 -top-10 font-display text-[180px] font-semibold leading-none text-white/[0.08]">{collection.mark}</span>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">{collection.eyebrow}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30"><Gift className="h-4 w-4" /></span>
                </div>
                <div className="relative z-10">
                  <h3 className="font-display text-3xl font-semibold">{collection.name}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-white/75">{collection.description}</p>
                  <Link href={collection.href} className="mt-7 inline-flex items-center gap-2 border-b border-white/50 pb-1 text-sm font-semibold transition-colors group-hover:border-white">Explore bottles <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/50">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-[0.7fr_1.3fr] md:py-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-600 dark:text-pink-400">The thoughtful bit</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">A little help goes a long way.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {details.map((detail) => {
                const Icon = detail.icon
                return <div key={detail.title} className="border-t border-border pt-4"><Icon className="h-5 w-5 text-pink-600 dark:text-pink-400" /><h3 className="mt-4 font-semibold">{detail.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail.copy}</p></div>
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between md:py-16">
          <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-600 dark:text-pink-400">Your idea, our shortlist</p><h2 className="mt-2 font-display text-3xl font-semibold">Not sure what to choose?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Tell us who it is for and what they enjoy. We will help you find a bottle that feels like them.</p></div>
          <Link href="/contact"><Button className="shrink-0 bg-pink-600 text-white hover:bg-pink-700">Talk gifts with us <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </section>
      </motion.div>
    </div>
  )
}