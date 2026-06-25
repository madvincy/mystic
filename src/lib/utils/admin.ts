// src/lib/utils/admin.ts
import { supabase } from '@/lib/supabase/client'

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data?.is_admin || false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}