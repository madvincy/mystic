import AdminOrderDetails from '@/components/admin/AdminOrderDetails'

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminOrderDetails orderId={id} />
}
