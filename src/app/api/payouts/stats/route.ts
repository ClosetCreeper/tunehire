import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!session.user.canSell) {
      return NextResponse.json(
        { error: 'Only sellers can view payout stats' },
        { status: 403 }
      )
    }

    // Get all completed orders for this seller
    const completedOrders = await prisma.order.findMany({
      where: {
        sellerId: session.user.id,
        status: 'COMPLETED'
      }
    })

    // Get all payouts for this seller
    const payouts = await prisma.payout.findMany({
      where: { sellerId: session.user.id }
    })

    // Calculate stats
    const totalEarnings = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const platformFees = totalEarnings * 0.1
    const netEarnings = totalEarnings - platformFees

    const totalPaidOut = payouts
      .filter(payout => payout.status === 'PAID')
      .reduce((sum, payout) => sum + payout.amount, 0)

    const pendingPayouts = payouts
      .filter(payout => payout.status === 'PENDING' || payout.status === 'PROCESSING')
      .reduce((sum, payout) => sum + payout.amount, 0)

    // Orders that haven't been included in any payout
    const paidOutOrderIds = payouts.flatMap(p => p.orderIds)
    const unpaidOrders = completedOrders.filter(order => !paidOutOrderIds.includes(order.id))
    const availableForPayout = unpaidOrders.reduce((sum, order) => sum + order.totalPrice, 0) * 0.9 // Minus 10% platform fee

    return NextResponse.json({
      totalEarnings,
      platformFees,
      netEarnings,
      totalPaidOut,
      pendingPayouts,
      availableForPayout,
      completedOrdersCount: completedOrders.length,
      unpaidOrdersCount: unpaidOrders.length
    })
  } catch (error) {
    console.error('Error fetching payout stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}