import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get messages (posts that are notifications/messages from admin)
    // Messages are posts with content starting with [Hóa đơn or are marked as notifications
    const messages = await prisma.post.findMany({
      where: {
        userId: user.id,
        OR: [
          { content: { startsWith: '[Hóa đơn' } },
          { content: { startsWith: '[Thông báo' } },
          { content: { startsWith: '[Tin nhắn' } }
        ],
        status: 'PUBLIC'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    })

    // Count unread messages (messages created in last 7 days that user hasn't seen)
    // For now, we'll consider all messages as potentially unread
    const unreadCount = messages.filter(msg => {
      const msgDate = new Date(msg.createdAt)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return msgDate >= sevenDaysAgo
    }).length

    return NextResponse.json({
      messages,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
