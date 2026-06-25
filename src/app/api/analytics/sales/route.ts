// src/app/api/analytics/sales/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const now = new Date()
    let startDate = new Date()
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '12m':
        startDate.setMonth(now.getMonth() - 12)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        payment_status,
        created_at,
        items:order_items(
          quantity,
          price,
          product:products(name)
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate metrics
    const totalRevenue = data.reduce((sum, o) => sum + o.total_amount, 0)
    const totalOrders = data.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Daily breakdown
    const dailyData = data.reduce((acc: any, order) => {
      const date = new Date(order.created_at).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 }
      }
      acc[date].revenue += order.total_amount
      acc[date].orders += 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
        },
        daily: Object.values(dailyData),
        orders: data,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}