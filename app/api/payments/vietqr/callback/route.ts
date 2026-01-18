import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Callback endpoint for VietQR payment webhook
 * This would be called by VietQR service when payment is confirmed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, transactionId, status } = body

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

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        transactionId: transactionId || payment.transactionId,
        paidAt: status === 'SUCCESS' ? new Date() : null,
        gatewayResponse: JSON.stringify(body)
      }
    })

    // If payment is successful, update invoice
    if (status === 'SUCCESS' && payment.invoice.status !== 'PAID') {
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
      payment: updatedPayment
    })
  } catch (error) {
    console.error('Error processing VietQR callback:', error)
    return NextResponse.json(
      { error: 'Failed to process callback' },
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
