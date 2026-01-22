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
 * Check payment status
 * Can check by paymentId or orderCode
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get('paymentId')
    const orderCode = searchParams.get('orderCode')

    if (!paymentId && !orderCode) {
      return NextResponse.json(
        { error: 'Payment ID or Order Code is required' },
        { status: 400 }
      )
    }

    let payment

    if (paymentId) {
      // Get payment by ID
      payment = await prisma.payment.findUnique({
        where: { id: parseInt(paymentId) },
        include: {
          invoice: true
        }
      })
    } else if (orderCode) {
      // Get payment by order code
      payment = await prisma.payment.findFirst({
        where: {
          transactionId: `PAYOS-${orderCode}`,
          method: 'PAYOS'
        },
        include: {
          invoice: true
        }
      })
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If payment is still pending, try to get latest status from PayOS
    if (payment.status === 'PENDING' && payment.transactionId) {
      try {
        const orderCodeFromTransaction = payment.transactionId.replace('PAYOS-', '')
        const config = getPayOSConfig()
        const payos = new PayOSService(config, '')
        const paymentInfo = await payos.getPaymentInfo(parseInt(orderCodeFromTransaction))
        
        // Update payment status if changed
        // PayOS status can be: PENDING, PROCESSING, PAID, CANCELLED
        if (paymentInfo.status === 'PAID' || paymentInfo.status === 'paid') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              paidAt: paymentInfo.transactionDateTime ? new Date(paymentInfo.transactionDateTime) : new Date()
            }
          })

          if (payment.invoice.status !== 'PAID') {
            await prisma.invoice.update({
              where: { id: payment.invoiceId },
              data: {
                status: 'PAID',
                paidAt: paymentInfo.transactionDateTime ? new Date(paymentInfo.transactionDateTime) : new Date()
              }
            })
          }

          // Refresh payment data
          payment = await prisma.payment.findUnique({
            where: { id: payment.id },
            include: {
              invoice: true
            }
          })
        } else if (paymentInfo.status === 'CANCELLED' || paymentInfo.status === 'cancelled') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'CANCELLED'
            }
          })
          
          // Refresh payment data
          payment = await prisma.payment.findUnique({
            where: { id: payment.id },
            include: {
              invoice: true
            }
          })
        }
      } catch (error) {
        console.error('Error checking PayOS status:', error)
        // Continue with existing payment status
      }
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      invoiceStatus: payment.invoice.status,
      amount: Number(payment.amount),
      paidAt: payment.paidAt,
      orderCode: payment.transactionId ? payment.transactionId.replace('PAYOS-', '') : null
    })
  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
