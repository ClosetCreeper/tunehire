import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const instrument = searchParams.get('instrument')
    
    const profiles = await prisma.profile.findMany({
      where: {
        isAvailable: true,
        ...(instrument && { instrument: { contains: instrument, mode: 'insensitive' } })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        services: {
          where: { isActive: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Error fetching profiles:', error)
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

    const { bio, instrument, pricePerMinute, profileImage, audioSamples } = await request.json()

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        bio,
        instrument,
        pricePerMinute,
        profileImage,
        audioSamples
      },
      create: {
        userId: session.user.id,
        bio,
        instrument,
        pricePerMinute,
        profileImage,
        audioSamples
      }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}