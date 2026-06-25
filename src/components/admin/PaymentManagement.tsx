// src/components/admin/PaymentManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Filter,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertCircle
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
import { Label } from '@/components/shadCn/ui/label'

interface Payment {
  id: string
  order_id: string
  amount: number
  method: 'mpesa' | 'cash' | 'card' | 'bank_transfer'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id: string
  phone: string
  mpesa_receipt: string
  error: string
  created_at: string
  updated_at: string
  completed_at: string
  order?: {
    order_number: string
    user: {
      name: string
      email: string
    }
  }
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    completed: 0,
    pending: 0,
    failed: 0
  })

  const itemsPerPage = 10

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      // ✅ Use payments table instead of payment_logs
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(
            order_number,
            user:users(name, email)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const paymentsData = data || []
      setPayments(paymentsData)
      
      // Calculate stats
      setStats({
        totalRevenue: paymentsData.reduce((sum, p) => sum + p.amount, 0),
        totalPayments: paymentsData.length,
        completed: paymentsData.filter(p => p.status === 'completed').length,
        pending: paymentsData.filter(p => p.status === 'pending').length,
        failed: paymentsData.filter(p => p.status === 'failed').length,
      })
    } catch (error: any) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`Payment ${status}`)
      fetchPayments()
    } catch (error: any) {
      toast.error('Failed to update payment: ' + error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Refunded' },
    }
    return config[status] || config.pending
  }

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'mpesa': return <Smartphone className="h-4 w-4" />
      case 'cash': return <Wallet className="h-4 w-4" />
      case 'card': return <CreditCard className="h-4 w-4" />
      case 'bank_transfer': return <Receipt className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.order?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    const matchesMethod = filterMethod === 'all' || p.method === filterMethod

    return matchesSearch && matchesStatus && matchesMethod
  })

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <p className="text-gray-500">Manage all payments and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `KSh ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Total Payments', value: stats.totalPayments, icon: CreditCard, color: 'text-blue-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
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
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Methods</option>
          <option value="mpesa">M-Pesa</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto" />
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => {
                  const statusBadge = getStatusBadge(payment.status)
                  const StatusIcon = statusBadge.icon
                  return (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">#{payment.order?.order_number}</p>
                        <p className="text-xs text-gray-500">{payment.transaction_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{payment.order?.user?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-500">{payment.order?.user?.email}</p>
                        {payment.phone && (
                          <p className="text-xs text-gray-400">{payment.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-pink-600">
                          KSh {payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.method)}
                          <span className="capitalize">{payment.method}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={payment.status}
                          onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${statusBadge.color}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowPaymentDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length}
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

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedPayment.transaction_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Order Number</Label>
                  <p className="font-medium">#{selectedPayment.order?.order_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <p className="text-xl font-bold text-pink-600">
                    KSh {selectedPayment.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge className={getStatusBadge(selectedPayment.status).color}>
                    {selectedPayment.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Method</Label>
                  <p className="capitalize">{selectedPayment.method}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p>{selectedPayment.phone || 'N/A'}</p>
                </div>
              </div>
              {selectedPayment.mpesa_receipt && (
                <div>
                  <Label className="text-xs text-gray-500">M-Pesa Receipt</Label>
                  <p className="font-mono text-sm">{selectedPayment.mpesa_receipt}</p>
                </div>
              )}
              {selectedPayment.error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <Label className="text-xs text-red-500">Error</Label>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedPayment.error}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label>Created</Label>
                  <p>{new Date(selectedPayment.created_at).toLocaleString()}</p>
                </div>
                {selectedPayment.completed_at && (
                  <div>
                    <Label>Completed</Label>
                    <p>{new Date(selectedPayment.completed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}