import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/messages/[userId] - Lấy tin nhắn với một tenant cụ thể
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const tenantId = parseInt(resolvedParams.userId)
    const searchParams = request.nextUrl.searchParams
    const adminUserId = searchParams.get('userId') // Admin user ID từ query
    const lastMessageId = searchParams.get('lastMessageId') // ID của tin nhắn cuối cùng đã có

    // Get current admin user
    const adminUser = await getCurrentUser(request, adminUserId ? parseInt(adminUserId) : undefined)

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

    // Verify tenant exists with room information
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        role: true,
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
      }
    })

    if (!tenant || tenant.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Tối ưu: Chỉ lấy tin nhắn mới nếu có lastMessageId
    const whereClause: any = {
      OR: [
        { senderId: adminUser.id, receiverId: tenantId },
        { senderId: tenantId, receiverId: adminUser.id }
      ]
    }
    
    // Chỉ lấy tin nhắn mới hơn lastMessageId (incremental loading)
    if (lastMessageId) {
      whereClause.id = { gt: parseInt(lastMessageId) }
    }

    // Lấy tin nhắn giữa admin và tenant
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

    // Đánh dấu tin nhắn từ tenant là đã đọc
    await prisma.message.updateMany({
      where: {
        senderId: tenantId,
        receiverId: adminUser.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Đếm số tin nhắn chưa đọc
    const unreadCount = await prisma.message.count({
      where: {
        senderId: tenantId,
        receiverId: adminUser.id,
        isRead: false
      }
    })

    return NextResponse.json({
      messages,
      tenant: {
        ...tenant,
        room: tenant.contracts[0]?.room || null
      },
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

// DELETE /api/admin/messages/[userId] - Xóa tất cả tin nhắn với tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const tenantId = parseInt(resolvedParams.userId)
    const searchParams = request.nextUrl.searchParams
    const adminUserId = searchParams.get('userId') // Admin user ID từ query

    // Get current admin user
    const adminUser = await getCurrentUser(request, adminUserId ? parseInt(adminUserId) : undefined)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as admin.' },
        { status: 401 }
      )
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin users can delete messages' },
        { status: 403 }
      )
    }

    // Xóa tất cả tin nhắn giữa admin và tenant
    const deleted = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: adminUser.id, receiverId: tenantId },
          { senderId: tenantId, receiverId: adminUser.id }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count
    })
  } catch (error) {
    console.error('Error deleting messages:', error)
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    )
  }
}
