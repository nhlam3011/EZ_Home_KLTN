import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VietQRService } from '@/lib/vietqr'

// Get VietQR config from environment variables
const getVietQRConfig = () => {
  const clientID = process.env.VIETQR_CLIENT_ID
  const apiKey = process.env.VIETQR_API_KEY
  const accountNo = process.env.VIETQR_ACCOUNT_NO
  const accountName = process.env.VIETQR_ACCOUNT_NAME
  const bankBIN = process.env.VIETQR_BANK_BIN
  const template = process.env.VIETQR_TEMPLATE

  if (!clientID || !apiKey || !accountNo || !accountName) {
    throw new Error('VietQR configuration is incomplete. Please check VIETQR_CLIENT_ID, VIETQR_API_KEY, VIETQR_ACCOUNT_NO, and VIETQR_ACCOUNT_NAME in .env')
  }

  if (!bankBIN && !/^970\d{3}/.test(accountNo.replace(/\D/g, ''))) {
    throw new Error('Bank BIN is required. Please provide VIETQR_BANK_BIN in .env (6 digits, e.g., 970415) or include BIN in account number')
  }

  return {
    clientID,
    apiKey,
    accountNo,
    accountName,
    bankBIN,
    template
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
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

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice already paid' },
        { status: 400 }
      )
    }

    // Check if there's already a pending VietQR payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        invoiceId: invoice.id,
        method: 'VIETQR',
        status: 'PENDING'
      }
    })

    if (existingPayment) {
      // Return existing payment QR code
      return NextResponse.json({
        paymentId: existingPayment.id,
        qrCode: existingPayment.qrCode,
        qrString: existingPayment.qrString,
        amount: Number(existingPayment.amount)
      })
    }

    // Initialize VietQR service
    const config = getVietQRConfig()
    const vietQR = new VietQRService(config)

    // Generate QR code using VietQR API
    const description = `HD${invoice.id.toString().padStart(6, '0')} ${invoice.contract.user.fullName.substring(0, 20)}`
    
    const qrData = await vietQR.generateQR({
      amount: Number(invoice.totalAmount),
      description: description.substring(0, 25),
      invoiceId: invoice.id
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: 'VIETQR',
        status: 'PENDING',
        qrCode: qrData.qrCode,
        qrString: qrData.qrString,
        transactionId: `VIETQR-${Date.now()}-${invoice.id}`
      }
    })

    return NextResponse.json({
      paymentId: payment.id,
      qrCode: payment.qrCode,
      qrString: payment.qrString,
      amount: Number(payment.amount),
      description: description
    })
  } catch (error: any) {
    console.error('Error creating VietQR payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create VietQR payment' },
      { status: 500 }
    )
  }
}
