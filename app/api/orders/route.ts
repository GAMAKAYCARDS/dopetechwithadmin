import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔄 API: Loading orders with items...')
    
    // Fetch orders using admin client
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ API: Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    console.log(`✅ API: Loaded ${ordersData.length} orders`)

    // Fetch order items for each order using admin client
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        console.log(`📦 API: Loading items for order: ${order.order_id}`)
        
        const { data: itemsData, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select(`
            *,
            products (
              name,
              image_url
            )
          `)
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('❌ API: Error fetching order items:', itemsError)
          return {
            ...order,
            order_items: []
          }
        }

        console.log(`✅ API: Loaded ${itemsData.length} items for order ${order.order_id}`)

        // Map product data to order items
        const orderItems = itemsData.map((item: any) => ({
          ...item,
          product_name: item.products?.name || 'Unknown Product',
          product_image: item.products?.image_url || ''
        }))

        return {
          ...order,
          order_items: orderItems
        }
      })
    )

    console.log('✅ API: All orders loaded successfully:', ordersWithItems.length)
    
    return NextResponse.json({
      success: true,
      orders: ordersWithItems,
      count: ordersWithItems.length
    })

  } catch (error) {
    console.error('❌ API: Error loading orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
