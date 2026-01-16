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
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung khiếu nại' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // In a real app, this would save to a complaints table
    // For now, we'll just log it or save to a simple table
    console.log('Invoice complaint:', {
      invoiceId,
      message,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Khiếu nại của bạn đã được gửi. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.'
    })
  } catch (error) {
    console.error('Error submitting complaint:', error)
    return NextResponse.json(
      { error: 'Failed to submit complaint' },
      { status: 500 }
    )
  }
}
