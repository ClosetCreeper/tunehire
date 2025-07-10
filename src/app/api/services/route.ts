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
      return NextResponse.json([])
    }

    // First, get the user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { services: true }
    })

    if (!profile) {
      return NextResponse.json([])
    }

    return NextResponse.json(profile.services)
  } catch (error) {
    console.error('Error fetching services:', error)
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
        { error: 'Only sellers can create services' },
        { status: 403 }
      )
    }

    const { title, description, included, excluded, basePrice, creditRequired, creditInstructions } = await request.json()

    if (!title || !basePrice) {
      return NextResponse.json(
        { error: 'Title and base price are required' },
        { status: 400 }
      )
    }

    // Get or create the user's profile
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: session.user.id }
      })
    }

    const service = await prisma.service.create({
      data: {
        profileId: profile.id,
        title,
        description: description || '',
        included: included || [],
        excluded: excluded || [],
        basePrice: parseFloat(basePrice),
        creditRequired: creditRequired || '',
        creditInstructions: creditInstructions || ''
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}