// src/app/contact/page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Textarea } from '@/components/shadCn/ui/textarea'
import { Label } from '@/components/shadCn/ui/label'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    // ✅ Honeypot field - hidden from real users
    honeypot: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setIsSuccess(false)

    try {
      // Send to API route
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // ✅ Save to Supabase for tracking (optional)
      await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'new',
          created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error('Error saving contact:', error)
        })

      setIsSuccess(true)
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' })
      
      // Reset success after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)

    } catch (error: any) {
      console.error('Contact error:', error)
      toast.error(error.message || 'Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const contactInfo = [
    { icon: MapPin, label: 'Location', value: 'Ongata Rongai, Kenya' },
    { icon: Phone, label: 'Phone', value: '0710 835 445', href: 'tel:0710835445' },
    { icon: Mail, label: 'Email', value: 'info@mysticwines.co.ke', href: 'mailto:info@mysticwines.co.ke' },
    { icon: Clock, label: 'Hours', value: 'Mon-Sat: 9AM - 8PM' },
  ]

  // ✅ Fixed social links
  const socialLinks = [
    { 
      icon: Facebook, 
      href: 'https://facebook.com/mysticwines', 
      label: 'Facebook',
      color: 'hover:bg-[#1877f2] hover:text-white'
    },
    { 
      icon: Twitter, 
      href: 'https://twitter.com/mysticwines', 
      label: 'Twitter',
      color: 'hover:bg-[#1da1f2] hover:text-white'
    },
    { 
      icon: Instagram, 
      href: 'https://instagram.com/mysticwines', 
      label: 'Instagram',
      color: 'hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#dc2743] hover:text-white'
    },
    { 
      icon: Youtube, 
      href: 'https://youtube.com/mysticwines', 
      label: 'YouTube',
      color: 'hover:bg-[#ff0000] hover:text-white'
    },
  ]

  // ✅ Fetch social links from database (optional)
  const [socialLinksFromDb, setSocialLinksFromDb] = useState<any[]>([])
  
  // Uncomment to fetch from database
  // useEffect(() => {
  //   const fetchSocialLinks = async () => {
  //     const { data } = await supabase
  //       .from('social_links')
  //       .select('*')
  //       .eq('is_active', true)
  //     if (data) setSocialLinksFromDb(data)
  //   }
  //   fetchSocialLinks()
  // }, [])

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-center mb-4">Contact Us</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          Have questions about our products, orders, or anything else? We'd love to hear from you.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                        <Icon className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{info.label}</p>
                        {info.href ? (
                          <a href={info.href} className="font-medium hover:text-pink-600 transition">
                            {info.value}
                          </a>
                        ) : (
                          <p className="font-medium">{info.value}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {/* Social Links */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-3">Follow Us</p>
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 bg-gray-100 dark:bg-gray-800 rounded-lg transition-all duration-300 ${social.color}`}
                        aria-label={social.label}
                      >
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" />
                      </a>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* ✅ Honeypot field - hidden from real users */}
                  <div className="hidden">
                    <Label htmlFor="honeypot">Leave this empty</Label>
                    <Input
                      id="honeypot"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-400">This field is for spam prevention</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isLoading || isSuccess}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isLoading || isSuccess}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      disabled={isLoading || isSuccess}
                      placeholder="Order inquiry"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      disabled={isLoading || isSuccess}
                      placeholder="Your message here..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className={`w-full text-white transition-all ${
                      isSuccess 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                    disabled={isLoading || isSuccess}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Sent Successfully!
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {isSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400 text-center">
                      ✓ Your message has been sent. We'll respond within 24 hours.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}