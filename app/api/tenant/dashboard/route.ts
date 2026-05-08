import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const months = parseInt(searchParams.get('months') || '6')
    const userId = searchParams.get('userId')

    // We removed the global invoice.updateMany here because it was a huge performance bottleneck.
    // Overdue status should be updated by a cron job or background task, not on every dashboard load.

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

    // Use contract from the already fetched user object
    const contract = user.contracts?.[0]
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
      unreadMessagesCount,
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

      // Unread messages from any admin
      prisma.message.count({
        where: { 
          receiverId: user.id, 
          isRead: false,
          sender: { role: 'ADMIN' }
        }
      }),

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

    // 3. Calculate cost structures for all history months
    const costStructures = historyMonths.map(h => {
      const monthInvs = historyInvoices.filter(i => i.month === h.month && i.year === h.year)
      let room = 0, services = 0, other = 0, total = 0
      let roomAmount = 0, servicesAmount = 0, otherAmount = 0
      if (monthInvs.length > 0) {
        let tr = 0, ts = 0, to = 0, ta = 0
        monthInvs.forEach(inv => {
          const r = Number(inv.amountRoom || 0)
          const s = Number(inv.amountCommonService || 0) + Number(inv.amountElec || 0) + Number(inv.amountWater || 0)
          const o = Number(inv.amountService || 0) // Phí xử lý sự cố, yêu cầu dịch vụ
          // The true total incurred in this month (ignoring overdue carry-over debt)
          const t = r + s + o
          tr += r; ts += s; to += o; ta += t
        })
        if (ta > 0) {
          room = Math.round((tr / ta) * 100)
          services = Math.round((ts / ta) * 100)
          other = Math.round((to / ta) * 100)
          total = ta
          roomAmount = tr
          servicesAmount = ts
          otherAmount = to
        }
      }
      return {
        month: h.month,
        year: h.year,
        label: `${h.month}/${h.year}`,
        room,
        services,
        other,
        roomAmount,
        servicesAmount,
        otherAmount,
        total
      }
    }).filter(c => c.total > 0) // Only include months with actual costs

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

    // 5. Final counts - Lấy số tiền từ hoá đơn mới nhất (đã bao gồm nợ cũ)
    // Hoá đơn mới nhất đã gộp nợ cũ vào totalAmount rồi, không cần cộng thêm
    let totalUnpaidAmount = 0;
    if (unpaidInvoices.length > 0) {
      // unpaidInvoices đã sort theo year desc, month desc
      // Hoá đơn đầu tiên (mới nhất) đã bao gồm tất cả nợ cũ
      totalUnpaidAmount = Number(unpaidInvoices[0].totalAmount || 0);
    }

    const unpaidInvoicesCount = unpaidInvoices.length

    const [pendingIssues, processingIssues, doneIssues, cancelledIssues] = issueCounts

    // Calculate contract expiry info
    let isExpired = false
    let daysUntilExpiry = null
    let graceDaysRemaining = null
    if (contract && contract.endDate) {
      const now = new Date()
      const endDate = new Date(contract.endDate)
      if (contract.status === 'EXPIRED' || endDate < now) {
        isExpired = true
        const graceEndDate = new Date(endDate.getTime() + 10 * 24 * 60 * 60 * 1000)
        const diffTime = graceEndDate.getTime() - now.getTime()
        graceDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      } else {
        const diffTime = endDate.getTime() - now.getTime()
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }
    }

    return NextResponse.json({
      currentInvoice,
      contract,
      contractStatus: {
        isExpired,
        daysUntilExpiry,
        graceDaysRemaining
      },
      utilityCosts,
      costStructures,
      recentActivities,
      currentMonth,
      currentYear,
      unreadMessagesCount,
      unpaidInvoices,
      unpaidInvoicesCount,
      unpaidAmount: totalUnpaidAmount,
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
