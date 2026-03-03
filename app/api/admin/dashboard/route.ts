import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Basic stats
    const [
      totalRooms,
      rentedRooms,
      totalResidents,
      monthlyRevenue,
      pendingIssues,
      unpaidInvoices,
      processingIssues,
      doneIssues,
      cancelledIssues
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'RENTED' } }),
      prisma.user.count({ where: { role: 'TENANT' } }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          month: currentMonth,
          year: currentYear
        },
        _sum: { totalAmount: true }
      }),
      prisma.issue.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'UNPAID' } }),
      prisma.issue.count({ where: { status: 'PROCESSING' } }),
      prisma.issue.count({ where: { status: 'DONE' } }),
      prisma.issue.count({ where: { status: 'CANCELLED' } })
    ])

    // Preparation for parallel queries
    const yearStart = new Date(currentYear, 0, 1)
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const dates = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1)
      dates.push({ month: date.getMonth() + 1, year: date.getFullYear(), date })
    }

    const [
      yearRevenue,
      prevMonthRevenue,
      paidInvoices,
      overdueInvoices,
      totalInvoices,
      unpaidAmount,
      recentInvoices,
      recentIssues,
      ...revenueResults
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: 'PAID', createdAt: { gte: yearStart } },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID', month: prevMonth, year: prevYear },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.invoice.count(),
      prisma.invoice.aggregate({
        where: { status: 'UNPAID' },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            include: {
              user: { select: { fullName: true, id: true } },
              room: { select: { name: true } }
            }
          }
        }
      }),
      prisma.issue.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, id: true } },
          room: { select: { name: true } }
        }
      }),
      ...dates.map(d => prisma.invoice.aggregate({
        where: { status: 'PAID', month: d.month, year: d.year },
        _sum: { totalAmount: true }
      }))
    ]);

    const revenueData = dates.map((d, i) => ({
      month: d.month,
      year: d.year,
      monthName: d.date.toLocaleDateString('vi-VN', { month: 'short' }),
      revenue: Number(revenueResults[i]._sum.totalAmount || 0)
    }));

    const revenue = Number(monthlyRevenue._sum.totalAmount || 0)
    const prevRevenue = Number(prevMonthRevenue._sum.totalAmount || 0)
    const revenueChange = prevRevenue > 0
      ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
      : 0

    const paymentRate = totalInvoices > 0
      ? Math.round((paidInvoices / totalInvoices) * 100)
      : 0

    const occupancyRate = totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0

    return NextResponse.json({
      // Basic stats
      totalRooms,
      rentedRooms,
      vacantRooms: totalRooms - rentedRooms,
      totalResidents,
      monthlyRevenue: revenue,
      yearRevenue: Number(yearRevenue._sum.totalAmount || 0),
      revenueChange,
      occupancyRate,
      pendingIssues,
      processingIssues,
      doneIssues,
      cancelledIssues,
      unpaidInvoices,
      unpaidAmount: Number(unpaidAmount._sum.totalAmount || 0),

      // Charts data
      revenueChart: revenueData,
      invoiceStatus: {
        paid: paidInvoices,
        unpaid: unpaidInvoices,
        overdue: overdueInvoices,
        total: totalInvoices
      },
      paymentRate,
      issueStatus: {
        pending: pendingIssues,
        processing: processingIssues,
        done: doneIssues,
        cancelled: cancelledIssues
      },

      // Recent activities
      recentInvoices: recentInvoices.map(inv => ({
        id: inv.id,
        type: 'payment',
        user: inv.contract.user.fullName,
        room: inv.contract.room.name,
        amount: Number(inv.totalAmount),
        status: inv.status,
        createdAt: inv.createdAt
      })),
      recentIssues: recentIssues.map(issue => ({
        id: issue.id,
        type: 'issue',
        user: issue.user.fullName,
        room: issue.room.name,
        title: issue.title,
        status: issue.status,
        createdAt: issue.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
