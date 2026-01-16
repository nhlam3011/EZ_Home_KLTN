import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, unitPrice, unit, isActive } = body

    const updateData: any = {}
    
    if (name) updateData.name = name
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice)
    if (unit) updateData.unit = unit
    if (isActive !== undefined) updateData.isActive = isActive

    const service = await prisma.service.update({
      where: { id: parseInt(params.id) },
      data: updateData
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if service has orders
    const service = await prisma.service.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        orders: true
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (service.orders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service with existing orders' },
        { status: 400 }
      )
    }

    await prisma.service.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
