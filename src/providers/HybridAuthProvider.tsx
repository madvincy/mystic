// src/providers/HybridAuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/lib/hooks/useAuth'

interface HybridAuthContextType {
  supabaseToken: string | null
  isSynced: boolean
  isLoading: boolean
  isGuest: boolean
  getAuthenticatedClient: () => any
}

const HybridAuthContext = createContext<HybridAuthContextType>({
  supabaseToken: null,
  isSynced: true,
  isLoading: false,
  isGuest: true,
  getAuthenticatedClient: () => supabase,
})

export function HybridAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null)
  const [isSynced, setIsSynced] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const syncWithSupabase = async () => {
      // For guests, use regular client
      if (status === 'unauthenticated') {
        console.log('👤 Guest user - using anonymous Supabase client')
        setSupabaseToken(null)
        setIsSynced(true)
        setIsLoading(false)
        return
      }

      if (status === 'authenticated' && user) {
        try {
          console.log('🔄 Creating Supabase session for authenticated user...')
          setIsLoading(true)
          
          // Try to get existing Supabase session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('❌ Error getting Supabase session:', sessionError)
            setSupabaseToken(null)
          } else if (sessionData?.session) {
            setSupabaseToken(sessionData.session.access_token)
            console.log('✅ Supabase token retrieved')
          }
          
          setIsSynced(true)
        } catch (error) {
          console.error('❌ Hybrid auth sync error:', error)
          setSupabaseToken(null)
          setIsSynced(true)
        } finally {
          setIsLoading(false)
        }
      }
    }

    syncWithSupabase()
  }, [user, isLoading, isSynced])

  // ✅ Returns a Supabase client with the user's token
  const getAuthenticatedClient = () => {
    if (supabaseToken) {
      // Create a client with the user's token
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${supabaseToken}`,
            },
          },
        }
      )
    }
    // Fallback to regular client (guest)
    return supabase
  }

  const isGuest = status === 'unauthenticated' || !supabaseToken

  return (
    <HybridAuthContext.Provider 
      value={{ 
        supabaseToken, 
        isSynced, 
        isLoading, 
        isGuest,
        getAuthenticatedClient,
      }}
    >
      {children}
    </HybridAuthContext.Provider>
  )
}

export const useHybridAuth = () => useContext(HybridAuthContext)