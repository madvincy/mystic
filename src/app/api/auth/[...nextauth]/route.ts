// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabase } from '@/lib/supabase/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        console.log('📝 Sign-in attempt for:', user?.email)
        
        // 1. Check if user exists in your custom table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('❌ Error checking user:', fetchError)
        }

        if (!existingUser) {
          console.log('👤 Creating new user in public.users:', user.email)
          
          // Create user in custom table
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              name: user.name || profile?.name || 'User',
              phone: '',
              address: '',
              city: '',
              country: 'Kenya',
              is_admin: user.email === process.env.ADMIN_EMAIL,
              is_banned: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('❌ Error creating user:', insertError)
            return true
          }
          console.log('✅ User created in public.users')
        }

        // 2. Create user in Supabase Auth
        console.log('🔑 Creating user in Supabase Auth...')
        
        try {
          // Check if user exists in Supabase Auth
          const { data: authUser, error: authError } = await supabaseAdmin
            .auth
            .admin
            .listUsers()
          
          const userExists = authUser?.users?.find(
            (u: any) => u.email === user.email
          )

          if (!userExists) {
            // Create user in Supabase Auth
            const { data: newAuthUser, error: createError } = await supabaseAdmin
              .auth
              .admin
              .createUser({
                email: user.email,
                password: crypto.randomUUID(),
                email_confirm: true,
                user_metadata: {
                  name: user.name,
                  provider: 'google',
                  nextauth_id: user.id,
                },
              })

            if (createError) {
              console.error('❌ Error creating Supabase Auth user:', createError)
            } else {
              console.log('✅ Supabase Auth user created')
              
              // Link the users
              await supabase
                .from('users')
                .update({ supabase_auth_id: newAuthUser.user.id })
                .eq('email', user.email)
            }
          } else {
            console.log('✅ Supabase Auth user already exists')
          }
        } catch (authError) {
          console.error('❌ Supabase Auth error:', authError)
        }

        return true
      } catch (error) {
        console.error('❌ SignIn error:', error)
        return true
      }
    },
    async session({ session, token }: any) {
      try {
        if (session?.user?.email) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle()

          if (error) {
            console.error('❌ Session error:', error)
          } else if (userData) {
            session.user.id = userData.id
            session.user.isAdmin = userData.is_admin || false
            session.user.phone = userData.phone || ''
            session.user.supabaseAuthId = userData.supabase_auth_id || ''
          }
        }
        return session
      } catch (error) {
        console.error('❌ Session callback error:', error)
        return session
      }
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin || false
        token.phone = user.phone || ''
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
})

export const GET = handlers.GET
export const POST = handlers.POST