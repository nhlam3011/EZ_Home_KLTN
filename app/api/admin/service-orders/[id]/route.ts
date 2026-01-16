import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { status, cancelReason } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    
    // If canceling, store the cancellation reason in the note field
    if (status === 'CANCELLED' && cancelReason) {
      updateData.note = `Lý do hủy: ${cancelReason}`
    }

    const orderId = parseInt(resolvedParams.id)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const order = await prisma.serviceOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: true,
        service: true
      }
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error updating service order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update service order' },
      { status: 500 }
    )
  }
}
