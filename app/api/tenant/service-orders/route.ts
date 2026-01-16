import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orders = await prisma.serviceOrder.findMany({
      where: {
        userId: user.id
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            unit: true,
            unitPrice: true
          }
        }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, quantity, note } = body

    if (!serviceId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get service
    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!service.isActive) {
      return NextResponse.json(
        { error: 'Service is not available' },
        { status: 400 }
      )
    }

    const total = Number(service.unitPrice) * parseInt(quantity)

    const order = await prisma.serviceOrder.create({
      data: {
        userId: user.id,
        serviceId: parseInt(serviceId),
        quantity: parseInt(quantity),
        total,
        note: note || null,
        status: 'PENDING'
      },
      include: {
        service: true
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating service order:', error)
    return NextResponse.json(
      { error: 'Failed to create service order' },
      { status: 500 }
    )
  }
}
