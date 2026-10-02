'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Clock, CreditCard, Mail, MapPin, Package, Printer, Trash2, Truck, User, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/shadCn/ui/badge'
import { Button } from '@/components/shadCn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
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

interface AdminOrderDetailsProps {
  orderId: string
}

interface OrderRecord {
  id: string
  order_number: string
  user_id: string | null
  total_amount: number
  shipping_cost: number | null
  tax: number | null
  status: string
  payment_method: string
  payment_status: string
  payment_receipt?: string | null
  payment_error?: string | null
  shipping_address: Record<string, string> | null
  created_at: string
  updated_at: string
  user?: { name?: string; email?: string; phone?: string } | null
  items: Array<{
    id: string
    product_id: string
    variant_id?: string | null
    quantity: number
    price: number
    product?: { name?: string; images?: string[] } | null
    variant?: { variant_type?: string; variant_value?: string; sku?: string } | null
  }>
}

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const paymentOptions = ['pending', 'paid', 'failed', 'refunded']

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const paymentStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

export default function AdminOrderDetails({ orderId }: AdminOrderDetailsProps) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(name, email, phone),
          items:order_items(
            *,
            product:products(name, images),
            variant:product_variants(variant_type, variant_value, sku)
          )
        `)
        .eq('id', orderId)
        .maybeSingle()

      if (error) throw error
      setOrder(data as OrderRecord | null)
    } catch (error) {
      console.error('Failed to load order:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const updateOrder = async (field: 'status' | 'payment_status', value: string) => {
    if (!order || order[field] === value) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', order.id)

      if (error) throw error
      setOrder({ ...order, [field]: value, updated_at: new Date().toISOString() })
      toast.success(field === 'status' ? 'Order status updated' : 'Payment status updated')
    } catch (error) {
      console.error('Failed to update order:', error)
      toast.error('Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  const deleteOrder = async () => {
    if (!order) return
    setUpdating(true)
    try {
      const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', order.id)
      if (itemsError) throw itemsError
      const { error } = await supabase.from('orders').delete().eq('id', order.id)
      if (error) throw error
      toast.success('Order deleted')
      router.push('/admin/orders')
    } catch (error) {
      console.error('Failed to delete order:', error)
      toast.error('Failed to delete order')
    } finally {
      setUpdating(false)
      setShowDeleteDialog(false)
    }
  }

  const handlePrint = () => window.print()

  const address = order?.shipping_address || {}
  const customerName = order?.user?.name || address.name || 'Guest customer'
  const customerEmail = order?.user?.email || address.email || ''
  const customerPhone = order?.user?.phone || address.phone || ''
  const subtotal = order?.items?.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0) || 0
  const shipping = Number(order?.shipping_cost || 0)
  const tax = Number(order?.tax || 0)

  if (loading) {
    return <div className="flex min-h-72 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" /></div>
  }

  if (!order) {
    return <div className="space-y-4 py-12 text-center"><Package className="mx-auto h-12 w-12 text-gray-400" /><h1 className="text-xl font-semibold">Order not found</h1><Link href="/admin/orders"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to orders</Button></Link></div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 print:max-w-none print:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="space-y-3">
          <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All orders</Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-pink-600">Order details</p>
            <h1 className="mt-1 break-all text-2xl font-bold sm:text-3xl">#{order.order_number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()} · Updated {new Date(order.updated_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print</Button>
          {customerEmail && <a href={`mailto:${customerEmail}?subject=${encodeURIComponent(`Order ${order.order_number}`)}`}><Button variant="outline"><Mail className="mr-2 h-4 w-4" />Email customer</Button></a>}
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={updating}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-border shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Order total</p><p className="mt-1 text-2xl font-bold">KSh {Number(order.total_amount).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{order.items?.length || 0} line items</p></CardContent></Card>
        <Card className="border border-border shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Order status</p><Badge className={`mt-2 capitalize ${statusStyles[order.status] || statusStyles.pending}`}><Package className="mr-1 h-3.5 w-3.5" />{order.status}</Badge><p className="mt-2 text-xs text-muted-foreground">Manage fulfillment below</p></CardContent></Card>
        <Card className="border border-border shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Payment</p><Badge className={`mt-2 capitalize ${paymentStyles[order.payment_status] || paymentStyles.pending}`}><CreditCard className="mr-1 h-3.5 w-3.5" />{order.payment_status}</Badge><p className="mt-2 text-xs capitalize text-muted-foreground">{order.payment_method}</p></CardContent></Card>
        <Card className="border border-border shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Customer</p><p className="mt-1 truncate font-semibold">{customerName}</p><p className="truncate text-sm text-muted-foreground">{customerEmail || 'No email on file'}</p></CardContent></Card>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-pink-600" />Items</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="pb-3 pr-4">Product</th><th className="pb-3 px-2">SKU / Variant</th><th className="pb-3 px-2 text-right">Qty</th><th className="pb-3 px-2 text-right">Unit</th><th className="pb-3 pl-2 text-right">Total</th></tr></thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id} className="border-b border-border/70 last:border-0">
                        <td className="py-4 pr-4"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">{item.product?.images?.[0] ? <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}</div><span className="font-medium">{item.product?.name || 'Removed product'}</span></div></td>
                        <td className="px-2 py-4 text-muted-foreground">{item.variant?.sku || '—'}{item.variant?.variant_value ? ` · ${item.variant.variant_value}` : ''}</td>
                        <td className="px-2 py-4 text-right">{item.quantity}</td>
                        <td className="px-2 py-4 text-right">KSh {Number(item.price).toLocaleString()}</td>
                        <td className="py-4 pl-2 text-right font-semibold">KSh {(Number(item.price) * Number(item.quantity)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ml-auto mt-4 max-w-sm space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Items subtotal</span><span>KSh {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>KSh {shipping.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>KSh {tax.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><span>Total</span><span className="text-pink-600">KSh {Number(order.total_amount).toLocaleString()}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-pink-600" />Fulfillment</CardTitle></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="order-status" className="text-sm font-medium">Order status</label>
                <select id="order-status" value={order.status} disabled={updating} onChange={(event) => updateOrder('status', event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {statusOptions.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Last changed {new Date(order.updated_at).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="payment-status" className="text-sm font-medium">Payment status</label>
                <select id="payment-status" value={order.payment_status} disabled={updating} onChange={(event) => updateOrder('payment_status', event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {paymentOptions.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                </select>
                {order.payment_receipt && <p className="break-all text-xs text-muted-foreground">Receipt: {order.payment_receipt}</p>}
                {order.payment_error && <p className="text-xs text-red-600">{order.payment_error}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-pink-600" />Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="font-semibold">{customerName}</p><p className="break-all text-muted-foreground">{customerEmail || 'No email on file'}</p></div>
              <div className="border-t border-border pt-3"><p className="text-xs uppercase text-muted-foreground">Phone</p><p>{customerPhone || 'Not provided'}</p></div>
              {order.user_id && <Link href={`/admin/users?search=${encodeURIComponent(customerEmail)}`} className="inline-block text-sm text-pink-600 hover:underline">View customer account</Link>}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-pink-600" />Delivery address</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{address.name || customerName}</p>
              <p>{address.address || 'No address provided'}</p>
              <p>{[address.city, address.country].filter(Boolean).join(', ')}</p>
              <p>{address.phone || customerPhone}</p>
              {address.latitude && address.longitude && <a className="mt-2 inline-block text-pink-600 hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}>Open delivery location</a>}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm print:hidden">
            <CardHeader><CardTitle>Order actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print order</Button>
              {customerEmail && <a className="block" href={`mailto:${customerEmail}?subject=${encodeURIComponent(`Order ${order.order_number}`)}`}><Button variant="outline" className="w-full justify-start"><Mail className="mr-2 h-4 w-4" />Email customer</Button></a>}
              <a className="block" href={`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customerName}, we are contacting you about order ${order.order_number}.`)}`} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full justify-start"><Truck className="mr-2 h-4 w-4" />WhatsApp customer</Button></a>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete order #{order.order_number}?</AlertDialogTitle><AlertDialogDescription>This permanently deletes the order and its line items. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep order</AlertDialogCancel><AlertDialogAction onClick={deleteOrder} className="bg-red-600 hover:bg-red-700">Delete order</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
