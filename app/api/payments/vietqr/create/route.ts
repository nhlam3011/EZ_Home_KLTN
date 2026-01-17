import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVietQRCode } from '@/lib/vietqr'

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

    // Get VietQR configuration from environment
    const accountNo = process.env.VIETQR_ACCOUNT_NO || ''
    const accountName = process.env.VIETQR_ACCOUNT_NAME || ''
    const bankCode = process.env.VIETQR_BANK_CODE || ''

    if (!accountNo || !accountName) {
      return NextResponse.json(
        { error: 'VietQR account configuration is missing. Please configure VIETQR_ACCOUNT_NO and VIETQR_ACCOUNT_NAME in .env' },
        { status: 500 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: 'VIETQR',
        status: 'PENDING',
      }
    })

    // Generate unique order ID
    const orderId = `INV${invoice.id}_${payment.id}_${Date.now()}`

    try {
      // Generate VietQR code
      const qrData = await generateVietQRCode({
        amount: Number(invoice.totalAmount),
        orderId: orderId,
        orderDescription: `Thanh toan hoa don #${invoice.id} - ${invoice.contract.room.name} - Thang ${invoice.month}/${invoice.year}`,
        accountNo: accountNo,
        accountName: accountName,
        bankCode: bankCode,
        qrType: 'dynamic'
      })

      // Update payment with QR code data and transaction ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: orderId,
          qrCode: qrData.qrDataURL || qrData.qrCode,
          qrString: qrData.qrString
        }
      })

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        orderId: orderId,
        qrCode: qrData.qrDataURL || qrData.qrCode,
        qrString: qrData.qrString,
        amount: Number(invoice.totalAmount),
        invoiceId: invoice.id
      })
    } catch (error: any) {
      // Update payment status to failed if QR generation fails
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayResponse: JSON.stringify({ error: error.message })
        }
      })

      console.error('Error generating VietQR code:', error)
      return NextResponse.json(
        { 
          error: 'Failed to generate QR code',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error creating VietQR payment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
