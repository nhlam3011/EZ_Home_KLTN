import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvoiceMessageEmail } from '@/lib/email'

// POST - Gửi thông báo cho tenant về hóa đơn
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung tin nhắn' },
        { status: 400 }
      )
    }

    // Get invoice with contract and user
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(resolvedParams.id) },
      include: {
        contract: {
          include: {
            user: true
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

    // Create notification using Post model (temporary solution)
    // In production, you should create a proper Notification model
    const notification = await prisma.post.create({
      data: {
        userId: invoice.contract.userId,
        content: `[Hóa đơn #${invoice.id}] ${message}`,
        images: [],
        status: 'PUBLIC' // Mark as public so tenant can see it
      }
    })

    // Send email notification to tenant
    if (invoice.contract.user.email) {
      await sendInvoiceMessageEmail(
        invoice.contract.user.email,
        invoice.id,
        message,
        invoice.contract.user.fullName
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi thông báo đến khách thuê',
      notificationId: notification.id
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
