// src/app/faq/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, Sparkles } from 'lucide-react'
import { Input } from '@/components/shadCn/ui/input'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { Badge } from '@/components/shadCn/ui/badge'
import { cn } from '@/lib/utils'
import { faqData } from '@/data/faqs'

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  // Toggle accordion item
  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Filter FAQs based on search
  const filteredFaqs = faqData.categories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  // Get selected category
  const selectedCategory = activeCategory 
    ? faqData.categories.find(c => c.id === activeCategory)
    : null

  // If search is active, show all matching FAQs
  const displayFaqs = searchQuery 
    ? filteredFaqs 
    : activeCategory 
      ? [selectedCategory!].filter(Boolean)
      : faqData.categories

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-12"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-full">
            <Sparkles className="h-12 w-12 text-pink-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Find answers to the most common questions about ordering, products, payments, and more.
        </p>
      </motion.div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for answers..."
            className="pl-12 py-6 text-lg rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Found {filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0)} results
          </p>
        )}
      </div>

      {/* Category Navigation */}
      {!searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          <Button
            variant={!activeCategory ? 'default' : 'outline'}
            className={!activeCategory ? 'bg-pink-600 hover:bg-pink-700' : ''}
            onClick={() => setActiveCategory(null)}
            size="sm"
          >
            All Categories
          </Button>
          {faqData.categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              className={activeCategory === category.id ? 'bg-pink-600 hover:bg-pink-700' : ''}
              onClick={() => setActiveCategory(category.id)}
              size="sm"
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </motion.div>
      )}

      {/* FAQ Accordion */}
      <div className="max-w-4xl mx-auto space-y-8">
        {displayFaqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
            <p className="text-gray-400 text-sm mt-2">Try different keywords or browse categories</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('')
                setActiveCategory(null)
              }}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          displayFaqs.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <Badge variant="secondary" className="ml-2">
                  {category.questions.length}
                </Badge>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
                  {category.questions.map((item) => {
                    const isOpen = openItems.has(item.id)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                        >
                          <span className="font-medium text-base pr-4">
                            {item.question}
                          </span>
                          <span className="flex-shrink-0 ml-4 p-1 rounded-full bg-gray-100 dark:bg-gray-800">
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-pink-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </span>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                                {item.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Still Have Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 p-8 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl text-center"
      >
        <h3 className="text-2xl font-bold mb-3">Still Have Questions?</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
          Our team is here to help. Reach out to us through any of the channels below.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:0710835445">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              <Phone className="mr-2 h-4 w-4" />
              Call Us
            </Button>
          </a>
          <a href="https://wa.me/254710835445" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-pink-600 text-pink-600 hover:bg-pink-50">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </a>
          <a href="mailto:info@mysticwines.co.ke">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Us
            </Button>
          </a>
        </div>
      </motion.div>
    </div>
  )
}