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

    const payouts = await prisma.payout.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(payouts)
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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
        { error: 'Only sellers can request payouts' },
        { status: 403 }
      )
    }

    // Get completed orders that haven't been paid out yet
    const completedOrders = await prisma.order.findMany({
      where: {
        sellerId: session.user.id,
        status: 'COMPLETED',
        // Only orders that haven't been included in any payout
        id: {
          notIn: await prisma.payout.findMany({
            where: { sellerId: session.user.id },
            select: { orderIds: true }
          }).then(payouts => payouts.flatMap(p => p.orderIds))
        }
      }
    })

    if (completedOrders.length === 0) {
      return NextResponse.json(
        { error: 'No completed orders available for payout' },
        { status: 400 }
      )
    }

    const totalAmount = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const platformFee = totalAmount * 0.1 // 10% platform fee
    const payoutAmount = totalAmount - platformFee

    const payout = await prisma.payout.create({
      data: {
        sellerId: session.user.id,
        amount: payoutAmount,
        orderIds: completedOrders.map(order => order.id)
      }
    })

    return NextResponse.json(payout)
  } catch (error) {
    console.error('Error creating payout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}