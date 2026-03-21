import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendMessageReceivedEmail } from '@/lib/email'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// GET /api/admin/messages - Lấy danh sách tin nhắn
// OPTIMIZED: Fixed N+1 query problem and reduced database calls
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') // Filter theo tenant cụ thể
    const userId = searchParams.get('userId') // Admin user ID từ query
    const buildingId = searchParams.get('buildingId')
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

    // OPTIMIZATION: Execute count and main message query in parallel
    const [totalMessages, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
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
    ])

    // OPTIMIZATION: Get last message for each tenant using a simple approach
    // Get all messages ordered by createdAt desc, then deduplicate by partner
    const allConversationMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: adminUser.id },
          { receiverId: adminUser.id }
        ]
      },
      include: {
        sender: {
          select: { id: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 500 // Limit to recent messages for performance
    })

    // Build a map of partner ID to last message (first occurrence = latest due to desc order)
    const lastMessageMap = new Map<number, {
      content: string
      createdAt: Date
      images: string
      senderRole: string
    }>()

    allConversationMessages.forEach(msg => {
      const partnerId = msg.senderId === adminUser.id ? msg.receiverId : msg.senderId
      // Only keep the first (latest) message for each partner
      if (!lastMessageMap.has(partnerId)) {
        lastMessageMap.set(partnerId, {
          content: msg.content,
          createdAt: msg.createdAt,
          images: Array.isArray(msg.images) ? JSON.stringify(msg.images) : '[]',
          senderRole: msg.sender.role
        })
      }
    })

    const tenantIdsWithMessages = Array.from(lastMessageMap.keys())

    // OPTIMIZATION: Get all tenants in a single query with combined data
    // Fetch tenants that have messages AND tenants without messages in one go
    const [tenantsWithUnread, allTenantsNoMsg] = await Promise.all([
      // Tenants with messages (get unread count)
      prisma.user.findMany({
        where: {
          id: { in: tenantIdsWithMessages },
          role: 'TENANT',
          isActive: true,
          ...(buildingId ? {
            contracts: {
              some: {
                room: {
                  buildingId: parseInt(buildingId)
                },
                status: 'ACTIVE'
              }
            }
          } : {})
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
      }),
      // Tenants without any messages
      prisma.user.findMany({
        where: {
          role: 'TENANT',
          isActive: true,
          id: { notIn: tenantIdsWithMessages },
          ...(buildingId ? {
            contracts: {
              some: {
                room: {
                  buildingId: parseInt(buildingId)
                },
                status: 'ACTIVE'
              }
            }
          } : {})
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
    ])

    // Format tenants WITH messages - use the map for last message data
    const formattedTenants = (tenantsWithUnread as any[]).map(tenant => {
      const lastMsg = lastMessageMap.get(tenant.id)
      return {
        id: tenant.id,
        fullName: tenant.fullName,
        avatarUrl: tenant.avatarUrl,
        phone: tenant.phone,
        room: tenant.contracts[0]?.room || null,
        unreadCount: tenant._count.sentMessages,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.createdAt,
          images: JSON.parse(lastMsg.images || '[]'),
          senderRole: lastMsg.senderRole
        } : null
      }
    })

    // Format tenants WITHOUT messages
    const otherTenants = (allTenantsNoMsg as any[]).map(tenant => ({
      id: tenant.id,
      fullName: tenant.fullName,
      avatarUrl: tenant.avatarUrl,
      phone: tenant.phone,
      room: tenant.contracts[0]?.room || null,
      unreadCount: 0,
      lastMessage: null
    }))

    // Sort tenants WITH messages by last message time descending
    formattedTenants.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return timeB - timeA
    })

    // Combine both lists - prioritize tenants with messages
    const allFormattedTenants = [...formattedTenants, ...otherTenants]

    // Create unreadCounts object
    const unreadCounts: Record<number, number> = {}
    formattedTenants.forEach(tenant => {
      unreadCounts[tenant.id] = tenant.unreadCount
    })

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
