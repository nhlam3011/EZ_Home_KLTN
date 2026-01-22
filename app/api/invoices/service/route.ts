import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Create a separate invoice for service order
// This allows multiple invoices for the same period
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contractId,
      serviceOrderId,
      month,
      year,
      amountRoom,
      amountElec,
      amountWater,
      amountCommonService,
      amountService
    } = body

    // Validate required fields
    if (!contractId || !serviceOrderId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify service order exists
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: parseInt(serviceOrderId) },
      include: {
        service: true,
        user: true
      }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { error: 'Service order not found' },
        { status: 404 }
      )
    }

    // Calculate payment due date (10 days from now)
    const paymentDueDate = new Date()
    paymentDueDate.setDate(paymentDueDate.getDate() + 10)

    const totalAmount =
      parseFloat(amountRoom || 0) +
      parseFloat(amountElec || 0) +
      parseFloat(amountWater || 0) +
      parseFloat(amountCommonService || 0) +
      parseFloat(amountService || 0)

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        contractId: parseInt(contractId),
        month: parseInt(month),
        year: parseInt(year),
        amountRoom: parseFloat(amountRoom || 0),
        amountElec: parseFloat(amountElec || 0),
        amountWater: parseFloat(amountWater || 0),
        amountCommonService: parseFloat(amountCommonService || 0),
        amountService: parseFloat(amountService || 0),
        totalAmount,
        paymentDueDate,
        status: 'UNPAID'
      },
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating service invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
