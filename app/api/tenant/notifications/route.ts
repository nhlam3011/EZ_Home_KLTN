import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - Lấy danh sách thông báo cho tenant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Get current tenant user from session
    const user = await getCurrentUser(request, userId ? parseInt(userId) : undefined)

    if (!user || user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as tenant.' },
        { status: 401 }
      )
    }

    // Get notifications for this tenant:
    // 1. Notification gửi riêng cho tenant (hóa đơn, tin nhắn) - userId = tenant
    // 2. Thông báo chung từ admin - user.role = ADMIN
    const notifications = await prisma.post.findMany({
      where: {
        status: 'PUBLIC',
        OR: [
          // Notification riêng cho tenant này (hóa đơn, tin nhắn)
          {
            userId: user.id,
            OR: [
              { content: { contains: '[Hóa đơn' } },
              { content: { contains: '[Tin nhắn' } }
            ]
          },
          // Thông báo chung từ admin cho tất cả tenant
          {
            user: { role: 'ADMIN' },
            content: { contains: '[Thông báo' }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
