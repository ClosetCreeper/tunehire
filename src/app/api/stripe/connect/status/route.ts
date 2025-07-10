import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.stripeAccountId) {
      return NextResponse.json({
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false
      })
    }

    // Get account status from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId)

    const status = {
      onboardingComplete: account.details_submitted && account.charges_enabled,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requiresAction: account.requirements?.currently_due?.length > 0,
      requirements: account.requirements?.currently_due || []
    }

    // Update user's onboarding status in database
    if (status.onboardingComplete !== user.stripeOnboardingComplete) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeOnboardingComplete: status.onboardingComplete }
      })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error checking Stripe Connect status:', error)
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    )
  }
}