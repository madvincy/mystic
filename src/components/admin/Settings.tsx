// src/components/admin/Settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Globe,
  DollarSign,
  Truck,
  Mail,
  Bell,
  Shield,
  Palette,
  Database,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  Smartphone,
  MessageCircle,
  MapPin,
  Phone,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Lock,
  User,
  Mail as MailIcon,
  Plus,
  Trash2,
  Edit,
  MoveUp,
  MoveDown
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { Input } from '@/components/shadCn/ui/input'
import { Label } from '@/components/shadCn/ui/label'
import { Switch } from '@/components/shadCn/ui/switch'
import { Badge } from '@/components/shadCn/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadCn/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadCn/ui/tabs'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/shadCn/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadCn/ui/select'

interface Setting {
  id: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  group: string
  description: string
  is_public: boolean
  created_at: string
  updated_at: string
}

interface SocialLink {
  id: string
  platform: string
  url: string
  icon: string
  is_active: boolean
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [showSocialDialog, setShowSocialDialog] = useState(false)
  const [editingSocial, setEditingSocial] = useState<Partial<SocialLink>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [socialToDelete, setSocialToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchSocialLinks()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('group', { ascending: true })

      if (error) throw error
      setSettings(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch settings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSocialLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('platform', { ascending: true })

      if (error) throw error
      setSocialLinks(data || [])
    } catch (error: any) {
      console.error('Error fetching social links:', error)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ 
          value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)

      if (error) throw error
      
      // Update local state
      setSettings(prev => 
        prev.map(s => s.key === key ? { ...s, value } : s)
      )
    } catch (error: any) {
      toast.error('Failed to update setting: ' + error.message)
    }
  }

  const saveAllSettings = async () => {
    setSaving(true)
    try {
      // Save all settings in parallel
      const updates = settings.map(setting => 
        supabase
          .from('settings')
          .update({ 
            value: setting.value,
            updated_at: new Date().toISOString()
          })
          .eq('key', setting.key)
      )

      await Promise.all(updates)
      toast.success('All settings saved successfully!')
      fetchSettings()
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const saveSocialLink = async () => {
    try {
      if (!editingSocial.platform || !editingSocial.url) {
        toast.error('Platform and URL are required')
        return
      }

      const data = {
        platform: editingSocial.platform,
        url: editingSocial.url,
        icon: editingSocial.icon || editingSocial.platform.toLowerCase(),
        is_active: editingSocial.is_active !== undefined ? editingSocial.is_active : true,
        updated_at: new Date().toISOString(),
      }

      if (editingSocial.id) {
        const { error } = await supabase
          .from('social_links')
          .update(data)
          .eq('id', editingSocial.id)

        if (error) throw error
        toast.success('Social link updated')
      } else {
        const { error } = await supabase
          .from('social_links')
          .insert({
            ...data,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        toast.success('Social link added')
      }

      setShowSocialDialog(false)
      setEditingSocial({})
      fetchSocialLinks()
    } catch (error: any) {
      toast.error('Failed to save social link: ' + error.message)
    }
  }

  const deleteSocialLink = async () => {
    if (!socialToDelete) return
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', socialToDelete)

      if (error) throw error
      toast.success('Social link deleted')
      fetchSocialLinks()
      setShowDeleteDialog(false)
      setSocialToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete social link: ' + error.message)
    }
  }

  const toggleSocialStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`Social link ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchSocialLinks()
    } catch (error: any) {
      toast.error('Failed to update social link: ' + error.message)
    }
  }

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key)
    return setting?.value
  }

  const updateSettingValue = (key: string, value: any) => {
    setSettings(prev => 
      prev.map(s => s.key === key ? { ...s, value } : s)
    )
  }

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value || false}
            onCheckedChange={(checked) => {
              updateSettingValue(setting.key, checked)
              updateSetting(setting.key, checked)
            }}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              updateSettingValue(setting.key, val)
              updateSetting(setting.key, val)
            }}
            className="max-w-xs"
          />
        )
      case 'json':
        return (
          <Textarea
            value={JSON.stringify(setting.value || {}, null, 2)}
            onChange={(e) => {
              try {
                const val = JSON.parse(e.target.value)
                updateSettingValue(setting.key, val)
                updateSetting(setting.key, val)
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            className="font-mono text-sm"
          />
        )
      case 'array':
        return (
          <div className="flex flex-wrap gap-2">
            {(setting.value || []).map((item: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {item}
                <button
                  onClick={() => {
                    const newArray = [...(setting.value || [])]
                    newArray.splice(index, 1)
                    updateSettingValue(setting.key, newArray)
                    updateSetting(setting.key, newArray)
                  }}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
            <Input
              placeholder="Add item..."
              className="w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement
                  const val = input.value.trim()
                  if (val) {
                    const newArray = [...(setting.value || []), val]
                    updateSettingValue(setting.key, newArray)
                    updateSetting(setting.key, newArray)
                    input.value = ''
                  }
                }
              }}
            />
          </div>
        )
      default:
        return (
          <Input
            value={setting.value || ''}
            onChange={(e) => {
              updateSettingValue(setting.key, e.target.value)
              updateSetting(setting.key, e.target.value)
            }}
            className="max-w-md"
          />
        )
    }
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.group]) acc[setting.group] = []
    acc[setting.group].push(setting)
    return acc
  }, {} as Record<string, Setting[]>)

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'store', label: 'Store', icon: ShoppingBag },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const socialPlatforms = [
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'twitter', label: 'Twitter', icon: Twitter },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-gray-500">Manage your store configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={saveAllSettings}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            {tab.id === 'social' ? (
              // Social Links Section
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Social Media Links</h3>
                    <p className="text-sm text-gray-500">Manage your social media presence</p>
                  </div>
                  <Button
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={() => {
                      setEditingSocial({})
                      setShowSocialDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Social Link
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {socialLinks.map((link) => {
                    const platform = socialPlatforms.find(p => p.value === link.platform)
                    const Icon = platform?.icon || Globe
                    return (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                  <Icon className="h-5 w-5 text-pink-600" />
                                </div>
                                <div>
                                  <p className="font-medium capitalize">{link.platform}</p>
                                  <p className="text-sm text-gray-500 truncate max-w-[150px]">
                                    {link.url}
                                  </p>
                                </div>
                              </div>
                              <Badge className={link.is_active ? 'bg-green-600' : 'bg-red-600'}>
                                {link.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setEditingSocial(link)
                                  setShowSocialDialog(true)
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant={link.is_active ? "destructive" : "default"}
                                size="sm"
                                className="flex-1"
                                onClick={() => toggleSocialStatus(link.id, link.is_active)}
                              >
                                {link.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSocialToDelete(link.id)
                                  setShowDeleteDialog(true)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                  {socialLinks.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No social links added yet
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Settings Groups
              Object.entries(groupedSettings)
                .filter(([group]) => {
                  const groupMap: Record<string, string> = {
                    general: 'general',
                    store: 'store',
                    shipping: 'shipping',
                    payment: 'payment',
                    notifications: 'notifications',
                    security: 'security',
                  }
                  return groupMap[group] === tab.id
                })
                .map(([group, settings]) => (
                  <Card key={group}>
                    <CardHeader>
                      <CardTitle className="capitalize">{group} Settings</CardTitle>
                      <CardDescription>
                        Configure your {group} settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {settings.map((setting) => (
                        <div key={setting.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                          <div className="flex-1">
                            <Label className="capitalize">
                              {setting.key.replace(/_/g, ' ')}
                            </Label>
                            {setting.description && (
                              <p className="text-sm text-gray-500">{setting.description}</p>
                            )}
                          </div>
                          <div className="md:w-1/2">
                            {renderSettingInput(setting)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Social Link Dialog */}
      <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSocial.id ? 'Edit Social Link' : 'Add Social Link'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform *</Label>
              <select
                value={editingSocial.platform || ''}
                onChange={(e) => setEditingSocial({ ...editingSocial, platform: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select platform</option>
                {socialPlatforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={editingSocial.url || ''}
                onChange={(e) => setEditingSocial({ ...editingSocial, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingSocial.is_active !== undefined ? editingSocial.is_active : true}
                onCheckedChange={(checked) => setEditingSocial({ ...editingSocial, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={saveSocialLink}
              >
                {editingSocial.id ? 'Update' : 'Add'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowSocialDialog(false)
                  setEditingSocial({})
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
            <AlertDialogTitle>Delete Social Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSocialLink} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}