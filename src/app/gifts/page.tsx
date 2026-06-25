// src/app/gifts/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Gift, Sparkles, Heart, Star, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'

const giftCollections = [
  {
    id: 'premium',
    name: 'Premium Collection',
    description: 'Curated selection of our finest wines and spirits',
    image: '/images/gifts/premium.jpg',
    price: 'KSh 15,000+',
  },
  {
    id: 'luxury',
    name: 'Luxury Gift Set',
    description: 'Exclusive bottles in a beautiful presentation box',
    image: '/images/gifts/luxury.jpg',
    price: 'KSh 25,000+',
  },
  {
    id: 'corporate',
    name: 'Corporate Gifts',
    description: 'Impressive gifts for business partners and clients',
    image: '/images/gifts/corporate.jpg',
    price: 'KSh 10,000+',
  },
  {
    id: 'personalized',
    name: 'Personalized Gifts',
    description: 'Custom engraved bottles for special occasions',
    image: '/images/gifts/personalized.jpg',
    price: 'KSh 8,000+',
  },
]

const features = [
  { icon: Heart, label: 'Handpicked Selection', description: 'Each gift set is carefully curated by our experts' },
  { icon: Star, label: 'Premium Quality', description: 'Only the finest wines and spirits make the cut' },
  { icon: Gift, label: 'Beautiful Packaging', description: 'Elegant presentation for any occasion' },
  { icon: Sparkles, label: 'Custom Options', description: 'Personalize your gift with custom messages' },
]

export default function GiftsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-full">
              <Gift className="h-12 w-12 text-pink-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gift Collections</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find the perfect gift for wine and spirit lovers. From premium selections to personalized presents.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="mx-auto w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.label}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Gift Collections */}
        <h2 className="text-2xl font-bold mb-6">Our Gift Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {giftCollections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-shadow h-full">
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30">
                    🎁
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{collection.description}</p>
                  <p className="text-pink-600 font-semibold mb-4">{collection.price}</p>
                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Explore Collection
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-3">Need a Custom Gift?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-6">
            Contact us for personalized gift recommendations and custom packaging options.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button className="bg-white text-pink-600 hover:bg-white/90">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="tel:0710835445">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                📞 0710 835 445
              </Button>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}