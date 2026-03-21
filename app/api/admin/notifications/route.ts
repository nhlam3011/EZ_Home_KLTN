import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - Lấy danh sách thông báo thực tế cho admin (Hóa đơn, Tin nhắn, Bảo trì)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userIdQuery = searchParams.get('userId')
    const buildingIdFilter = searchParams.get('buildingId')

    // Get current admin user from session
    const user = await getCurrentUser(request, userIdQuery ? parseInt(userIdQuery) : undefined)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as admin.' },
        { status: 401 }
      )
    }

    const buildingId = buildingIdFilter ? parseInt(buildingIdFilter) : null

    // 1. Lấy hoá đơn mới thanh toán (PAID)
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        ...(buildingId ? { buildingId } : {}),
      },
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      },
      orderBy: { paidAt: 'desc' },
      take: 10
    })

    // 2. Lấy đơn bảo trì mới (PENDING)
    const pendingIssues = await prisma.issue.findMany({
      where: {
        status: 'PENDING',
        ...(buildingId ? { room: { buildingId } } : {}),
      },
      include: {
        user: true,
        room: { include: { building: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // 3. Lấy tin nhắn chưa đọc
    const unreadMessages = await prisma.message.findMany({
      where: {
        isRead: false,
        receiverId: user.id,
      },
      include: {
        sender: {
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              include: { room: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // 4. Lấy đơn dịch vụ mới (PENDING)
    const pendingOrders = await prisma.serviceOrder.findMany({
      where: {
        status: 'PENDING',
        ...(buildingId ? { user: { contracts: { some: { room: { buildingId }, status: 'ACTIVE' } } } } : {}),
      },
      include: {
        user: {
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              include: { room: { include: { building: true } } }
            }
          }
        },
        service: true
      },
      orderBy: { orderDate: 'desc' },
      take: 10
    })

    // 5. Tổng hợp và định dạng lại
    const notifications: any[] = [
      ...paidInvoices.map(inv => ({
        id: `inv-${inv.id}`,
        type: 'invoice',
        content: `Phòng ${inv.contract.room.name} đã thanh toán hoá đơn tháng ${inv.month}/${inv.year}`,
        buildingId: inv.buildingId,
        buildingName: inv.buildingName || 'Tòa nhà',
        roomName: inv.contract.room.name,
        createdAt: inv.paidAt || inv.createdAt
      })),
      ...pendingIssues.map(issue => ({
        id: `issue-${issue.id}`,
        type: 'announcement',
        content: `Yêu cầu bảo trì mới: ${issue.title} - Phòng ${issue.room.name}`,
        buildingId: issue.room.buildingId,
        buildingName: issue.room.building?.name || 'Tòa nhà',
        roomName: issue.room.name,
        createdAt: issue.createdAt
      })),
      ...pendingOrders.map(order => {
        const activeContract = order.user.contracts[0]
        return {
          id: `order-${order.id}`,
          type: 'announcement',
          content: `Yêu cầu dịch vụ: ${order.service.name} - ${order.user.fullName}`,
          buildingId: activeContract?.room?.buildingId,
          buildingName: activeContract?.room?.building?.name || 'Tòa nhà',
          roomName: activeContract?.room?.name || '---',
          createdAt: order.orderDate
        }
      }),
      ...unreadMessages
        .filter(msg => {
          if (!buildingId) return true
          const activeContract = msg.sender.contracts[0]
          return activeContract?.room?.buildingId === buildingId
        })
        .map(msg => {
          const activeContract = msg.sender.contracts[0]
          return {
            id: `msg-${msg.id}`,
            type: 'message',
            content: `Tin nhắn mới từ ${msg.sender.fullName}: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`,
            buildingId: activeContract?.room?.buildingId,
            buildingName: activeContract?.room?.buildingId ? 'Tòa nhà' : 'Hệ thống',
            roomName: activeContract?.room?.name || '---',
            createdAt: msg.createdAt
          }
        })
    ]

    // Sắp xếp theo thời gian mới nhất
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(notifications.slice(0, 50))
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
