import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Create a separate invoice for issue repair cost
// This allows multiple invoices for the same period
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contractId,
      issueId,
      month,
      year,
      amountRoom,
      amountElec,
      amountWater,
      amountService
    } = body

    // Validate required fields
    if (!contractId || !issueId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: parseInt(issueId) }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    const totalAmount =
      parseFloat(amountRoom || 0) +
      parseFloat(amountElec || 0) +
      parseFloat(amountWater || 0) +
      parseFloat(amountService || 0)

    // Create new invoice (allow multiple invoices for same period)
    const invoice = await prisma.invoice.create({
      data: {
        contractId: parseInt(contractId),
        month: parseInt(month),
        year: parseInt(year),
        amountRoom: parseFloat(amountRoom || 0),
        amountElec: parseFloat(amountElec || 0),
        amountWater: parseFloat(amountWater || 0),
        amountService: parseFloat(amountService || 0),
        totalAmount,
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
    console.error('Error creating issue invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
