'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'

const CONSENT_KEY = 'mystic-cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }))
    } finally {
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <aside
      role="dialog"
      aria-label="Cookie notice"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-5xl overflow-hidden rounded-2xl border border-pink-200 bg-white/95 shadow-[0_18px_60px_rgba(31,12,27,0.24)] backdrop-blur-xl dark:border-pink-900/60 dark:bg-gray-950/95 sm:inset-x-6"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pink-500 via-rose-500 to-purple-600" />
      <div className="flex flex-col gap-5 p-5 pl-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6 sm:pl-8">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-semibold">A little cookie note</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-950/50 dark:text-green-300"><ShieldCheck className="h-3 w-3" />Your choice stays saved</span>
            </div>
            <p id="cookie-consent-description" className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              We use cookies to keep Mystic working smoothly and remember your preferences. Read our <Link href="/privacy" className="font-medium text-pink-700 underline underline-offset-2 hover:text-pink-800 dark:text-pink-300">privacy policy</Link> for details.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-2">
          <Button onClick={accept} className="bg-pink-600 text-white hover:bg-pink-700">Accept cookies</Button>
          <Button variant="ghost" size="icon" onClick={accept} aria-label="Dismiss cookie notice" title="Dismiss"><X className="h-4 w-4" /></Button>
        </div>
      </div>
    </aside>
  )
}
