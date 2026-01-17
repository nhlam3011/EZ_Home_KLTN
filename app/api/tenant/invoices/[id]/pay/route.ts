import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const invoiceId = parseInt(resolvedParams.id)
    const body = await request.json()
    const { paymentMethod } = body // 'QR', 'BANK_TRANSFER', etc.

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
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

    // This endpoint handles offline/cash payments only
    // For online payment (VietQR), use /api/payments/vietqr/create instead
    
    // For online payment, redirect to VietQR payment creation
    if (paymentMethod === 'VIETQR' || paymentMethod === 'ONLINE') {
      return NextResponse.json({
        error: 'Please use /api/payments/vietqr/create for online payments',
        redirectTo: `/api/payments/vietqr/create`
      }, { status: 400 })
    }

    // Simulate offline payment (cash, bank transfer without gateway)
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        invoiceId: invoiceId,
        amount: invoice.totalAmount,
        method: paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'CASH',
        status: 'SUCCESS',
        paidAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: 'Thanh toán thành công! Vui lòng kiểm tra email để xem hóa đơn.'
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}
