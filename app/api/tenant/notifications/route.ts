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

    // Get notifications from Post table where content contains [Hóa đơn, [Thông báo, etc.
    const notifications = await prisma.post.findMany({
      where: {
        userId: user.id,
        OR: [
          { content: { contains: '[Hóa đơn' } },
          { content: { contains: '[Thông báo' } },
          { content: { contains: '[Tin nhắn' } }
        ],
        status: 'PUBLIC'
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
