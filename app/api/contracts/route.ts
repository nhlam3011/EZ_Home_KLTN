import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }
    if (userId) {
      where.userId = parseInt(userId)
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        user: true,
        room: true
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
