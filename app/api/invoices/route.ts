import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewInvoiceEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json(filteredInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
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
      amountService
    } = body

    // Validate required fields
    if (!contractId || !month || !year || amountRoom === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if invoice already exists for this contract and period
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        contractId: parseInt(contractId),
        month: parseInt(month),
        year: parseInt(year)
      }
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice already exists for this period' },
        { status: 400 }
      )
    }

    const totalAmount =
      parseFloat(amountRoom || 0) +
      parseFloat(amountElec || 0) +
      parseFloat(amountWater || 0) +
      parseFloat(amountCommonService || 0) +
      parseFloat(amountService || 0)

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
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
