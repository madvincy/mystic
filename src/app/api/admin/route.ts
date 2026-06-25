// src/app/api/admin/route.ts
import { NextResponse } from 'next/server'



export async function GET() {
  try {
   

    return NextResponse.json({
      success: true,
      message: 'Admin API is working',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}