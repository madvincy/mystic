interface AdminNotificationLinkInput {
  action_url?: string | null
  category?: string | null
  related_id?: string | null
  related_type?: string | null
  metadata?: Record<string, unknown> | null
}

export function getAdminNotificationLink(notification: AdminNotificationLinkInput): string | null {
  const actionUrl = notification.action_url || ''
  const orderIdFromUrl = actionUrl.match(/(?:^|\/)orders\/([^/?#]+)/i)?.[1]
  const relatedType = notification.related_type?.toLowerCase() || ''
  const isOrderNotification = relatedType.includes('order') || notification.category?.toLowerCase() === 'orders' || Boolean(orderIdFromUrl)

  if (!isOrderNotification) return actionUrl || null

  const metadata = notification.metadata || {}
  const orderId = notification.related_id
    || (typeof metadata.order_id === 'string' ? metadata.order_id : null)
    || (typeof metadata.orderId === 'string' ? metadata.orderId : null)
    || orderIdFromUrl

  if (orderId) return `/admin/orders/${encodeURIComponent(orderId)}`
  return '/admin/orders'
}
