'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Mail, RefreshCw, Search, UserRound, UserRoundX } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/shadCn/ui/badge'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'

interface Subscriber {
  id: string
  email: string
  status: string
  subscribed_at: string | null
  updated_at?: string | null
  source?: string | null
}

export default function NewsletterManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all')

  const fetchSubscribers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, status, subscribed_at, updated_at, source')
        .order('subscribed_at', { ascending: false })

      if (error) throw error
      setSubscribers(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load newsletter subscribers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const activeCount = subscribers.filter(subscriber => subscriber.status === 'active').length
  const unsubscribedCount = subscribers.filter(subscriber => subscriber.status === 'unsubscribed').length
  const filteredSubscribers = useMemo(() => subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(search.trim().toLowerCase())
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter
    return matchesSearch && matchesStatus
  }), [subscribers, search, statusFilter])

  const setSubscriberStatus = async (subscriber: Subscriber) => {
    const nextStatus = subscriber.status === 'active' ? 'unsubscribed' : 'active'
    setUpdatingId(subscriber.id)
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', subscriber.id)

      if (error) throw error
      setSubscribers(current => current.map(item => item.id === subscriber.id ? { ...item, status: nextStatus } : item))
      toast.success(nextStatus === 'active' ? 'Subscriber reactivated' : 'Subscriber unsubscribed')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update subscriber')
    } finally {
      setUpdatingId(null)
    }
  }

  const exportSubscribers = () => {
    const csv = [
      ['Email', 'Status', 'Subscribed At', 'Source'].join(','),
      ...filteredSubscribers.map(subscriber => [
        `"${subscriber.email.replaceAll('"', '""')}"`,
        subscriber.status,
        subscriber.subscribed_at || '',
        `"${(subscriber.source || '').replaceAll('"', '""')}"`,
      ].join(',')),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-600">Audience</p>
          <h1 className="mt-1 text-2xl font-bold">Newsletter subscribers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review signups, manage subscription status, and export the list.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchSubscribers} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={exportSubscribers} disabled={!filteredSubscribers.length} className="bg-pink-600 text-white hover:bg-pink-700"><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">All subscribers</p><p className="mt-1 text-2xl font-bold">{subscribers.length.toLocaleString()}</p></div>
        <div className="rounded-lg border border-green-200 bg-green-50/70 p-4 dark:border-green-900 dark:bg-green-950/30"><p className="text-sm text-green-800 dark:text-green-300">Active</p><p className="mt-1 text-2xl font-bold text-green-900 dark:text-green-200">{activeCount.toLocaleString()}</p></div>
        <div className="rounded-lg border border-border bg-muted/50 p-4"><p className="text-sm text-muted-foreground">Unsubscribed</p><p className="mt-1 text-2xl font-bold">{unsubscribedCount.toLocaleString()}</p></div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search email addresses" className="pl-9" />
        </div>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 rounded-md border border-border bg-background px-3 text-sm sm:w-48">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">Subscriber list</h2>
          <span className="text-sm text-muted-foreground">{filteredSubscribers.length} shown</span>
        </div>
        {loading ? (
          <div className="space-y-3 p-5"><div className="h-5 animate-pulse rounded bg-muted" /><div className="h-5 animate-pulse rounded bg-muted" /><div className="h-5 animate-pulse rounded bg-muted" /></div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="px-4 py-14 text-center"><Mail className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No subscribers found</p><p className="mt-1 text-sm text-muted-foreground">Try another search or status filter.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Subscribed</th><th className="px-4 py-3">Source</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody>
                {filteredSubscribers.map(subscriber => (
                  <tr key={subscriber.id} className="border-t border-border transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{subscriber.email}</td>
                    <td className="px-4 py-3"><Badge className={subscriber.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>{subscriber.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{subscriber.subscribed_at ? new Date(subscriber.subscribed_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{subscriber.source || '—'}</td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" disabled={updatingId === subscriber.id} onClick={() => setSubscriberStatus(subscriber)}>{subscriber.status === 'active' ? <><UserRoundX className="mr-2 h-4 w-4" />Unsubscribe</> : <><UserRound className="mr-2 h-4 w-4" />Reactivate</>}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
