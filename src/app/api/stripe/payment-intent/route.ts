import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get the order with seller information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: true,
        buyer: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify the buyer is making the payment
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to pay for this order' },
        { status: 403 }
      )
    }

    // Check if seller has completed Stripe onboarding
    if (!order.seller.stripeAccountId || !order.seller.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'Seller has not completed payment setup' },
        { status: 400 }
      )
    }

    // Calculate fees (5% platform fee)
    const totalAmount = Math.round(order.totalPrice * 100) // Convert to cents
    const platformFee = Math.round(totalAmount * 0.05) // 5% platform fee
    const sellerAmount = totalAmount - platformFee

    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: order.seller.stripeAccountId,
      },
      metadata: {
        orderId: order.id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        platformFee: platformFee.toString(),
        sellerAmount: sellerAmount.toString(),
      },
      description: `TuneHire: ${order.title}`,
    })

    // Update order with payment information
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        platformFee: platformFee / 100, // Store in dollars
        sellerAmount: sellerAmount / 100, // Store in dollars
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      platformFee: platformFee / 100,
      sellerAmount: sellerAmount / 100,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}