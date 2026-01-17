import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseVietQRCallback, verifyVietQRCallback } from '@/lib/vietqr'
import { sendPaymentSuccessEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Log incoming request for debugging
    console.log('=== VietQR Callback Received ===')
    console.log('Method: POST')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    
    let body: any = {}
    try {
      body = await request.json()
      console.log('Body:', JSON.stringify(body, null, 2))
    } catch (e) {
      // If body is not JSON, try to get as text
      const text = await request.text()
      console.log('Body (text):', text)
      try {
        body = JSON.parse(text)
      } catch {
        // If still not JSON, treat as form data
        const formData = new URLSearchParams(text)
        formData.forEach((value, key) => {
          body[key] = value
        })
      }
    }

    const params: Record<string, string> = {}

    // Convert body to string params for verification
    Object.keys(body).forEach(key => {
      params[key] = String(body[key])
    })

    console.log('Parsed params:', params)

    // Get signature from headers or body
    const signature = request.headers.get('x-vietqr-signature') || 
                     request.headers.get('signature') ||
                     body.signature || 
                     body.hash || 
                     ''

    console.log('Signature:', signature ? 'Present' : 'Missing')

    // Verify signature (if required by VietQR)
    // Note: Adjust verification logic based on VietQR's actual implementation
    if (signature && !verifyVietQRCallback(params, signature)) {
      console.error('Invalid VietQR callback signature')
      return NextResponse.json(
        { 
          code: 'INVALID_SIGNATURE',
          message: 'Invalid signature',
          error: 'Invalid signature' 
        },
        { status: 401 }
      )
    }

    // Parse callback data
    const callbackData = parseVietQRCallback(params)
    console.log('Parsed callback data:', callbackData)

    // Find payment by order ID
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: callbackData.orderId,
        method: 'VIETQR'
      },
      include: {
        invoice: true
      }
    })

    if (!payment) {
      console.error('Payment not found for order:', callbackData.orderId)
      console.error('Available payments:', await prisma.payment.findMany({
        where: { method: 'VIETQR' },
        select: { id: true, transactionId: true, invoiceId: true }
      }))
      return NextResponse.json(
        { 
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
          error: `Payment not found for orderId: ${callbackData.orderId}` 
        },
        { status: 404 }
      )
    }

    console.log('Found payment:', { id: payment.id, invoiceId: payment.invoiceId, currentStatus: payment.status })

    // Update payment status
    const isSuccess = callbackData.status === 'success'
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        gatewayResponse: JSON.stringify(callbackData),
        paidAt: isSuccess ? new Date() : null
      }
    })

    console.log('Payment updated:', { id: updatedPayment.id, status: updatedPayment.status })

    if (isSuccess) {
      // Update invoice status
      const updatedInvoice = await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })
      console.log('Invoice updated:', { id: updatedInvoice.id, status: updatedInvoice.status })
    }

    console.log('=== Callback Processed Successfully ===')

    return NextResponse.json({
      code: '00',
      message: 'Success',
      success: true,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        status: isSuccess ? 'SUCCESS' : 'FAILED'
      }
    })
  } catch (error: any) {
    console.error('Error processing VietQR callback:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR',
        message: 'Failed to process callback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Also support GET for webhook testing and manual testing
export async function GET(request: NextRequest) {
  try {
    console.log('=== VietQR Callback Received (GET) ===')
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    console.log('Query params:', params)

    // If no params, return endpoint info
    if (Object.keys(params).length === 0) {
      return NextResponse.json({
        endpoint: '/api/payments/vietqr/callback',
        methods: ['GET', 'POST'],
        description: 'VietQR payment callback endpoint',
        usage: {
          GET: 'Test with query params: ?orderId=xxx&status=success&amount=100000',
          POST: 'Receive webhook from VietQR with JSON body'
        }
      })
    }

    // Similar processing as POST
    const callbackData = parseVietQRCallback(params)
    console.log('Parsed callback data:', callbackData)

    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: callbackData.orderId,
        method: 'VIETQR'
      },
      include: {
        invoice: true
      }
    })

    if (!payment) {
      console.error('Payment not found for order:', callbackData.orderId)
      return NextResponse.json({ 
        code: 'PAYMENT_NOT_FOUND',
        error: 'Payment not found',
        orderId: callbackData.orderId
      }, { status: 404 })
    }

    const isSuccess = callbackData.status === 'success'
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        gatewayResponse: JSON.stringify(callbackData),
        paidAt: isSuccess ? new Date() : null
      }
    })

    if (isSuccess) {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date()
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

      // Send payment success email
      if (updatedInvoice.contract.user.email) {
        sendPaymentSuccessEmail(updatedInvoice.contract.user.email, {
          id: updatedInvoice.id,
          month: updatedInvoice.month,
          year: updatedInvoice.year,
          totalAmount: Number(updatedInvoice.totalAmount),
          paidAt: updatedInvoice.paidAt || new Date(),
          roomName: updatedInvoice.contract.room.name
        }).catch(err => {
          console.error('Failed to send payment success email:', err)
        })
      }
    }

    return NextResponse.json({ 
      code: '00',
      success: true,
      message: 'Callback processed successfully',
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        status: isSuccess ? 'SUCCESS' : 'FAILED'
      }
    })
  } catch (error: any) {
    console.error('Error processing VietQR callback (GET):', error)
    return NextResponse.json({ 
      code: 'INTERNAL_ERROR',
      error: 'Failed to process callback',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
