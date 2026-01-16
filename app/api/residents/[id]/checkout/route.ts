import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const userId = parseInt(resolvedParams.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Find user with active contract
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            room: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const activeContract = user.contracts[0]

    if (!activeContract) {
      return NextResponse.json(
        { error: 'Không tìm thấy hợp đồng đang hoạt động' },
        { status: 400 }
      )
    }

    // Terminate the contract
    await prisma.contract.update({
      where: { id: activeContract.id },
      data: { 
        status: 'TERMINATED',
        endDate: new Date() // Set end date to today
      }
    })

    // Deactivate user account (prevent login after checkout)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    // Update room status to AVAILABLE
    if (activeContract.room) {
      await prisma.room.update({
        where: { id: activeContract.room.id },
        data: { status: 'AVAILABLE' }
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Check-out thành công'
    })
  } catch (error) {
    console.error('Error checking out resident:', error)
    return NextResponse.json(
      { error: 'Failed to checkout resident' },
      { status: 500 }
    )
  }
}
