import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') // Tenant user ID từ query
    const lastMessageId = searchParams.get('lastMessageId') // ID của tin nhắn cuối cùng đã có

    // Get current tenant user
    const tenantUser = await getCurrentUser(request, userId ? parseInt(userId) : undefined)

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as tenant.' },
        { status: 401 }
      )
    }

    if (tenantUser.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Only tenant users can access messages' },
        { status: 403 }
      )
    }

    // Lấy admin user (giả sử chỉ có 1 admin)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return NextResponse.json({
        messages: [],
        unreadCount: 0,
        admin: null
      })
    }

    // Tối ưu: Chỉ lấy tin nhắn mới nếu có lastMessageId
    const whereClause: any = {
      OR: [
        { senderId: tenantUser.id, receiverId: adminUser.id },
        { senderId: adminUser.id, receiverId: tenantUser.id }
      ]
    }
    
    // Chỉ lấy tin nhắn mới hơn lastMessageId (incremental loading)
    if (lastMessageId) {
      whereClause.id = { gt: parseInt(lastMessageId) }
    }

    // Lấy tin nhắn giữa tenant và admin
    const messages = await prisma.message.findMany({
      where: whereClause,
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
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: lastMessageId ? 50 : undefined // Giới hạn nếu chỉ lấy tin mới
    })

    // Đánh dấu tin nhắn từ admin là đã đọc
    await prisma.message.updateMany({
      where: {
        senderId: adminUser.id,
        receiverId: tenantUser.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Đếm số tin nhắn chưa đọc
    const unreadCount = await prisma.message.count({
      where: {
        senderId: adminUser.id,
        receiverId: tenantUser.id,
        isRead: false
      }
    })

    return NextResponse.json({
      messages,
      unreadCount,
      admin: {
        id: adminUser.id,
        fullName: adminUser.fullName,
        avatarUrl: adminUser.avatarUrl
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/tenant/messages - Gửi tin nhắn đến admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, userId, images } = body

    if (!content && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: 'Content or images are required' },
        { status: 400 }
      )
    }

    // Get current tenant user
    const tenantUser = await getCurrentUser(request, userId)

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as tenant.' },
        { status: 401 }
      )
    }

    if (tenantUser.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Only tenant users can send messages' },
        { status: 403 }
      )
    }

    // Lấy admin user (giả sử chỉ có 1 admin)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    const message = await prisma.message.create({
      data: {
        senderId: tenantUser.id,
        receiverId: adminUser.id,
        content: content || '',
        images: images || []
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
            role: true
          }
        }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
