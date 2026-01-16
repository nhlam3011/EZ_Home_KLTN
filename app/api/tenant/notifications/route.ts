import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lấy danh sách thông báo cho tenant
export async function GET(request: NextRequest) {
  try {
    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' }
    })

    if (!user) {
      return NextResponse.json([])
    }

    // Get notifications from Post table where content contains [Hóa đơn
    const notifications = await prisma.post.findMany({
      where: {
        userId: user.id,
        content: {
          contains: '[Hóa đơn'
        },
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
