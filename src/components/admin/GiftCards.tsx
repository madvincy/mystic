// src/components/admin/GiftCards.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Gift,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Copy,
  Mail,
  Send,
  Printer,
  Palette,
  Calendar,
  User,
  MessageSquare,
  DollarSign,
  BarChart,
  TrendingUp,
  Filter,
  Eye
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Badge } from '@/components/shadCn/ui/badge'
import { Card, CardContent } from '@/components/shadCn/ui/card'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadCn/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadCn/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadCn/ui/select'
import { Label } from '@/components/shadCn/ui/label'
import { Textarea } from '@/components/shadCn/ui/textarea'

interface GiftCard {
  id: string
  code: string
  amount: number
  balance: number
  status: 'active' | 'used' | 'expired' | 'pending'
  recipient_name: string
  recipient_email: string
  sender_name: string
  sender_email?: string
  message: string
  design: string
  theme_color: string
  expires_at: string
  used_at: string | null
  delivered_at: string | null
  created_at: string
  created_by: string | null
  delivery_method: 'email' | 'sms' | 'print'
  delivery_status: 'pending' | 'sent' | 'failed' | 'delivered'
  pdf_url: string | null
  download_count: number
  metadata: any
}

// Design templates
const DESIGNS = [
  { id: 'classic', name: 'Classic', preview: '🎁' },
  { id: 'elegant', name: 'Elegant', preview: '✨' },
  { id: 'modern', name: 'Modern', preview: '🌟' },
  { id: 'minimal', name: 'Minimal', preview: '💎' },
  { id: 'luxury', name: 'Luxury', preview: '👑' },
]

// Theme colors
const THEME_COLORS = [
  { id: 'pink-600', name: 'Pink', class: 'bg-pink-600' },
  { id: 'purple-600', name: 'Purple', class: 'bg-purple-600' },
  { id: 'blue-600', name: 'Blue', class: 'bg-blue-600' },
  { id: 'green-600', name: 'Green', class: 'bg-green-600' },
  { id: 'red-600', name: 'Red', class: 'bg-red-600' },
  { id: 'amber-600', name: 'Amber', class: 'bg-amber-600' },
  { id: 'indigo-600', name: 'Indigo', class: 'bg-indigo-600' },
]

