import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const buildingId = searchParams.get('buildingId')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (buildingId) {
      where.user = {
        contracts: {
          some: {
            room: {
              buildingId: parseInt(buildingId)
            },
            status: 'ACTIVE'
          }
        }
      }
    }

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { service: { name: { contains: search, mode: 'insensitive' } } },
        { user: { contracts: { some: { room: { name: { contains: search, mode: 'insensitive' } } } } } }
      ]
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        user: {
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              include: {
                room: true
              },
              take: 1
            }
          }
        },
        service: true
      },
      orderBy: { orderDate: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching service orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service orders' },
      { status: 500 }
    )
  }
}
