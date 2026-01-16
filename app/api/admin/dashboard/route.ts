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

    // Revenue for last 6 months
    const revenueData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      
      const revenue = await prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          month,
          year
        },
        _sum: { totalAmount: true }
      })
      
      revenueData.push({
        month: month,
        year: year,
        monthName: date.toLocaleDateString('vi-VN', { month: 'short' }),
        revenue: Number(revenue._sum.totalAmount || 0)
      })
    }

    // Total revenue this year
    const yearStart = new Date(currentYear, 0, 1)
    const yearRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: yearStart
        }
      },
      _sum: { totalAmount: true }
    })

    // Previous month revenue for comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const prevMonthRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        month: prevMonth,
        year: prevYear
      },
      _sum: { totalAmount: true }
    })

    const revenue = Number(monthlyRevenue._sum.totalAmount || 0)
    const prevRevenue = Number(prevMonthRevenue._sum.totalAmount || 0)
    const revenueChange = prevRevenue > 0 
      ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) 
      : 0

    // Invoice status breakdown
    const paidInvoices = await prisma.invoice.count({ where: { status: 'PAID' } })
    const overdueInvoices = await prisma.invoice.count({ where: { status: 'OVERDUE' } })
    const totalInvoices = await prisma.invoice.count()
    const paymentRate = totalInvoices > 0 
      ? Math.round((paidInvoices / totalInvoices) * 100) 
      : 0

    // Total unpaid amount
    const unpaidAmount = await prisma.invoice.aggregate({
      where: { status: 'UNPAID' },
      _sum: { totalAmount: true }
    })

    // Recent activities
    const recentInvoices = await prisma.invoice.findMany({
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
    })

    const recentIssues = await prisma.issue.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, id: true } },
        room: { select: { name: true } }
      }
    })

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
