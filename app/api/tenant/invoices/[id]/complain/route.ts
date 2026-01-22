import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvoiceComplaintEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const invoiceId = parseInt(resolvedParams.id)
    const body = await request.json()
    const { message, userId } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung khiếu nại' },
        { status: 400 }
      )
    }

    // Get invoice with contract and user information
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
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

    // Get tenant user (sender)
    const tenantUser = invoice.contract.user

    // Get admin user (receiver) - find first admin
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin not found. Please contact support.' },
        { status: 404 }
      )
    }

    // Format complaint message with invoice details
    const complaintContent = `[KHIẾU NẠI HÓA ĐƠN #${invoice.id.toString().padStart(6, '0')}]

Hóa đơn: Tháng ${invoice.month}/${invoice.year}
Phòng: ${invoice.contract.room.name} - Tầng ${invoice.contract.room.floor}
Khách thuê: ${tenantUser.fullName}
Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(invoice.totalAmount))}

Nội dung khiếu nại:
${message.trim()}

---
Thời gian: ${new Date().toLocaleString('vi-VN')}`

    // Create message to admin
    const complaintMessage = await prisma.message.create({
      data: {
        senderId: tenantUser.id,
        receiverId: adminUser.id,
        content: complaintContent,
        images: []
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            email: true
          }
        }
      }
    })

    // Send email notification to admin
    if (adminUser.email) {
      try {
        await sendInvoiceComplaintEmail(
          adminUser.email,
          invoice.id,
          tenantUser.fullName,
          invoice.contract.room.name,
          Number(invoice.totalAmount),
          message.trim()
        )
      } catch (emailError) {
        console.error('Error sending email notification to admin:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Khiếu nại của bạn đã được gửi đến quản trị viên. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.',
      messageId: complaintMessage.id
    })
  } catch (error: any) {
    console.error('Error submitting complaint:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit complaint' },
      { status: 500 }
    )
  }
}