export default function GiftCards() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCard, setEditingCard] = useState<Partial<GiftCard>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [cardToSend, setCardToSend] = useState<GiftCard | null>(null)

  const itemsPerPage = 10

  // ✅ Auto-expire gift cards on load
  useEffect(() => {
    const autoExpire = async () => {
      const { error } = await supabase.rpc('auto_expire_gift_cards')
      if (error) console.error('Auto-expire error:', error)
    }
    autoExpire()
  }, [])

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const fetchGiftCards = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGiftCards(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch gift cards: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateCode = () => {
    const prefix = 'GC'
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = prefix
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  // ✅ Save gift card with validation
  const saveGiftCard = async () => {
    try {
      if (!editingCard.amount || editingCard.amount <= 0) {
        toast.error('Amount must be greater than 0')
        return
      }
      if (!editingCard.recipient_email) {
        toast.error('Recipient email is required')
        return
      }
      if (!editingCard.recipient_name) {
        toast.error('Recipient name is required')
        return
      }

      // ✅ Validate expiry date
      const expiryDate = new Date(editingCard.expires_at || '')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (expiryDate < today) {
        toast.error('Expiry date cannot be in the past')
        return
      }

      const data = {
        code: editingCard.code || generateCode(),
        amount: editingCard.amount,
        balance: editingCard.amount,
        status: 'active',
        recipient_name: editingCard.recipient_name,
        recipient_email: editingCard.recipient_email,
        sender_name: editingCard.sender_name || '',
        message: editingCard.message || '',
        expires_at: editingCard.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        design: editingCard.design || 'classic',
        theme_color: editingCard.theme_color || 'pink-600',
        delivery_method: editingCard.delivery_method || 'email',
        delivery_status: 'pending',
        created_by: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      let result
      if (editingCard.id) {
        const { data: updated, error } = await supabase
          .from('gift_cards')
          .update(data)
          .eq('id', editingCard.id)
          .select()
          .single()

        if (error) throw error
        result = updated
        toast.success('Gift card updated successfully')
      } else {
        const { data: created, error } = await supabase
          .from('gift_cards')
          .insert(data)
          .select()
          .single()

        if (error) throw error
        result = created
        toast.success('Gift card created successfully')
      }

      setShowDialog(false)
      setEditingCard({})
      await fetchGiftCards()
      
      // ✅ Auto-send email if created
      if (!editingCard.id && result) {
        await handleSendGiftCard(result.id)
      }
    } catch (error: any) {
      toast.error('Failed to save gift card: ' + error.message)
    }
  }

  // ✅ Send gift card email with PDF attachment
  const handleSendGiftCard = async (cardId: string) => {
    setSendingEmail(cardId)
    try {
      const { data: card, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('id', cardId)
        .single()

      if (error) throw error

      // Call the send-gift-card API endpoint
      const response = await fetch('/api/gift-cards/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardId: card.id,
          generatePDF: true 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send email')
      }

      const result = await response.json()
      toast.success(`Gift card sent to ${card.recipient_email}`)

      // Update delivery status
      await supabase
        .from('gift_cards')
        .update({ 
          delivery_status: 'sent',
          delivered_at: new Date().toISOString()
        })
        .eq('id', cardId)

      await fetchGiftCards()
    } catch (error: any) {
      toast.error('Failed to send gift card: ' + error.message)
    } finally {
      setSendingEmail(null)
      setShowSendDialog(false)
    }
  }

  const deleteGiftCard = async () => {
    if (!cardToDelete) return
    try {
      const { error } = await supabase
        .from('gift_cards')
        .delete()
        .eq('id', cardToDelete)

      if (error) throw error
      toast.success('Gift card deleted')
      await fetchGiftCards()
      setShowDeleteDialog(false)
      setCardToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete gift card: ' + error.message)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  // ✅ Download PDF gift card
  const downloadPDF = async (cardId: string) => {
    try {
      const response = await fetch(`/api/gift-cards/pdf?id=${cardId}`)
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gift-card-${cardId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      
      // Update download count
      await supabase
        .from('gift_cards')
        .update({ download_count: supabase.rpc('increment', { count: 1 }) })
        .eq('id', cardId)
      
      toast.success('PDF downloaded')
    } catch (error: any) {
      toast.error('Failed to download PDF: ' + error.message)
    }
  }

  const filteredCards = giftCards.filter(c => {
    const matchesSearch = 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredCards.length / itemsPerPage)
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const stats = {
    total: giftCards.length,
    active: giftCards.filter(c => c.status === 'active').length,
    used: giftCards.filter(c => c.status === 'used').length,
    expired: giftCards.filter(c => c.status === 'expired').length,
    totalValue: giftCards.reduce((sum, c) => sum + c.amount, 0),
    pending: giftCards.filter(c => c.delivery_status === 'pending').length,
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    used: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gift Cards</h2>
          <p className="text-gray-500">Manage gift cards and vouchers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchGiftCards}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingCard({
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })
              setShowDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Gift Card
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Cards', 
            value: stats.total, 
            icon: Gift, 
            color: 'text-pink-600',
            subtext: `KSh ${stats.totalValue.toLocaleString()} value`
          },
          { 
            label: 'Active', 
            value: stats.active, 
            icon: CheckCircle, 
            color: 'text-green-600' 
          },
          { 
            label: 'Pending Delivery', 
            value: stats.pending, 
            icon: Clock, 
            color: 'text-yellow-600' 
          },
          { 
            label: 'Used / Expired', 
            value: stats.used + stats.expired, 
            icon: XCircle, 
            color: 'text-gray-600' 
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
                {stat.subtext && (
                  <p className="text-xs text-gray-400">{stat.subtext}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search gift cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gift Cards List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto" />
                  </td>
                </tr>
              ) : paginatedCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No gift cards found
                  </td>
                </tr>
              ) : (
                paginatedCards.map((card) => (
                  <motion.tr
                    key={card.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{card.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(card.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{card.recipient_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{card.recipient_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      KSh {card.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      KSh {card.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[card.status] || 'bg-gray-100'}>
                        {card.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {card.delivery_status === 'sent' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : card.delivery_status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-xs">{card.delivery_status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(card.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {card.status === 'active' && card.delivery_status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCardToSend(card)
                              setShowSendDialog(true)
                            }}
                            disabled={sendingEmail === card.id}
                            className="text-green-600"
                          >
                            {sendingEmail === card.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-pink-600 border-t-transparent rounded-full" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadPDF(card.id)}
                          className="text-blue-600"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCard(card)
                            setShowDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            setCardToDelete(card.id)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCards.length)} of {filteredCards.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Gift Card Dialog - Enhanced */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCard.id ? 'Edit Gift Card' : 'Create Gift Card'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingCard.id && (
              <div className="space-y-2">
                <Label>Code</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={editingCard.code || ''}
                    disabled
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(editingCard.code || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={editingCard.amount || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, amount: parseFloat(e.target.value) })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={editingCard.expires_at?.split('T')[0] || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, expires_at: e.target.value })}
                />
                <p className="text-xs text-gray-500">Must be today or in the future</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Name *</Label>
                <Input
                  value={editingCard.recipient_name || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, recipient_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Recipient Email *</Label>
                <Input
                  type="email"
                  value={editingCard.recipient_email || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, recipient_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sender Name</Label>
                <Input
                  value={editingCard.sender_name || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, sender_name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <Select
                  value={editingCard.delivery_method || 'email'}
                  onValueChange={(value) => setEditingCard({ ...editingCard, delivery_method: value as 'email' | 'sms' | 'print' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">📧 Email</SelectItem>
                    <SelectItem value="sms">📱 SMS</SelectItem>
                    <SelectItem value="print">🖨️ Print</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={editingCard.message || ''}
                onChange={(e) => setEditingCard({ ...editingCard, message: e.target.value })}
                placeholder="Happy Birthday! Enjoy this gift card from me."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Design Template</Label>
                <Select
                  value={editingCard.design || 'classic'}
                  onValueChange={(value) => setEditingCard({ ...editingCard, design: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select design" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNS.map(design => (
                      <SelectItem key={design.id} value={design.id}>
                        {design.preview} {design.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="flex flex-wrap gap-2">
                  {THEME_COLORS.map(color => (
                    <button
                      key={color.id}
                      className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                        editingCard.theme_color === color.id ? 'border-black dark:border-white' : 'border-transparent'
                      }`}
                      onClick={() => setEditingCard({ ...editingCard, theme_color: color.id })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveGiftCard}
              >
                {editingCard.id ? 'Update' : 'Create & Send'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDialog(false)
                  setEditingCard({})
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Gift Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium">Send to: {cardToSend?.recipient_email}</p>
              <p className="text-sm text-gray-500">Amount: KSh {cardToSend?.amount?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Code: {cardToSend?.code}</p>
            </div>
            <p className="text-sm text-gray-500">
              A beautiful HTML email will be sent with a PDF gift card attachment.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={() => {
                  if (cardToSend) {
                    handleSendGiftCard(cardToSend.id)
                  }
                }}
                disabled={sendingEmail === cardToSend?.id}
              >
                {sendingEmail === cardToSend?.id ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSendDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gift Card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGiftCard} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}