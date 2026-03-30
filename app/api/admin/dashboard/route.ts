import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buildingIdParam = searchParams.get('buildingId')
    const buildingIdValue = (buildingIdParam && buildingIdParam !== 'all' && buildingIdParam !== 'undefined' && buildingIdParam !== 'null') 
      ? parseInt(buildingIdParam) 
      : null
    const buildingId = (buildingIdValue !== null && !isNaN(buildingIdValue)) ? buildingIdValue : null
    
    const whereClause: any = {}
    if (buildingId) {
      whereClause.buildingId = buildingId
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    // Preparation for ranges
    const yearStart = new Date(currentYear, 0, 1)
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    
    const dates = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1)
      dates.push({ month: date.getMonth() + 1, year: date.getFullYear(), date })
    }
    
    const sixMonthsAgo = dates[0].date

    // Optimized Block 1: Parallel aggregation and counting
    const [
      roomStatusCounts,
      issueStatusCounts,
      invoiceStatusCounts,
      revenueSummaries,
      totalResidents,
      unpaidAmountSum
    ] = await Promise.all([
      // Count rooms by status
      prisma.room.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true
      }),
      // Count issues by status
      prisma.issue.groupBy({
        by: ['status'],
        where: buildingId ? { room: { buildingId } } : {},
        _count: true
      }),
      // Count invoices by status
      prisma.invoice.groupBy({
        by: ['status'],
        where: buildingId ? { buildingId } : {},
        _count: true
      }),
      // Revenue data for last 6 months + Current Year
      prisma.invoice.groupBy({
        by: ['month', 'year'],
        where: {
          status: 'PAID',
          OR: [
            { createdAt: { gte: yearStart } },
            { createdAt: { gte: sixMonthsAgo } }
          ],
          ...(buildingId ? { buildingId } : {})
        },
        _sum: { totalAmount: true }
      }),
      // Resident count (Hard to gộp due to relationships)
      prisma.user.count({ 
        where: { 
          role: 'TENANT',
          contracts: buildingId ? { some: { room: { buildingId } } } : undefined
        } 
      }),
      // Unpaid amount sum
      prisma.invoice.aggregate({
        where: { 
          status: 'UNPAID',
          ...(buildingId ? { buildingId } : {})
        },
        _sum: { totalAmount: true }
      })
    ])

    // Optimized Block 2: Data retrieval
    const [
      buildingInfo,
      recentInvoices,
      recentIssues
    ] = await Promise.all([
      buildingId ? prisma.building.findUnique({
        where: { id: buildingId },
        include: {
          ownerContracts: {
            where: { status: 'ACTIVE' },
            include: {
              owner: { select: { fullName: true, phone: true, email: true } }
            },
            take: 1
          }
        }
      }) : Promise.resolve(null),
      prisma.invoice.findMany({
        where: buildingId ? { buildingId } : {},
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
        where: buildingId ? { room: { buildingId } } : {},
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, id: true } },
          room: { select: { name: true } }
        }
      })
    ])

    // Process Room Stats
    const totalRooms = roomStatusCounts.reduce((sum, item) => sum + item._count, 0)
    const rentedRooms = roomStatusCounts.find(r => r.status === 'RENTED')?._count || 0
    
    // Process Issue Stats
    const getIssueCount = (status: string) => issueStatusCounts.find(i => i.status === status)?._count || 0
    const pendingIssues = getIssueCount('PENDING')
    const processingIssues = getIssueCount('PROCESSING')
    const doneIssues = getIssueCount('DONE')
    const cancelledIssues = getIssueCount('CANCELLED')

    // Process Invoice Stats
    const getInvoiceCount = (status: string) => invoiceStatusCounts.find(i => i.status === status)?._count || 0
    const paidInvoices = getInvoiceCount('PAID')
    const unpaidInvoices = getInvoiceCount('UNPAID')
    const overdueInvoices = getInvoiceCount('OVERDUE')
    const totalInvoices = invoiceStatusCounts.reduce((sum, item) => sum + item._count, 0)

    // Process Revenue Stats (from in-memory revenueSummaries)
    const monthlyRevenueSum = revenueSummaries.find(s => s.month === currentMonth && s.year === currentYear)?._sum.totalAmount || 0
    const yearRevenueSum = revenueSummaries
      .filter(s => s.year === currentYear)
      .reduce((sum, s) => sum + Number(s._sum.totalAmount || 0), 0)
    const prevMonthRevenueSum = revenueSummaries.find(s => s.month === prevMonth && s.year === prevYear)?._sum.totalAmount || 0

    const revenueData = dates.map(d => {
      const summary = revenueSummaries.find(s => s.month === d.month && s.year === d.year)
      return {
        month: d.month,
        year: d.year,
        monthName: d.date.toLocaleDateString('vi-VN', { month: 'short' }),
        revenue: Number(summary?._sum.totalAmount || 0)
      }
    })

    // Calculations
    const revenue = Number(monthlyRevenueSum)
    const prevRevenue = Number(prevMonthRevenueSum)
    const revenueChange = prevRevenue > 0
      ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
      : 0

    const paymentRate = totalInvoices > 0
      ? Math.round((paidInvoices / totalInvoices) * 100)
      : 0

    const occupancyRate = totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0

    return NextResponse.json({
      buildingInfo,
      totalRooms,
      rentedRooms,
      vacantRooms: totalRooms - rentedRooms,
      totalResidents,
      monthlyRevenue: revenue,
      yearRevenue: Number(yearRevenueSum),
      revenueChange,
      occupancyRate,
      pendingIssues,
      processingIssues,
      doneIssues,
      cancelledIssues,
      unpaidInvoices,
      unpaidAmount: Number(unpaidAmountSum._sum.totalAmount || 0),

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

      recentInvoices: (recentInvoices || []).map(inv => ({
        id: inv.id,
        type: 'payment',
        user: inv.contract?.user?.fullName || 'N/A',
        room: inv.contract?.room?.name || 'N/A',
        amount: Number(inv.totalAmount || 0),
        status: inv.status,
        createdAt: inv.createdAt
      })),
      recentIssues: (recentIssues || []).map(issue => ({
        id: issue.id,
        type: 'issue',
        user: issue.user?.fullName || 'N/A',
        room: issue.room?.name || 'N/A',
        title: issue.title || 'N/A',
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
