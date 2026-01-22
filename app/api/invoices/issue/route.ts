import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvoiceCreatedEmail } from '@/lib/email'

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

    // Calculate payment due date (10 days from now)
    const paymentDueDate = new Date()
    paymentDueDate.setDate(paymentDueDate.getDate() + 10)

    const totalAmount =
      parseFloat(amountRoom || 0) +
      parseFloat(amountElec || 0) +
      parseFloat(amountWater || 0) +
      parseFloat(amountCommonService || 0) +
      parseFloat(amountService || 0)

    // Try to create invoice with paymentDueDate first
    // If field doesn't exist, create without it
    let invoice
    try {
      invoice = await prisma.invoice.create({
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
    } catch (createError: any) {
      // If paymentDueDate field doesn't exist, create without it
      if (createError.message?.includes('paymentDueDate') || createError.message?.includes('Unknown argument')) {
        console.log('paymentDueDate field not found, creating invoice without it. Please run migration.')
        invoice = await prisma.invoice.create({
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
      } else {
        throw createError // Re-throw if it's a different error
      }
    }

    // Send email notification to tenant
    if (invoice.contract.user.email) {
      const period = `Tháng ${invoice.month}/${invoice.year}`
      await sendInvoiceCreatedEmail(
        invoice.contract.user.email,
        invoice.id,
        Number(invoice.totalAmount),
        period,
        invoice.contract.user.fullName
      )
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
