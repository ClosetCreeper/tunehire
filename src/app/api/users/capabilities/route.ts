import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { canSell } = await request.json()

    if (typeof canSell !== 'boolean') {
      return NextResponse.json(
        { error: 'canSell must be a boolean' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { canSell }
    })

    return NextResponse.json({ 
      user: { 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        role: updatedUser.role,
        canBuy: updatedUser.canBuy,
        canSell: updatedUser.canSell
      } 
    })
  } catch (error) {
    console.error('Error updating user capabilities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}