import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    console.error('No order ID in payment intent metadata')
    return
  }

  try {
    // Update order status to ACCEPTED when payment succeeds
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        stripeTransferGroup: paymentIntent.transfer_group || undefined,
      }
    })

    console.log(`Payment succeeded for order ${orderId}`)
  } catch (error) {
    console.error('Error updating order after payment success:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    console.error('No order ID in payment intent metadata')
    return
  }

  try {
    // Update order status to CANCELLED when payment fails
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      }
    })

    console.log(`Payment failed for order ${orderId}`)
  } catch (error) {
    console.error('Error updating order after payment failure:', error)
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    const user = await prisma.user.findUnique({
      where: { stripeAccountId: account.id }
    })

    if (!user) {
      console.error(`No user found for Stripe account ${account.id}`)
      return
    }

    const onboardingComplete = account.details_submitted && account.charges_enabled

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeOnboardingComplete: onboardingComplete
      }
    })

    console.log(`Updated onboarding status for user ${user.id}: ${onboardingComplete}`)
  } catch (error) {
    console.error('Error updating account status:', error)
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    // Find the order associated with this transfer
    const orderId = transfer.metadata?.orderId

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          stripeTransferId: transfer.id,
        }
      })

      console.log(`Transfer ${transfer.id} created for order ${orderId}`)
    }
  } catch (error) {
    console.error('Error handling transfer created:', error)
  }
}