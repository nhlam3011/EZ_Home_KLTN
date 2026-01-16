import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' },
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const contract = user.contracts[0]

    // Get current month invoice
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    
    const currentInvoice = await prisma.invoice.findFirst({
      where: {
        contractId: contract?.id,
        month: currentMonth,
        year: currentYear
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get utility costs for last 6 months
    const utilityCosts = []
    for (let i = 5; i >= 0; i--) {
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

    // Calculate cost structure from current invoice
    let costStructure = {
      room: 0,
      services: 0,
      other: 0
    }
    
    if (currentInvoice) {
      const total = Number(currentInvoice.totalAmount || 0)
      if (total > 0) {
        const roomAmount = Number(currentInvoice.amountRoom || 0)
        const serviceAmount = Number(currentInvoice.amountService || 0)
        const utilityAmount = Number(currentInvoice.amountElec || 0) + Number(currentInvoice.amountWater || 0)
        const otherAmount = total - roomAmount - serviceAmount - utilityAmount
        
        costStructure = {
          room: Math.round((roomAmount / total) * 100),
          services: Math.round(((serviceAmount + utilityAmount) / total) * 100),
          other: Math.round((otherAmount / total) * 100)
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
        userId: user.id
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        room: { select: { name: true } }
      }
    })

    const recentActivities = []
    
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

    // Get unread messages count
    const unreadMessages = await prisma.post.count({
      where: {
        userId: user.id,
        OR: [
          { content: { startsWith: '[Hóa đơn' } },
          { content: { startsWith: '[Thông báo' } },
          { content: { startsWith: '[Tin nhắn' } }
        ],
        status: 'PUBLIC',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    return NextResponse.json({
      currentInvoice,
      contract,
      utilityCosts,
      costStructure,
      recentActivities,
      currentMonth,
      currentYear,
      unreadMessagesCount: unreadMessages
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
