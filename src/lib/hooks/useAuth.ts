// src/hooks/useAuth.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth(): AuthState & {
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
} {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.is_admin || false)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        setIsLoading(true)
        fetchUser()
      } else {
        setIsAdmin(false)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }

  const refreshUser = fetchUser

  return {
    user,
    isAdmin,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshUser,
  }
}