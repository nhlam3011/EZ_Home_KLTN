import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createVNPayPaymentUrl } from '@/lib/vnpay'

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

    // Get client IP
    const ipAddr = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: 'VNPAY',
        status: 'PENDING',
      }
    })

    // Create VNPay payment URL
    const paymentUrl = createVNPayPaymentUrl({
      amount: Number(invoice.totalAmount),
      orderId: `INV${invoice.id}_${payment.id}_${Date.now()}`,
      orderDescription: `Thanh toan hoa don #${invoice.id} - ${invoice.contract.room.name} - Thang ${invoice.month}/${invoice.year}`,
      orderType: 'other',
      locale: 'vn',
      ipAddr: Array.isArray(ipAddr) ? ipAddr[0] : ipAddr.split(',')[0].trim()
    })

    // Update payment with transaction ID and URL
    const orderId = `INV${invoice.id}_${payment.id}_${Date.now()}`
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: orderId,
        paymentUrl: paymentUrl
      }
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentUrl: paymentUrl,
      transactionId: orderId
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
