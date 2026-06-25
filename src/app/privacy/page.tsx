// src/app/privacy/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Mail, Cookie, Database, Users, FileText, CheckCircle, Clock, Server, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/shadCn/ui/card'

export default function PrivacyPage() {
  const sections = [
    {
      icon: Shield,
      title: '1. Introduction',
      content: `At Mystic Wines, we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. We comply with the Kenyan Data Protection Act, 2019 and other applicable privacy laws.`
    },
    {
      icon: Database,
      title: '2. Information We Collect',
      content: `We collect information that you provide directly to us, including but not limited to: name, email address, phone number, delivery address, payment information, and order history. We also automatically collect certain information when you visit our website, such as IP address, browser type, device information, and browsing patterns.`
    },
    {
      icon: Cookie,
      title: '3. Cookies and Tracking Technologies',
      content: `We use cookies and similar tracking technologies to enhance your experience on our website. Cookies help us remember your preferences, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings. We use both session cookies and persistent cookies.`
    },
    {
      icon: Users,
      title: '4. How We Use Your Information',
      content: `We use your information to process and deliver your orders, communicate with you about your purchases, send promotional offers and newsletters (with your consent), improve our services and website experience, and comply with legal obligations. We never sell your personal information to third parties.`
    },
    {
      icon: Lock,
      title: '5. Data Protection and Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments. However, no method of transmission over the internet is 100% secure.`
    },
    {
      icon: Eye,
      title: '6. Your Rights',
      content: `Under the Kenyan Data Protection Act, you have the right to access, correct, update, or delete your personal information. You may also withdraw consent for marketing communications at any time. To exercise these rights, contact us at privacy@mysticwines.co.ke. We will respond to your request within 30 days.`
    },
    {
      icon: Mail,
      title: '7. Marketing Communications',
      content: `With your consent, we may send you promotional emails and newsletters about new products, special offers, and events. You can unsubscribe from these communications at any time by clicking the "unsubscribe" link in any email or by contacting us directly.`
    },
    {
      icon: Server,
      title: '8. Data Retention',
      content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. We securely delete or anonymize your information when it is no longer needed.`
    },
    {
      icon: FileText,
      title: '9. Third-Party Services',
      content: `We use third-party service providers to help us operate our business, such as payment processors, delivery partners, and analytics providers. These third parties have access to your information only to perform specific tasks on our behalf and are obligated to protect your information.`
    },
    {
      icon: CheckCircle,
      title: '10. Children\'s Privacy',
      content: `Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child without parental consent, we will take steps to remove that information.`
    },
    {
      icon: Clock,
      title: '11. Updates to This Policy',
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will post the updated policy on this page and indicate the date of the latest revision. We encourage you to review this policy periodically.`
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
              <Shield className="h-12 w-12 text-pink-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your privacy matters to us. Learn how we protect your information.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Last Updated: {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Key Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Shield, title: 'Data Protection', desc: 'Compliant with Kenyan Data Protection Act, 2019' },
            { icon: Lock, title: 'Secure Transactions', desc: 'Encrypted payment processing' },
            { icon: Eye, title: 'Your Rights', desc: 'Access, correct, or delete your data anytime' },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center border-0 shadow-sm bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Privacy Sections */}
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
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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

        {/* Your Rights Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-8 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800"
        >
          <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">Your Privacy Rights</h3>
          <p className="text-green-700 dark:text-green-300 max-w-2xl mb-4">
            Under Kenyan law, you have the right to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Access your personal data',
              'Correct inaccurate data',
              'Delete your data (subject to legal retention)',
              'Withdraw consent for marketing',
              'Object to processing',
              'Data portability',
            ].map((right, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {right}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center"
        >
          <h3 className="text-xl font-bold mb-2">Questions About Your Privacy?</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            If you have any questions about our Privacy Policy or how we handle your data, please contact our Data Protection Officer.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:privacy@mysticwines.co.ke" className="text-pink-600 hover:underline">
              ✉️ privacy@mysticwines.co.ke
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