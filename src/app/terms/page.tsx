// src/app/terms/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Scale, Shield, AlertCircle, FileText, Users, Clock, CreditCard, Truck, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/shadCn/ui/card'

export default function TermsPage() {
  const sections = [
    {
      icon: Scale,
      title: '1. Acceptance of Terms',
      content: `By using Mystic Wines website and services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. These terms constitute a legally binding agreement between you and Mystic Wines (hereinafter "the Company").`
    },
    {
      icon: AlertCircle,
      title: '2. Age Restriction',
      content: `Access to this website and purchase of alcohol products is strictly limited to individuals who are 18 years or older. By using this website, you confirm that you are at least 18 years of age. We reserve the right to request proof of age at any time and may refuse service if proof of age is not provided or deemed insufficient.`
    },
    {
      icon: CreditCard,
      title: '3. Product Information & Pricing',
      content: `We make every effort to ensure that product descriptions, images, and pricing are accurate. However, we do not warrant that product descriptions or other content are error-free. Prices are subject to change without notice. We reserve the right to correct any errors inaccuracies or omissions and to change or update information at any time.`
    },
    {
      icon: Users,
      title: '4. Orders & Payments',
      content: `All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason. Payment must be made at the time of order placement. We accept payments via M-Pesa, Credit/Debit Cards, and Cash on Delivery. All payments are processed securely through our payment partners.`
    },
    {
      icon: Truck,
      title: '5. Delivery Policy',
      content: `We deliver within Kenya. Delivery times are estimates and may vary. We are not responsible for delays caused by circumstances beyond our control. Risk of loss and title for products pass to you upon delivery. You must provide accurate delivery information and ensure someone is available to receive the delivery.`
    },
    {
      icon: Clock,
      title: '6. Returns & Refunds',
      content: `We accept returns within 7 days of delivery for unopened and undamaged products. Products must be in their original packaging. To initiate a return, contact us at returns@mysticwines.co.ke. Refunds will be processed within 3-5 business days after we receive and inspect the returned product.`
    },
    {
      icon: Shield,
      title: '7. Intellectual Property',
      content: `All content on this website, including text, graphics, logos, images, and software, is the property of Mystic Wines or its content suppliers and is protected by Kenyan and international copyright laws. You may not reproduce, distribute, or create derivative works without our express written permission.`
    },
    {
      icon: FileText,
      title: '8. Privacy Policy',
      content: `Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information. By using our services, you consent to the collection and use of your information as described in our Privacy Policy.`
    },
    {
      icon: CheckCircle,
      title: '9. Governing Law',
      content: `These Terms and Conditions shall be governed by and construed in accordance with the laws of Kenya. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Kenya. This is in accordance with the Kenyan Constitution, the Consumer Protection Act, and other applicable laws.`
    },
    {
      icon: AlertCircle,
      title: '10. Limitation of Liability',
      content: `Mystic Wines shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the use or inability to use our services. Our liability shall be limited to the amount paid for the products purchased. This limitation applies to the fullest extent permitted by Kenyan law.`
    },
    {
      icon: Scale,
      title: '11. Modifications to Terms',
      content: `We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on this website. Your continued use of our services after any changes constitutes your acceptance of the new terms. We encourage you to review these terms periodically.`
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-full">
              <Scale className="h-12 w-12 text-pink-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last Updated: {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            These terms govern your use of Mystic Wines website and services
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8 border-0 shadow-sm bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <p className="text-gray-700 dark:text-gray-300">
              Welcome to Mystic Wines. By accessing or using our website and services, you agree to be bound by 
              these Terms and Conditions. Please read them carefully before making any purchase or using our services.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Effective Date: {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-pink-600" />
                Governing Law: Kenya
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-pink-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center"
        >
          <h3 className="text-xl font-bold mb-2">Questions About These Terms?</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            If you have any questions about our Terms & Conditions, please don't hesitate to contact us.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:legal@mysticwines.co.ke" className="text-pink-600 hover:underline">
              ✉️ legal@mysticwines.co.ke
            </a>
            <span className="text-gray-400">|</span>
            <a href="tel:0710835445" className="text-pink-600 hover:underline">
              📞 0710 835 445
            </a>
            <span className="text-gray-400">|</span>
            <a href="/contact" className="text-pink-600 hover:underline">
              📍 Contact Form
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}