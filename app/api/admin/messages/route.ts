import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendMessageReceivedEmail } from '@/lib/email'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// GET /api/admin/messages - Lấy danh sách tin nhắn
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') // Filter theo tenant cụ thể
    const userId = searchParams.get('userId') // Admin user ID từ query
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get current admin user
    const adminUser = await getCurrentUser(request, userId ? parseInt(userId) : undefined)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as admin.' },
        { status: 401 }
      )
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin users can access messages' },
        { status: 403 }
      )
    }

    const where: any = {
      OR: [
        { senderId: adminUser.id },
        { receiverId: adminUser.id }
      ]
    }

    // Nếu có tenantId, chỉ lấy tin nhắn với tenant đó
    if (tenantId) {
      const tenantIdNum = parseInt(tenantId)
      where.AND = [
        {
          OR: [
            { senderId: adminUser.id, receiverId: tenantIdNum },
            { senderId: tenantIdNum, receiverId: adminUser.id }
          ]
        }
      ]
    }

    // Đếm tổng số tin nhắn
    const totalMessages = await prisma.message.count({ where })

    // Lấy tin nhắn với pagination
    const messages = await prisma.message.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // Lấy danh sách tenants đã có tin nhắn với admin (distinct)
    const tenantMessageData = await prisma.message.groupBy({
      by: ['senderId', 'receiverId'],
      where: {
        OR: [
          { senderId: adminUser.id },
          { receiverId: adminUser.id }
        ]
      },
      _max: {
        createdAt: true
      }
    })

    // Lấy unique tenant IDs và thời gian tin nhắn mới nhất cho mỗi tenant
    const latestMessageMap = new Map<number, Date>()
    tenantMessageData.forEach(msg => {
      const partnerId = msg.senderId === adminUser.id ? msg.receiverId : msg.senderId
      const currentMax = latestMessageMap.get(partnerId)
      const msgMax = msg._max.createdAt

      if (msgMax && (!currentMax || msgMax > currentMax)) {
        latestMessageMap.set(partnerId, msgMax)
      }
    })

    const tenantIds = Array.from(latestMessageMap.keys())

    // Lấy thông tin tenants cùng với phòng và số tin nhắn chưa đọc
    const tenantsWithUnread = await prisma.user.findMany({
      where: {
        id: { in: tenantIds },
        role: 'TENANT',
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            room: {
              select: {
                id: true,
                name: true,
                floor: true
              }
            }
          },
          take: 1,
          orderBy: { startDate: 'desc' }
        },
        _count: {
          select: {
            sentMessages: {
              where: {
                receiverId: adminUser.id,
                isRead: false
              }
            }
          }
        }
      }
    })

    // Lấy tin nhắn cuối cùng cho mỗi tenant để hiển thị ở sidebar
    const tenantsWithLastMessage = await Promise.all(tenantsWithUnread.map(async (tenant) => {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: adminUser.id, receiverId: tenant.id },
            { senderId: tenant.id, receiverId: adminUser.id }
          ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { role: true }
          }
        }
      })

      return {
        ...tenant,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          images: lastMessage.images,
          senderRole: lastMessage.sender.role
        } : null
      }
    }))

    // Sort tenants by last message time descending
    tenantsWithLastMessage.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return timeB - timeA
    })

    // Format tenants cho response
    const formattedTenants = tenantsWithLastMessage.map(tenant => ({
      id: tenant.id,
      fullName: tenant.fullName,
      avatarUrl: tenant.avatarUrl,
      phone: tenant.phone,
      room: tenant.contracts[0]?.room || null,
      unreadCount: tenant._count.sentMessages,
      lastMessage: tenant.lastMessage
    }))

    // Tạo unreadCounts object
    const unreadCounts: Record<number, number> = {}
    formattedTenants.forEach(tenant => {
      unreadCounts[tenant.id] = tenant.unreadCount
    })

    // Lấy tất cả tenants active cho trường hợp tenant mới chưa có tin nhắn
    const allTenantsNoMsg = await prisma.user.findMany({
      where: {
        role: 'TENANT',
        isActive: true,
        id: { notIn: tenantIds }
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            room: {
              select: {
                id: true,
                name: true,
                floor: true
              }
            }
          },
          take: 1,
          orderBy: { startDate: 'desc' }
        }
      },
      orderBy: { fullName: 'asc' },
      take: 50
    })

    // Format tenants không có tin nhắn
    const otherTenants = allTenantsNoMsg.map(tenant => ({
      id: tenant.id,
      fullName: tenant.fullName,
      avatarUrl: tenant.avatarUrl,
      phone: tenant.phone,
      room: tenant.contracts[0]?.room || null,
      unreadCount: 0,
      lastMessage: null
    }))

    // Kết hợp cả hai danh sách - Ưu tiên tenants có tin nhắn trước
    const allFormattedTenants = [...formattedTenants, ...otherTenants]

    return NextResponse.json({
      messages,
      tenants: allFormattedTenants,
      tenantsWithMessages: formattedTenants,
      unreadCounts,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
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

// POST /api/admin/messages - Gửi tin nhắn đến tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, receiverId, userId, images } = body

    if (!content && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: 'Content or images are required' },
        { status: 400 }
      )
    }

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current admin user - pass userId from body
    const adminUser = await getCurrentUser(request, userId)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as admin.' },
        { status: 401 }
      )
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin users can send messages' },
        { status: 403 }
      )
    }

    // Verify receiver is a tenant
    const receiver = await prisma.user.findUnique({
      where: { id: parseInt(receiverId) }
    })

    if (!receiver || receiver.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Receiver must be a tenant' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        senderId: adminUser.id,
        receiverId: parseInt(receiverId),
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
            role: true,
            email: true
          }
        }
      }
    })

    // Send email notification to tenant (async - không chờ)
    if (message.receiver.email) {
      sendMessageReceivedEmail(
        message.receiver.email,
        message.sender.fullName,
        message.content,
        message.receiver.fullName,
        (message.images && message.images.length > 0) || false
      ).catch(err => console.error('Failed to send email:', err))
    }

    // Trigger Pusher event for real-time update
    try {
      await pusherServer.trigger(CHANNELS.TENANT_MESSAGES, EVENTS.NEW_MESSAGE, {
        message,
        tenantId: message.receiverId,
      })
    } catch (pusherError) {
      console.error('Pusher trigger error:', pusherError)
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
