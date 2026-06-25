// src/components/admin/BulkUpload.tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  FileText,
  XCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Label } from '@/components/shadCn/ui/label'
import { Button } from '../shadCn/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../shadCn/ui/card'
import { Progress } from '../shadCn/ui/progress'

interface UploadResult {
  success: boolean
  message: string
  errors?: string[]
  total?: number
  imported?: number
  failed?: number
}

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<'products' | 'users' | 'inventory'>('products')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setPreviewData([])
      
      // Preview CSV data
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        const preview = lines.slice(1, 6).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim())
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || ''
            return obj
          }, {} as any)
        })
        setPreviewData(preview)
      }
      reader.readAsText(selectedFile)
    }
  }

  const downloadTemplate = () => {
    let headers: string[] = []
    let sampleRow: any = {}

    switch (uploadType) {
      case 'products':
        headers = ['name', 'slug', 'description', 'price', 'category', 'subcategory', 'images', 'is_featured', 'is_bestseller', 'is_new', 'stock_status']
        sampleRow = {
          name: 'Sample Product',
          slug: 'sample-product',
          description: 'Product description',
          price: '4500',
          category: 'wine',
          subcategory: 'red-wine',
          images: 'https://example.com/image.jpg',
          is_featured: 'true',
          is_bestseller: 'false',
          is_new: 'true',
          stock_status: 'in_stock'
        }
        break
      case 'users':
        headers = ['name', 'email', 'phone', 'address', 'city', 'country']
        sampleRow = {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0712345678',
          address: '123 Main St',
          city: 'Nairobi',
          country: 'Kenya'
        }
        break
      case 'inventory':
        headers = ['product_name', 'variant_value', 'stock']
        sampleRow = {
          product_name: 'Sample Product',
          variant_value: '750ml',
          stock: '100'
        }
        break
    }

    const csvContent = [
      headers.join(','),
      Object.values(sampleRow).join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_${uploadType}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Template downloaded successfully')
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    setUploading(true)
    setProgress(0)
    setResult(null)

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || ''
          return obj
        }, {} as any)
      })

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Process in batches
      const batchSize = 50
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        const progressPercent = Math.min(((i + batch.length) / data.length) * 100, 100)
        setProgress(progressPercent)

        try {
          // Process based on upload type
          switch (uploadType) {
            case 'products':
              // Process products
              for (const item of batch) {
                // Find or create category
                let categoryId = null
                if (item.category) {
                  const { data: categories } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('slug', item.category.toLowerCase().replace(/\s+/g, '-'))
                    .single()
                  
                  if (categories) {
                    categoryId = categories.id
                  } else {
                    // Create category
                    const { data: newCategory } = await supabase
                      .from('categories')
                      .insert({ name: item.category, slug: item.category.toLowerCase().replace(/\s+/g, '-') })
                      .select()
                      .single()
                    if (newCategory) categoryId = newCategory.id
                  }
                }

                // Insert product
                const { error } = await supabase
                  .from('products')
                  .insert({
                    name: item.name,
                    slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
                    description: item.description || '',
                    price: parseFloat(item.price) || 0,
                    category_id: categoryId,
                    images: item.images ? [item.images] : [],
                    is_featured: item.is_featured === 'true',
                    is_bestseller: item.is_bestseller === 'true',
                    is_new: item.is_new === 'true',
                    stock_status: item.stock_status || 'in_stock',
                  })

                if (error) {
                  errorCount++
                  errors.push(`Product ${item.name}: ${error.message}`)
                } else {
                  successCount++
                }
              }
              break

            case 'users':
              for (const item of batch) {
                const { error } = await supabase
                  .from('users')
                  .upsert({
                    name: item.name,
                    email: item.email,
                    phone: item.phone || '',
                    address: item.address || '',
                    city: item.city || '',
                    country: item.country || 'Kenya',
                  }, { onConflict: 'email' })

                if (error) {
                  errorCount++
                  errors.push(`User ${item.email}: ${error.message}`)
                } else {
                  successCount++
                }
              }
              break

            case 'inventory':
              for (const item of batch) {
                // Find product by name
                const { data: product } = await supabase
                  .from('products')
                  .select('id')
                  .ilike('name', item.product_name)
                  .single()

                if (!product) {
                  errorCount++
                  errors.push(`Product not found: ${item.product_name}`)
                  continue
                }

                // Update or insert variant
                const { error } = await supabase
                  .from('product_variants')
                  .upsert({
                    product_id: product.id,
                    variant_type: 'volume',
                    variant_value: item.variant_value || 'default',
                    stock: parseInt(item.stock) || 0,
                  })

                if (error) {
                  errorCount++
                  errors.push(`Inventory ${item.product_name}: ${error.message}`)
                } else {
                  successCount++
                }
              }
              break
          }
        } catch (error: any) {
          errorCount += batch.length
          errors.push(`Batch error: ${error.message}`)
        }
      }

      setResult({
        success: errorCount === 0,
        message: `Upload completed: ${successCount} successful, ${errorCount} failed`,
        errors: errors.slice(0, 10),
        total: data.length,
        imported: successCount,
        failed: errorCount,
      })

      if (errorCount === 0) {
        toast.success(`Successfully uploaded ${successCount} items`)
      } else {
        toast.warning(`${successCount} items uploaded, ${errorCount} failed`)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Upload failed',
        errors: [error.message],
      })
      toast.error('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
      setProgress(100)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bulk Upload</h2>
        <p className="text-gray-500">Upload multiple items at once using CSV files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Data</CardTitle>
            <CardDescription>
              Select a CSV file to upload {uploadType}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Upload Type</Label>
              <select
                value={uploadType}
                onChange={(e) => {
                  setUploadType(e.target.value as any)
                  setFile(null)
                  setResult(null)
                  setPreviewData([])
                }}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="products">Products</option>
                <option value="users">Users</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>

            <div>
              <Label>CSV File</Label>
              <div className="mt-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file ? file.name : 'CSV files only'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {previewData.length > 0 && (
              <div>
                <Label>Preview</Label>
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="px-2 py-1 text-left">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value: any, i) => (
                            <td key={i} className="px-2 py-1 border-t border-gray-200 dark:border-gray-700 truncate max-w-32">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 text-center">
                  Uploading... {Math.round(progress)}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    Upload Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                      <p className="text-2xl font-bold">{result.total || 0}</p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="text-2xl font-bold text-green-600">{result.imported || 0}</p>
                      <p className="text-sm text-gray-500">Imported</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <p className="text-2xl font-bold text-red-600">{result.failed || 0}</p>
                      <p className="text-sm text-gray-500">Failed</p>
                    </div>
                  </div>

                  {result.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-600">Errors:</p>
                      <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}