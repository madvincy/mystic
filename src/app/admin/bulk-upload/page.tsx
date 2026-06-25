// src/app/admin/bulk-upload/page.tsx
'use client'

import AdminLayout from "../../../components/admin/AdminLayout"
import BulkUpload from "../../../components/admin/BulkUpload"



export default function BulkUploadPage() {
  return (
    <AdminLayout>
      <BulkUpload />
    </AdminLayout>
  )
}