import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendMessageReceivedEmail } from '@/lib/email'

// GET /api/admin/messages - Lấy danh sách tin nhắn
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') // Filter theo tenant cụ thể
    const userId = searchParams.get('userId') // Admin user ID từ query

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
      orderBy: { createdAt: 'desc' }
    })

    // Lấy danh sách tenants đã có tin nhắn với admin
    const tenantIds = new Set<number>()
    messages.forEach(msg => {
      if (msg.sender.role === 'TENANT') {
        tenantIds.add(msg.sender.id)
      }
      if (msg.receiver.role === 'TENANT') {
        tenantIds.add(msg.receiver.id)
      }
    })

    // Lấy tất cả tenants (không chỉ những người đã có tin nhắn) với thông tin phòng
    const allTenants = await prisma.user.findMany({
      where: {
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
        }
      },
      orderBy: { fullName: 'asc' }
    })

    // Format tenants với thông tin phòng
    const formattedTenants = allTenants.map(tenant => ({
      id: tenant.id,
      fullName: tenant.fullName,
      avatarUrl: tenant.avatarUrl,
      phone: tenant.phone,
      room: tenant.contracts[0]?.room || null
    }))

    // Lấy tenants đã có tin nhắn để đếm unread
    const tenantsWithMessages = await prisma.user.findMany({
      where: {
        id: { in: Array.from(tenantIds) },
        role: 'TENANT'
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        phone: true
      }
    })

    // Đếm số tin nhắn chưa đọc cho tất cả tenants
    const unreadCounts: Record<number, number> = {}
    for (const tenant of formattedTenants) {
      const count = await prisma.message.count({
        where: {
          senderId: tenant.id,
          receiverId: adminUser.id,
          isRead: false
        }
      })
      unreadCounts[tenant.id] = count
    }

    return NextResponse.json({
      messages,
      tenants: formattedTenants, // Trả về tất cả tenants với thông tin phòng
      tenantsWithMessages, // Tenants đã có tin nhắn
      unreadCounts
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

    // Send email notification to tenant
    if (message.receiver.email) {
      await sendMessageReceivedEmail(
        message.receiver.email,
        message.sender.fullName,
        message.content,
        message.receiver.fullName,
        (message.images && message.images.length > 0) || false
      )
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
