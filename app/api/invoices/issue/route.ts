import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewInvoiceEmail } from '@/lib/email'

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
      amountCommonService,
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
      parseFloat(amountCommonService || 0) +
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
        amountCommonService: parseFloat(amountCommonService || 0),
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

    // Send new invoice email notification
    if (invoice.contract.user.email) {
      const dueDate = new Date(invoice.createdAt)
      dueDate.setDate(dueDate.getDate() + 7) // Due date is 7 days from creation

      sendNewInvoiceEmail(invoice.contract.user.email, {
        id: invoice.id,
        month: invoice.month,
        year: invoice.year,
        totalAmount: Number(invoice.totalAmount),
        roomName: invoice.contract.room.name,
        dueDate: dueDate
      }).catch(err => {
        console.error('Failed to send new invoice email:', err)
      })
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating issue invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
