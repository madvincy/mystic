// src/app/admin/export/page.tsx
'use client'

import ExportData from "../../../components/admin/ExportData"

import AdminLayout from "../../../components/admin/AdminLayout"



export default function ExportPage() {
  return (
    <AdminLayout>
      <ExportData />
    </AdminLayout>
  )
}