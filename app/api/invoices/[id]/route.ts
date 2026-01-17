import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(resolvedParams.id) },
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { 
      status, 
      paidAt, 
      amountRoom, 
      amountElec, 
      amountWater, 
      amountCommonService,
      amountService,
      month,
      year
    } = body

    const updateData: any = {}
    
    if (status) {
      updateData.status = status.toUpperCase()
    }
    
    if (status === 'PAID' && !paidAt) {
      updateData.paidAt = new Date()
    } else if (paidAt) {
      updateData.paidAt = new Date(paidAt)
    }

    // Update invoice amounts if provided
    if (amountRoom !== undefined) {
      updateData.amountRoom = parseFloat(amountRoom)
    }
    if (amountElec !== undefined) {
      updateData.amountElec = parseFloat(amountElec)
    }
    if (amountWater !== undefined) {
      updateData.amountWater = parseFloat(amountWater)
    }
    if (amountCommonService !== undefined) {
      updateData.amountCommonService = parseFloat(amountCommonService)
    }
    if (amountService !== undefined) {
      updateData.amountService = parseFloat(amountService)
    }
    if (month !== undefined) {
      updateData.month = parseInt(month)
    }
    if (year !== undefined) {
      updateData.year = parseInt(year)
    }

    // Recalculate totalAmount if any amount field is updated
    if (amountRoom !== undefined || amountElec !== undefined || 
        amountWater !== undefined || amountCommonService !== undefined || amountService !== undefined) {
      const currentInvoice = await prisma.invoice.findUnique({
        where: { id: parseInt(resolvedParams.id) }
      })
      
      if (currentInvoice) {
        const newAmountRoom = amountRoom !== undefined ? parseFloat(amountRoom) : Number(currentInvoice.amountRoom)
        const newAmountElec = amountElec !== undefined ? parseFloat(amountElec) : Number(currentInvoice.amountElec)
        const newAmountWater = amountWater !== undefined ? parseFloat(amountWater) : Number(currentInvoice.amountWater)
        const newAmountCommonService = amountCommonService !== undefined ? parseFloat(amountCommonService) : Number(currentInvoice.amountCommonService || 0)
        const newAmountService = amountService !== undefined ? parseFloat(amountService) : Number(currentInvoice.amountService)
        
        updateData.totalAmount = newAmountRoom + newAmountElec + newAmountWater + newAmountCommonService + newAmountService
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(resolvedParams.id) },
      data: updateData,
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    await prisma.invoice.delete({
      where: { id: parseInt(resolvedParams.id) }
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
