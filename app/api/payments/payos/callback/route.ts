import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PayOSService } from '@/lib/payos'

// Get PayOS config from environment variables
const getPayOSConfig = () => {
  const clientId = process.env.PAYOS_CLIENT_ID
  const apiKey = process.env.PAYOS_API_KEY
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error('PayOS configuration is incomplete')
  }

  return {
    clientId,
    apiKey,
    checksumKey
  }
}

/**
 * Webhook endpoint for PayOS payment notifications
 * This is called by PayOS when payment status changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature (PayOS sends signature in x-payos-signature header)
    const signature = request.headers.get('x-payos-signature')
    if (signature) {
      try {
        const config = getPayOSConfig()
        const payos = new PayOSService(config, '')
        if (!payos.verifyWebhookSignature(body, signature)) {
          console.error('Invalid PayOS webhook signature')
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          )
        }
      } catch (error) {
        console.error('Error verifying webhook signature:', error)
        // Continue processing but log the error
      }
    }
    
    // PayOS webhook data structure
    const { code, desc, data } = body

    if (code !== '00') {
      console.error('PayOS webhook error:', desc)
      return NextResponse.json(
        { error: desc || 'Payment failed' },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No payment data received' },
        { status: 400 }
      )
    }

    const { orderCode, transactionDateTime, amount, description, accountNumber, accountName, counterAccountBankId, counterAccountBankName, virtualAccountName, virtualAccountNumber, reference, subAccountId } = data

    if (!orderCode) {
      return NextResponse.json(
        { error: 'Order code is required' },
        { status: 400 }
      )
    }

    // Find payment by transaction ID (orderCode)
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: `PAYOS-${orderCode}`,
        method: 'PAYOS'
      },
      include: {
        invoice: true
      }
    })

    if (!payment) {
      console.error('Payment not found for orderCode:', orderCode)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify payment amount matches
    if (Number(payment.amount) !== amount) {
      console.error('Payment amount mismatch:', Number(payment.amount), amount)
      return NextResponse.json(
        { error: 'Payment amount mismatch' },
        { status: 400 }
      )
    }

    // Update payment status to SUCCESS
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        paidAt: transactionDateTime ? new Date(transactionDateTime) : new Date(),
        gatewayResponse: JSON.stringify(body)
      }
    })

    // Update invoice status if payment is successful
    if (payment.invoice.status !== 'PAID') {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: 'PAID',
          paidAt: transactionDateTime ? new Date(transactionDateTime) : new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      code: '00',
      desc: 'Success',
      data: {
        orderCode: orderCode,
        paymentId: updatedPayment.id
      }
    })
  } catch (error: any) {
    console.error('Error processing PayOS callback:', error)
    return NextResponse.json(
      { 
        success: false,
        code: '01',
        desc: error.message || 'Failed to process callback' 
      },
      { status: 500 }
    )
  }
}

/**
 * Manual payment confirmation endpoint
 * Admin can use this to manually confirm a payment
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        invoice: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.status === 'SUCCESS') {
      return NextResponse.json(
        { error: 'Payment already confirmed' },
        { status: 400 }
      )
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        paidAt: new Date()
      }
    })

    // Update invoice
    if (payment.invoice.status !== 'PAID') {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Payment confirmed successfully'
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
