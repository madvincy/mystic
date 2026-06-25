// src/components/sections/NewsletterSection.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NewsletterSectionProps {
  title?: string
  description?: string
  className?: string
  variant?: 'default' | 'minimal' | 'dark'
}

export default function NewsletterSection({
  title = 'Subscribe to Our Newsletter',
  description = 'Get the latest updates on new arrivals, exclusive offers, and special events.',
  className = '',
  variant = 'default'
}: NewsletterSectionProps) {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsSubscribing(true)
    try {
      // Simulate subscription
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Here you would save to Supabase or your email service
      // await supabase.from('subscribers').insert({ email })
      
      setIsSuccess(true)
      toast.success('Subscribed successfully! 🎉')
      setEmail('')
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  const variantStyles = {
    default: {
      container: 'bg-gradient-to-r from-pink-600 to-purple-600 text-white',
      input: 'bg-white/20 border-white/30 text-white placeholder:text-white/60',
      button: 'bg-white text-pink-600 hover:bg-white/90'
    },
    minimal: {
      container: 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white',
      input: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      button: 'bg-pink-600 text-white hover:bg-pink-700'
    },
    dark: {
      container: 'bg-gray-900 text-white',
      input: 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400',
      button: 'bg-pink-600 text-white hover:bg-pink-700'
    }
  }

  const styles = variantStyles[variant]

  return (
    <section className={cn("py-12", className)}>
      <div className={cn(
        "container mx-auto px-4",
        styles.container,
        "rounded-2xl p-8 md:p-12"
      )}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Mail className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-white/80 dark:text-gray-300 mb-6">{description}</p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "flex-1 h-12",
                  styles.input
                )}
                disabled={isSubscribing || isSuccess}
                required
              />
              <Button
                type="submit"
                className={cn(
                  "h-12 px-6 min-w-[120px]",
                  styles.button
                )}
                disabled={isSubscribing || isSuccess}
              >
                {isSuccess ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isSubscribing ? (
                  'Subscribing...'
                ) : (
                  <>
                    Subscribe
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-white/60 mt-4">
              By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
            </p>

            {/* Success Message */}
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm text-green-300"
              >
                ✓ Thanks for subscribing! Check your email for confirmation.
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}