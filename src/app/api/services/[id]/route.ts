import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
        { error: 'Only sellers can update services' },
        { status: 403 }
      )
    }

    const { title, description, included, excluded, basePrice, creditRequired, creditInstructions, isActive } = await request.json()

    // Verify the service belongs to the user
    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        profile: { userId: session.user.id }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const updatedService = await prisma.service.update({
      where: { id: params.id },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
        { error: 'Only sellers can delete services' },
        { status: 403 }
      )
    }

    // Verify the service belongs to the user
    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        profile: { userId: session.user.id }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    await prisma.service.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}