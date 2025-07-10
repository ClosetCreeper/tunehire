import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url)
  const parts = url.pathname.split('/')
  return parts[parts.length - 1] || null
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.canSell) {
      return NextResponse.json({ error: 'Only sellers can update services' }, { status: 403 })
    }

    const id = extractIdFromUrl(request)
    if (!id) {
      return NextResponse.json({ error: 'Missing service ID' }, { status: 400 })
    }

    const { title, description, included, excluded, basePrice, creditRequired, creditInstructions, isActive } = await request.json()

    const service = await prisma.service.findFirst({
      where: {
        id,
        profile: { userId: session.user.id }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(included !== undefined && { included }),
        ...(excluded !== undefined && { excluded }),
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(creditRequired !== undefined && { creditRequired }),
        ...(creditInstructions !== undefined && { creditInstructions }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.canSell) {
      return NextResponse.json({ error: 'Only sellers can delete services' }, { status: 403 })
    }

    const id = extractIdFromUrl(request)
    if (!id) {
      return NextResponse.json({ error: 'Missing service ID' }, { status: 400 })
    }

    const service = await prisma.service.findFirst({
      where: {
        id,
        profile: { userId: session.user.id }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    await prisma.service.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
