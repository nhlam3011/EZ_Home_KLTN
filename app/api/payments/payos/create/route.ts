import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PayOSService } from '@/lib/payos'

// Get PayOS config from environment variables
const getPayOSConfig = () => {
  const clientId = process.env.PAYOS_CLIENT_ID
  const apiKey = process.env.PAYOS_API_KEY
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error('PayOS configuration is incomplete. Please check PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY in .env')
  }

  return {
    clientId,
    apiKey,
    checksumKey
  }
}

// Get base URL for return/cancel URLs
const getBaseUrl = (request: NextRequest): string => {
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
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

    // Check if there's already a pending PayOS payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        invoiceId: invoice.id,
        method: 'PAYOS',
        status: 'PENDING'
      }
    })

    if (existingPayment && existingPayment.qrCode) {
      // Return existing payment link
      return NextResponse.json({
        paymentId: existingPayment.id,
        checkoutUrl: existingPayment.qrCode, // Store checkout URL in qrCode field
        qrCode: existingPayment.qrString || existingPayment.qrCode, // QR code image
        orderCode: existingPayment.transactionId ? parseInt(existingPayment.transactionId.replace('PAYOS-', '')) : null,
        amount: Number(existingPayment.amount)
      })
    }

    // Initialize PayOS service
    const config = getPayOSConfig()
    const baseUrl = getBaseUrl(request)
    const payos = new PayOSService(config, baseUrl)

    // Generate unique order code (using timestamp + invoice ID)
    const orderCode = parseInt(`${Date.now()}${invoice.id.toString().padStart(4, '0')}`.slice(-10))

    // Create payment link using PayOS API
    const description = `HD${invoice.id.toString().padStart(6, '0')} ${invoice.contract.user.fullName.substring(0, 20)}`
    
    const paymentLink = await payos.createPaymentLink({
      orderCode: orderCode,
      amount: Number(invoice.totalAmount),
      description: description.substring(0, 100),
      invoiceId: invoice.id,
      buyerName: invoice.contract.user.fullName,
      buyerEmail: invoice.contract.user.email || undefined,
      buyerPhone: invoice.contract.user.phone
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: 'PAYOS',
        status: 'PENDING',
        qrCode: paymentLink.checkoutUrl, // Store checkout URL
        qrString: paymentLink.qrCode, // Store QR code image
        transactionId: `PAYOS-${orderCode}`,
        gatewayResponse: JSON.stringify(paymentLink)
      }
    })

    return NextResponse.json({
      paymentId: payment.id,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      orderCode: orderCode,
      amount: Number(payment.amount),
      description: description
    })
  } catch (error: any) {
    console.error('Error creating PayOS payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create PayOS payment' },
      { status: 500 }
    )
  }
}
