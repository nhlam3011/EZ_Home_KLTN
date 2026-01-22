import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const months = parseInt(searchParams.get('months') || '6')
    const userId = searchParams.get('userId')

    // Get current tenant user from session
    const user = await getCurrentUser(request, userId ? parseInt(userId) : undefined)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as tenant.' },
        { status: 401 }
      )
    }

    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Only tenant users can access dashboard' },
        { status: 403 }
      )
    }

    // Get user with contracts
    const userWithContracts = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            room: true
          },
          take: 1,
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!userWithContracts) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const contract = userWithContracts.contracts[0]

    // Get current month invoice - prioritize unpaid invoices
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    
    let currentInvoice = null
    
    if (contract?.id) {
      // First, try to get unpaid/overdue invoice (most recent)
      currentInvoice = await prisma.invoice.findFirst({
        where: {
          contractId: contract.id,
          status: {
            in: ['UNPAID', 'OVERDUE']
          }
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' }
        ]
      })
      
      // If no unpaid invoice, get current month invoice
      if (!currentInvoice) {
        currentInvoice = await prisma.invoice.findFirst({
          where: {
            contractId: contract.id,
            month: currentMonth,
            year: currentYear
          },
          orderBy: { createdAt: 'desc' }
        })
      }
    }

    // Get utility costs for specified number of months
    const utilityCosts = []
    const monthsToFetch = Math.min(Math.max(months, 3), 12) // Limit between 3 and 12
    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const invoice = await prisma.invoice.findFirst({
        where: {
          contractId: contract?.id,
          month,
          year
        }
      })

      utilityCosts.push({
        month,
        year,
        monthName: date.toLocaleDateString('vi-VN', { month: 'short' }),
        elec: Number(invoice?.amountElec || 0),
        water: Number(invoice?.amountWater || 0)
      })
    }

    // Calculate cost structure from all invoices in current month
    const monthInvoices = await prisma.invoice.findMany({
      where: {
        contractId: contract?.id,
        month: currentMonth,
        year: currentYear
      }
    })

    let costStructure = {
      room: 0,
      services: 0,
      other: 0,
      total: 0
    }
    
    if (monthInvoices.length > 0) {
      let totalRoom = 0
      let totalServices = 0
      let totalOther = 0
      let totalAmount = 0

      monthInvoices.forEach(invoice => {
        const roomAmount = Number(invoice.amountRoom || 0)
        const commonServiceAmount = Number(invoice.amountCommonService || 0)
        const serviceAmount = Number(invoice.amountService || 0)
        const utilityAmount = Number(invoice.amountElec || 0) + Number(invoice.amountWater || 0)
        const total = Number(invoice.totalAmount || 0)
        const otherAmount = total - roomAmount - commonServiceAmount - serviceAmount - utilityAmount

        totalRoom += roomAmount
        totalServices += commonServiceAmount + serviceAmount + utilityAmount
        totalOther += otherAmount
        totalAmount += total
      })

      if (totalAmount > 0) {
        costStructure = {
          room: Math.round((totalRoom / totalAmount) * 100),
          services: Math.round((totalServices / totalAmount) * 100),
          other: Math.round((totalOther / totalAmount) * 100),
          total: totalAmount
        }
      }
    }

    // Get recent activities from database
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        contractId: contract?.id
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        contract: {
          include: {
            room: { select: { name: true } }
          }
        }
      }
    })

    const recentIssues = await prisma.issue.findMany({
      where: {
        userId: userWithContracts.id
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        room: { select: { name: true } }
      }
    })

    const recentActivities: any[] = []
    
    // Add invoice activities
    recentInvoices.forEach(inv => {
      recentActivities.push({
        description: inv.status === 'PAID' 
          ? `Thanh toán hóa đơn tháng ${inv.month}/${inv.year}`
          : `Hóa đơn tháng ${inv.month}/${inv.year}`,
        time: new Date(inv.createdAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'Tài chính',
        status: inv.status === 'PAID' ? 'Thành công' : 
                inv.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'
      })
    })

    // Add issue activities
    recentIssues.forEach(issue => {
      recentActivities.push({
        description: `Báo hỏng: ${issue.title}`,
        time: new Date(issue.createdAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'Kỹ thuật',
        status: issue.status === 'DONE' ? 'Hoàn thành' :
                issue.status === 'PROCESSING' ? 'Đang xử lý' :
                issue.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xử lý'
      })
    })

    // Sort by time and take latest 10
    recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    recentActivities.splice(10)

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    // Get unread messages count from admin to tenant
    const unreadMessagesCount = adminUser ? await prisma.message.count({
      where: {
        senderId: adminUser.id,
        receiverId: user.id,
        isRead: false
      }
    }) : 0

    // Get unpaid invoices count and list
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        contractId: contract?.id,
        status: {
          in: ['UNPAID', 'OVERDUE']
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    })

    const unpaidInvoicesCount = unpaidInvoices.length
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0)

    // Get issues count by status
    const [pendingIssues, processingIssues, doneIssues, cancelledIssues] = await Promise.all([
      prisma.issue.count({
        where: { userId: userWithContracts.id, status: 'PENDING' }
      }),
      prisma.issue.count({
        where: { userId: userWithContracts.id, status: 'PROCESSING' }
      }),
      prisma.issue.count({
        where: { userId: userWithContracts.id, status: 'DONE' }
      }),
      prisma.issue.count({
        where: { userId: userWithContracts.id, status: 'CANCELLED' }
      })
    ])

    return NextResponse.json({
      currentInvoice,
      contract,
      utilityCosts,
      costStructure,
      recentActivities,
      currentMonth,
      currentYear,
      unreadMessagesCount,
      unpaidInvoices,
      unpaidInvoicesCount,
      unpaidAmount,
      issues: {
        pending: pendingIssues,
        processing: processingIssues,
        done: doneIssues,
        cancelled: cancelledIssues
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
