import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const roomId = searchParams.get('roomId')

    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }
    if (userId) {
      where.userId = parseInt(userId)
    }
    if (roomId) {
      where.roomId = parseInt(roomId)
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        user: true,
        room: true,
        occupants: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}
