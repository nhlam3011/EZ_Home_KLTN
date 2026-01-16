import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyVNPayCallback, parseVNPayResponseCode } from '@/lib/vnpay'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    
    // Get all VNPay params
    searchParams.forEach((value, key) => {
      if (key.startsWith('vnp_')) {
        params[key] = value
      }
    })

    // Verify signature
    const isValid = verifyVNPayCallback(params)
    if (!isValid) {
      return NextResponse.redirect(
        new URL(`/tenant/invoices?error=invalid_signature`, request.url)
      )
    }

    const responseCode = params['vnp_ResponseCode'] || ''
    const txnRef = params['vnp_TxnRef'] || ''
    const amount = params['vnp_Amount'] ? parseInt(params['vnp_Amount']) / 100 : 0
    const transactionNo = params['vnp_TransactionNo'] || ''
    const bankCode = params['vnp_BankCode'] || ''

    // Parse response
    const { success, message } = parseVNPayResponseCode(responseCode)

    // Extract invoice ID from transaction reference (format: INV{invoiceId}_{paymentId}_{timestamp})
    const match = txnRef.match(/^INV(\d+)_/)
    if (!match) {
      return NextResponse.redirect(
        new URL(`/tenant/invoices?error=invalid_transaction`, request.url)
      )
    }

    const invoiceId = parseInt(match[1])

    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: txnRef,
        invoiceId: invoiceId
      },
      include: {
        invoice: true
      }
    })

    if (!payment) {
      return NextResponse.redirect(
        new URL(`/tenant/invoices?error=payment_not_found`, request.url)
      )
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: success ? 'SUCCESS' : 'FAILED',
        vnpResponse: JSON.stringify(params),
        paidAt: success ? new Date() : null
      }
    })

    if (success) {
      // Update invoice status
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })
    }

    // Redirect to invoice page with result
    const redirectUrl = success
      ? `/tenant/invoices?success=true&message=${encodeURIComponent(message)}&invoiceId=${invoiceId}`
      : `/tenant/invoices?error=${encodeURIComponent(message)}&invoiceId=${invoiceId}`

    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch (error) {
    console.error('Error processing VNPay callback:', error)
    return NextResponse.redirect(
      new URL(`/tenant/invoices?error=payment_error`, request.url)
    )
  }
}
