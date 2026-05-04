import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const months = parseInt(searchParams.get('months') || '6')
    const userId = searchParams.get('userId')

    // Always check and update overdue invoices when loading dashboard
    try {
      const now = new Date()
      await prisma.invoice.updateMany({
        where: {
          status: 'UNPAID',
          paymentDueDate: {
            lt: now
          }
        },
        data: {
          status: 'OVERDUE'
        }
      })
    } catch (updateError) {
      console.log('Could not update overdue invoices:', updateError)
    }

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
          where: {
            status: { in: ['ACTIVE', 'EXPIRED'] }
          },
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
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // 1. Parallel fetch initial data
    const monthsToFetch = Math.min(Math.max(months, 3), 12)
    const historyMonths = []
    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      historyMonths.push({ month: date.getMonth() + 1, year: date.getFullYear(), date })
    }

    const [
      currentInvoice,
      historyInvoices,
      monthInvoices,
      recentInvoices,
      recentIssues,
      adminUser,
      unpaidInvoices,
      issueCounts
    ] = await Promise.all([
      // Current/Last unpaid invoice
      contract?.id ? prisma.invoice.findFirst({
        where: {
          contractId: contract.id,
          OR: [{ status: { in: ['UNPAID', 'OVERDUE'] } }, { month: currentMonth, year: currentYear }]
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }]
      }) : Promise.resolve(null),

      // Bulk fetch history for utility costs
      contract?.id ? prisma.invoice.findMany({
        where: {
          contractId: contract.id,
          OR: historyMonths.map(h => ({ month: h.month, year: h.year }))
        }
      }) : Promise.resolve([]),

      // All invoices for cost structure
      contract?.id ? prisma.invoice.findMany({
        where: { contractId: contract.id, month: currentMonth, year: currentYear }
      }) : Promise.resolve([]),

      // Recent activities
      contract?.id ? prisma.invoice.findMany({
        where: { contractId: contract.id },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }) : Promise.resolve([]),

      prisma.issue.findMany({
        where: { userId: user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { room: { select: { name: true } } }
      }),

      prisma.user.findFirst({ where: { role: 'ADMIN' } }),

      // Dashboard summary stats
      contract?.id ? prisma.invoice.findMany({
        where: { contractId: contract.id, status: { in: ['UNPAID', 'OVERDUE'] } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 5
      }) : Promise.resolve([]),

      Promise.all(['PENDING', 'PROCESSING', 'DONE', 'CANCELLED'].map(status =>
        prisma.issue.count({ where: { userId: user.id, status: status as any } })
      ))
    ])

    // 2. Map history data (utility costs)
    const utilityCosts = historyMonths.map(h => {
      const inv = historyInvoices.find(i => i.month === h.month && i.year === h.year)
      return {
        month: h.month,
        year: h.year,
        monthName: h.date.toLocaleDateString('vi-VN', { month: 'short' }),
        elec: Number(inv?.amountElec || 0),
        water: Number(inv?.amountWater || 0)
      }
    })

    // 3. Calculate cost structure
    let costStructure = { room: 0, services: 0, other: 0, total: 0 }
    if (monthInvoices.length > 0) {
      let tr = 0, ts = 0, to = 0, ta = 0
      monthInvoices.forEach(inv => {
        const r = Number(inv.amountRoom || 0)
        const s = Number(inv.amountCommonService || 0) + Number(inv.amountService || 0) + Number(inv.amountElec || 0) + Number(inv.amountWater || 0)
        const t = Number(inv.totalAmount || 0)
        tr += r; ts += s; to += (t - r - s); ta += t
      })
      if (ta > 0) costStructure = { room: Math.round((tr / ta) * 100), services: Math.round((ts / ta) * 100), other: Math.round((to / ta) * 100), total: ta }
    }

    // 4. Combine recent activities
    const recentActivities = [
      ...recentInvoices.map(inv => ({
        description: inv.status === 'PAID' ? `Thanh toán hóa đơn tháng ${inv.month}/${inv.year}` : `Hóa đơn tháng ${inv.month}/${inv.year}`,
        time: new Date(inv.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: 'Tài chính',
        status: inv.status === 'PAID' ? 'Thành công' : inv.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'
      })),
      ...recentIssues.map(issue => ({
        description: `Báo hỏng: ${issue.title}`,
        time: new Date(issue.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: 'Kỹ thuật',
        status: issue.status === 'DONE' ? 'Hoàn thành' : issue.status === 'PROCESSING' ? 'Đang xử lý' : issue.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xử lý'
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)

    // 5. Final counts - Lấy đúng số tiền hóa đơn mới nhất (đã bao gồm nợ cũ)
    let unpaidAmount = 0;
    if (unpaidInvoices.length > 0) {
      unpaidAmount = Number(unpaidInvoices[0].totalAmount || 0);
    }

    const unreadMessagesCount = adminUser ? await prisma.message.count({
      where: { senderId: adminUser.id, receiverId: user.id, isRead: false }
    }) : 0

    const unpaidInvoicesCount = mergedUnpaidInvoices.length
    const unpaidAmount = mergedUnpaidAmount

    const [pendingIssues, processingIssues, doneIssues, cancelledIssues] = issueCounts

    // Calculate contract expiry info
    let isExpired = false
    let daysUntilExpiry = null
    if (contract && contract.endDate) {
      const now = new Date()
      const endDate = new Date(contract.endDate)
      if (contract.status === 'EXPIRED' || endDate < now) {
        isExpired = true
      } else {
        const diffTime = endDate.getTime() - now.getTime()
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }
    }

    return NextResponse.json({
      currentInvoice: mergedCurrentInvoice,
      contract,
      contractStatus: {
        isExpired,
        daysUntilExpiry
      },
      utilityCosts,
      costStructure,
      recentActivities,
      currentMonth,
      currentYear,
      unreadMessagesCount,
      unpaidInvoices: mergedUnpaidInvoices,
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
