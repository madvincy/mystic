// src/hooks/useHybridAuth.ts
'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function useHybridAuth() {
  const { user, isLoading: authLoading } = useAuth()
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null)
  const [isSynced, setIsSynced] = useState(false)

  // Sync user with Supabase Auth when NextAuth session changes
  useEffect(() => {
    const syncWithSupabase = async () => {
      if (status === 'authenticated' && user) {
        try {
          console.log('🔄 Syncing user with Supabase Auth...')

          // 1. Check if user exists in Supabase Auth
          const { data: supabaseUser, error: userError } = await supabase
            .auth
            .admin
            .getUserById(user.id)

          if (userError && userError.status === 404) {
            // 2. User doesn't exist in Supabase Auth - create them
            console.log('👤 Creating user in Supabase Auth...')
            
            // Create user in Supabase Auth
            const { data: newUser, error: createError } = await supabase
              .auth
              .admin
              .createUser({
                email: user.email,
                password: crypto.randomUUID(), // Random password since they use Google
                email_confirm: true,
                user_metadata: {
                  name: user.user_metadata,
                  provider: 'google',
                },
              })

            if (createError) {
              console.error('❌ Error creating Supabase Auth user:', createError)
              return
            }

            // 3. Link the users (same ID)
            const { error: updateError } = await supabase
              .from('users')
              .update({ supabase_auth_id: newUser.user.id })
              .eq('email', user.email)

            if (updateError) {
              console.error('❌ Error linking users:', updateError)
            }

            console.log('✅ Supabase Auth user created and linked')
          }

          // 4. Generate a Supabase JWT token
          const { data: tokenData, error: tokenError } = await supabase
            .auth
            .getSession()

          if (tokenError) {
            console.error('❌ Error getting Supabase token:', tokenError)
          } else if (tokenData?.session) {
            setSupabaseToken(tokenData.session.access_token)
            console.log('✅ Supabase token retrieved')
          }

          setIsSynced(true)
        } catch (error) {
          console.error('❌ Hybrid auth sync error:', error)
        }
      } else if (status === 'unauthenticated') {
        // Clear Supabase session on logout
        await supabase.auth.signOut()
        setSupabaseToken(null)
        setIsSynced(false)
      }
    }

    syncWithSupabase()
  }, [user, status])

  return {
    user,
    status,
    supabaseToken,
    isSynced,
    isLoading: status === 'loading' || !isSynced,
  }
}