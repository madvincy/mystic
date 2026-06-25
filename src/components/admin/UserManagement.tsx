// src/components/admin/UserManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  Calendar,
  DollarSign,
  ShoppingBag,
  List,
  Grid
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Badge } from '@/components/shadCn/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadCn/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadCn/ui/dropdown-menu'
import { Label } from '@/components/shadCn/ui/label'
import { Textarea } from '@/components/shadCn/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadCn/ui/select'
import { useAuth } from '@/lib/hooks/useAuth'

interface User {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  is_admin: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
  order_count: number
  total_spent: number
}

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [editingUser, setEditingUser] = useState<Partial<User>>({})

  const itemsPerPage = 10

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // First, fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        setUsers([])
        setLoading(false)
        return
      }

      // Fetch order counts and totals for each user
      const userIds = usersData.map(user => user.id)
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total_amount')
        .in('user_id', userIds)

      if (ordersError) throw ordersError

      // Calculate order counts and total spent per user
      const userStats: Record<string, { order_count: number; total_spent: number }> = {}
      
      ordersData?.forEach(order => {
        if (!userStats[order.user_id]) {
          userStats[order.user_id] = { order_count: 0, total_spent: 0 }
        }
        userStats[order.user_id].order_count += 1
        userStats[order.user_id].total_spent += Number(order.total_amount) || 0
      })

      // Merge user data with stats
      const mergedData = usersData.map(user => ({
        ...user,
        order_count: userStats[user.id]?.order_count || 0,
        total_spent: userStats[user.id]?.total_spent || 0
      }))

      setUsers(mergedData)
    } catch (error: any) {
      toast.error('Failed to fetch users: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // CRUD Operations
  const createUser = async (userData: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          country: userData.country || 'Kenya',
          is_admin: userData.is_admin || false,
          is_banned: userData.is_banned || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      toast.success('User created successfully')
      fetchUsers()
      return data
    } catch (error: any) {
      toast.error('Failed to create user: ' + error.message)
      throw error
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      toast.success('User updated successfully')
      fetchUsers()
      return data
    } catch (error: any) {
      toast.error('Failed to update user: ' + error.message)
      throw error
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('User deleted successfully')
      fetchUsers()
      setShowDeleteDialog(false)
      setUserToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete user: ' + error.message)
    }
  }

  const toggleAdmin = async (id: string, isAdmin: boolean) => {
    try {
      await updateUser(id, { is_admin: !isAdmin })
      toast.success(`User ${!isAdmin ? 'promoted to' : 'demoted from'} admin`)
    } catch (error) {
      // Error already handled in updateUser
    }
  }

  const toggleBan = async (id: string, isBanned: boolean) => {
    try {
      await updateUser(id, { is_banned: !isBanned })
      toast.success(`User ${!isBanned ? 'banned' : 'unbanned'}`)
    } catch (error) {
      // Error already handled in updateUser
    }
  }

  // Bulk Operations
  const bulkDelete = async () => {
    if (selectedUsers.length === 0) return
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', selectedUsers)

      if (error) throw error
      toast.success(`${selectedUsers.length} users deleted successfully`)
      setSelectedUsers([])
      setSelectAll(false)
      fetchUsers()
    } catch (error: any) {
      toast.error('Failed to delete users: ' + error.message)
    }
  }

  const bulkRoleUpdate = async (isAdmin: boolean) => {
    if (selectedUsers.length === 0) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedUsers)

      if (error) throw error
      toast.success(`${selectedUsers.length} users updated`)
      setSelectedUsers([])
      setSelectAll(false)
      fetchUsers()
    } catch (error: any) {
      toast.error('Failed to update users: ' + error.message)
    }
  }

  // Export/Import
  const exportUsers = async () => {
    setIsExporting(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Role', 'Status', 'Created At']
      const csvRows = [
        headers.join(','),
        ...data.map((user: any) => [
          `"${user.name || ''}"`,
          `"${user.email || ''}"`,
          `"${user.phone || ''}"`,
          `"${(user.address || '').replace(/"/g, '""')}"`,
          `"${user.city || ''}"`,
          `"${user.country || ''}"`,
          user.is_admin ? 'Admin' : 'Customer',
          user.is_banned ? 'Banned' : 'Active',
          new Date(user.created_at).toLocaleDateString(),
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success(`Exported ${data.length} users`)
    } catch (error: any) {
      toast.error('Failed to export users: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const importUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        return {
          name: values[0] || '',
          email: values[1] || '',
          phone: values[2] || '',
          address: values[3] || '',
          city: values[4] || '',
          country: values[5] || 'Kenya',
          is_admin: values[6] === 'Admin',
          is_banned: values[7] === 'Banned',
        }
      })

      let successCount = 0
      let errorCount = 0

      for (const user of data) {
        if (!user.email) continue
        const { error } = await supabase
          .from('users')
          .upsert({
            ...user,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' })

        if (error) {
          errorCount++
          console.error('Error importing user:', error)
        } else {
          successCount++
        }
      }

      toast.success(`Imported ${successCount} users${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
      fetchUsers()
    } catch (error: any) {
      toast.error('Failed to import users: ' + error.message)
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  // Filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    
    const matchesRole = filterRole === 'all' || 
      (filterRole === 'admin' && user.is_admin) ||
      (filterRole === 'user' && !user.is_admin)
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && !user.is_banned) ||
      (filterStatus === 'banned' && user.is_banned)

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Stats
  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600' },
    { label: 'Admins', value: users.filter(u => u.is_admin).length, icon: Shield, color: 'text-purple-600' },
    { label: 'Banned', value: users.filter(u => u.is_banned).length, icon: Ban, color: 'text-red-600' },
    { label: 'Active', value: users.filter(u => !u.is_banned).length, icon: CheckCircle, color: 'text-green-600' },
  ]

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id))
    }
    setSelectAll(!selectAll)
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Edit dialog handlers
  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser.id) {
      // Create new user
      await createUser(editingUser)
    } else {
      // Update existing user
      await updateUser(editingUser.id, editingUser)
    }
    setShowEditDialog(false)
    setEditingUser({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-500">Manage all registered users</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportUsers}
            disabled={isExporting || users.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={importUsers}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Button variant="outline" size="sm" disabled={isImporting}>
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingUser({ is_admin: false, is_banned: false, country: 'Kenya' })
              setShowEditDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg flex flex-wrap items-center gap-3"
        >
          <span className="font-medium">{selectedUsers.length} users selected</span>
          <div className="flex-1" />
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => bulkRoleUpdate(true)}
          >
            <Shield className="h-4 w-4 mr-1" />
            Make Admin
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => bulkRoleUpdate(false)}
          >
            <ShieldOff className="h-4 w-4 mr-1" />
            Remove Admin
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={bulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="user">Customers</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <div className="flex gap-1">
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('table')} 
            className={viewMode === 'table' ? 'bg-pink-600' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('grid')} 
            className={viewMode === 'grid' ? 'bg-pink-600' : ''}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Users Display */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto" />
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-semibold">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">{user.name || 'Unnamed'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.phone && (
                          <p className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {user.phone}
                          </p>
                        )}
                        {user.address && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {user.address}, {user.city || 'N/A'}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={user.is_admin ? 'bg-purple-600' : 'bg-gray-600'}>
                          {user.is_admin ? 'Admin' : 'Customer'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={user.is_banned ? 'bg-red-600' : 'bg-green-600'}>
                          {user.is_banned ? 'Banned' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.order_count || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        KSh {user.total_spent?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user)
                              setShowUserDetails(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleAdmin(user.id, user.is_admin)}>
                              {user.is_admin ? (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Admin
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleBan(user.id, user.is_banned)}>
                              {user.is_banned ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Unban User
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2 text-red-600" />
                                  Ban User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setUserToDelete(user.id)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
              </div>
            ))
          ) : paginatedUsers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            paginatedUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-3xl font-bold text-pink-600 mx-auto">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <h3 className="font-semibold mt-2">{user.name || 'Unnamed'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex justify-center gap-2 mt-2 flex-wrap">
                  <Badge className={user.is_admin ? 'bg-purple-600' : 'bg-gray-600'}>
                    {user.is_admin ? 'Admin' : 'Customer'}
                  </Badge>
                  <Badge className={user.is_banned ? 'bg-red-600' : 'bg-green-600'}>
                    {user.is_banned ? 'Banned' : 'Active'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm">
                  <p>Orders: <span className="font-bold">{user.order_count || 0}</span></p>
                  <p>Spent: <span className="font-bold text-pink-600">KSh {user.total_spent?.toLocaleString() || '0'}</span></p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(user)
                      setShowUserDetails(true)
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-2xl font-bold text-pink-600">
                  {selectedUser.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name || 'Unnamed'}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={selectedUser.is_admin ? 'bg-purple-600' : 'bg-gray-600'}>
                      {selectedUser.is_admin ? 'Admin' : 'Customer'}
                    </Badge>
                    <Badge className={selectedUser.is_banned ? 'bg-red-600' : 'bg-green-600'}>
                      {selectedUser.is_banned ? 'Banned' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p>{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="text-xs font-mono break-all">{selectedUser.id}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p>{selectedUser.address || 'N/A'}</p>
                <p>{selectedUser.city && selectedUser.country ? `${selectedUser.city}, ${selectedUser.country}` : 'N/A'}</p>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{selectedUser.order_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-pink-600">
                    KSh {selectedUser.total_spent?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowUserDetails(false)
                    openEditDialog(selectedUser)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowUserDetails(false)
                    setUserToDelete(selectedUser.id)
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser.id ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingUser.name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={editingUser.email || ''}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                placeholder="email@example.com"
                disabled={!!editingUser.id}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editingUser.phone || ''}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                placeholder="0710 835 445"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editingUser.address || ''}
                onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={editingUser.city || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                  placeholder="Nairobi"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={editingUser.country || 'Kenya'}
                  onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                  placeholder="Kenya"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingUser.is_admin || false}
                  onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label>Admin</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingUser.is_banned || false}
                  onChange={(e) => setEditingUser({ ...editingUser, is_banned: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label>Banned</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={handleSaveEdit}
              >
                {editingUser.id ? 'Update User' : 'Create User'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingUser({})
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => userToDelete && deleteUser(userToDelete)} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}