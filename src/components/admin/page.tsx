// src/app/admin/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminLayout from "./AdminLayout"
import AnalyticsDashboard from "./AnalyticsDashboard"

export default function AdminPage() {
  const [dashboardKey, setDashboardKey] = useState(0)

  // ✅ Use useMemo to memoize the dashboard component
  const dashboard = useMemo(() => (
    <AnalyticsDashboard key={dashboardKey} />
  ), [dashboardKey])

  useEffect(() => {
    // Optional: Refresh data on specific conditions
  }, [])

  return (
    <AdminLayout>
      {dashboard}
    </AdminLayout>
  )
}