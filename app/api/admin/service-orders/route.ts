import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const building = searchParams.get('building')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
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

    // Filter by search and building
    let filteredOrders = orders
    if (search) {
      const searchLower = search.toLowerCase()
      filteredOrders = orders.filter(order => {
        const roomName = order.user.contracts[0]?.room?.name || ''
        const serviceName = order.service.name.toLowerCase()
        const userName = order.user.fullName.toLowerCase()
        return (
          roomName.toLowerCase().includes(searchLower) ||
          serviceName.includes(searchLower) ||
          userName.includes(searchLower)
        )
      })
    }

    if (building && building !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        const roomName = order.user.contracts[0]?.room?.name || ''
        return roomName.includes(building)
      })
    }

    return NextResponse.json(filteredOrders)
  } catch (error) {
    console.error('Error fetching service orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service orders' },
      { status: 500 }
    )
  }
}
