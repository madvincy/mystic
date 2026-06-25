// src/app/admin/page.tsx
'use client'

import AdminLayout from "./AdminLayout"
import AnalyticsDashboard from "./AnalyticsDashboard"


export default function AdminPage() {
  return (
    <AdminLayout>
      <AnalyticsDashboard/>
    </AdminLayout>
  )
}