// src/app/api/test-supabase/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Check if we can connect
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (usersError) {
      console.error('❌ Supabase users table error:', usersError)
      return NextResponse.json({
        success: false,
        error: usersError.message,
        details: 'Failed to query users table'
      }, { status: 500 })
    }

    console.log('✅ Supabase connection successful')
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection is working',
      usersCount: users?.length || 0,
    })
  } catch (error: any) {
    console.error('❌ Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}