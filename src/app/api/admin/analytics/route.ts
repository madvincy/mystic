// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range
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

    const startDateStr = startDate.toISOString()
    const nowStr = now.toISOString()

    // Get orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', nowStr)

    if (ordersError) throw ordersError

    // Get users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) throw usersError

    // Get products
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (productsError) throw productsError

    // Calculate analytics
    const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
    const totalOrders = orders?.length || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get top products
    const { data: topProducts } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        products(name, images)
      `)
      .order('quantity', { ascending: false })
      .limit(10)

    // Get daily stats
    const dailyStats = orders?.reduce((acc: any, order) => {
      const date = new Date(order.created_at).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, orders: 0, revenue: 0 }
      }
      acc[date].orders += 1
      acc[date].revenue += order.total_amount
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          totalUsers,
          totalProducts,
          averageOrderValue,
        },
        topProducts: topProducts || [],
        dailyStats: Object.values(dailyStats || {}),
        period,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}