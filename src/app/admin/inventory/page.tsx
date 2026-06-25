// src/app/admin/inventory/page.tsx
'use client'

import AdminLayout from "../../../components/admin/AdminLayout"
import InventoryManagement from "../../../components/admin/InventoryManagement"

export default function AdminInventoryPage() {
  return (
    <AdminLayout>
      <InventoryManagement />
    </AdminLayout>
  )
}