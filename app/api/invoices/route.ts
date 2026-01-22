import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvoiceCreatedEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    // First, check and update overdue invoices (if paymentDueDate field exists)
    try {
      const now = new Date()
      await prisma.invoice.updateMany({
        where: {
          status: 'UNPAID',
          paymentDueDate: {
            lt: now
          }
        },
        data: {
          status: 'OVERDUE'
        }
      })
    } catch (updateError) {
      // Ignore error if paymentDueDate field doesn't exist yet (migration not run)
      console.log('Could not update overdue invoices (field may not exist yet):', updateError)
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const contractId = searchParams.get('contractId')

    const where: any = {}

    if (contractId) {
      where.contractId = parseInt(contractId)
    }
    if (month) {
      where.month = parseInt(month)
    }
    if (year) {
      where.year = parseInt(year)
    }
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filter by search if provided
    let filteredInvoices = invoices
    if (search) {
      const searchLower = search.toLowerCase()
      filteredInvoices = invoices.filter(invoice => {
        const userName = invoice.contract.user.fullName.toLowerCase()
        const roomName = invoice.contract.room.name.toLowerCase()
        return userName.includes(searchLower) || roomName.includes(searchLower)
      })
    }

    // Ensure we always return an array
    return NextResponse.json(Array.isArray(filteredInvoices) ? filteredInvoices : [])
  } catch (error) {
    console.error('Error fetching invoices:', error)
    // Return empty array instead of error object to prevent frontend errors
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contractId,
      month,
      year,
      amountRoom,
      amountElec,
      amountWater,
      amountCommonService,
      amountService,
      paymentDueDate
    } = body

    // Validate required fields
    if (!contractId || !month || !year || amountRoom === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Cho phép tạo nhiều hóa đơn trong cùng tháng (để bổ sung thiếu sót)
    // Không kiểm tra hóa đơn đã tồn tại

    // Calculate payment due date (use provided date or default to 10 days from now)
    let finalPaymentDueDate: Date
    if (paymentDueDate) {
      finalPaymentDueDate = new Date(paymentDueDate)
    } else {
      finalPaymentDueDate = new Date()
      finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() + 10)
    }

    // Find overdue invoices for this contract to add to current invoice
    const now = new Date()
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        contractId: parseInt(contractId),
        status: {
          in: ['UNPAID', 'OVERDUE']
        },
        paymentDueDate: {
          lt: now // Payment due date has passed
        }
      }
    })

    // Calculate total overdue amount
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

    const totalAmount =
      parseFloat(amountRoom || 0) +
      parseFloat(amountElec || 0) +
      parseFloat(amountWater || 0) +
      parseFloat(amountCommonService || 0) +
      parseFloat(amountService || 0) +
      overdueAmount // Add overdue amount to current invoice

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
        amountService: parseFloat(amountService || 0) + overdueAmount, // Add overdue to amountService
        totalAmount,
        paymentDueDate: finalPaymentDueDate,
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

    // Mark overdue invoices as paid (they are now included in the new invoice)
    if (overdueInvoices.length > 0) {
      await prisma.invoice.updateMany({
        where: {
          id: {
            in: overdueInvoices.map(inv => inv.id)
          }
        },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })
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
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
