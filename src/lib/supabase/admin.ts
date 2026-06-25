// src/lib/supabase/admin.ts - Keep this for server-side only
// ❌ DON'T import this in client-side components
// ✅ ONLY use this in API routes

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const isAdminClientAvailable = !!supabaseServiceKey