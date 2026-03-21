import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const userIdParam = searchParams.get('userId')

    // Get user ID from query param or header (in production, get from session)
    let userId: number | null = null

    if (userIdParam) {
      userId = parseInt(userIdParam)
    } else {
      // Try to get from Authorization header
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // Extract user ID from token (temporary solution)
        const tokenParts = token.split('-')
        if (tokenParts.length >= 2) {
          userId = parseInt(tokenParts[1])
        }
      }
    }

    // If no userId found, try to get from first tenant (fallback for demo)
    let user
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId, role: 'TENANT' },
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            take: 1
          }
        }
      })
    }

    // Fallback: get first tenant user if userId not provided or not found
    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: 'TENANT' },
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            take: 1
          }
        }
      })
    }

    if (!user || !user.contracts[0]) {
      return NextResponse.json([])
    }

    const contractId = user.contracts[0].id

    const invoices = await prisma.invoice.findMany({
      where: {
        contractId
      },
      include: {
        contract: {
          include: {
            user: true,
            room: {
              include: {
                building: true
              }
            },
            occupants: true // Lấy số người ở cùng
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    // Get service prices
    const elecService = await prisma.service.findFirst({
      where: { name: 'Điện', isActive: true }
    })
    const waterService = await prisma.service.findFirst({
      where: { name: 'Nước', isActive: true }
    })
    const commonService = await prisma.service.findFirst({
      where: {
        OR: [
          { name: { contains: 'Dịch vụ chung', mode: 'insensitive' } },
          { name: { contains: 'Phí quản lý', mode: 'insensitive' } },
          { name: { contains: 'Phí dịch vụ', mode: 'insensitive' } },
          { name: { contains: 'Quản lý', mode: 'insensitive' } }
        ],
        isActive: true
      }
    })

    const elecPrice = elecService ? Number(elecService.unitPrice) : 0
    const waterPrice = waterService ? Number(waterService.unitPrice) : 0
    const commonServicePrice = commonService ? Number(commonService.unitPrice) : 0

    // Bulk fetch meter readings and issues to resolve N+1
    const [allMeterReadings, allIssues] = await Promise.all([
      prisma.meterReading.findMany({
        where: {
          roomId: user.contracts[0].roomId,
          OR: invoices.map(inv => ({ month: inv.month, year: inv.year }))
        }
      }),
      prisma.issue.findMany({
        where: {
          userId: user.id,
          roomId: user.contracts[0].roomId,
          status: 'DONE',
          repairCost: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    const enrichedInvoices = invoices.map(invoice => {
      const meterReading = allMeterReadings.find(m => m.month === invoice.month && m.year === invoice.year)
      const elecConsumption = meterReading ? meterReading.elecNew - meterReading.elecOld : 0
      const waterConsumption = meterReading ? meterReading.waterNew - meterReading.waterOld : 0
      const numberOfPeople = 1 + (invoice.contract.occupants?.length || 0)

      const amountCommonService = Number(invoice.amountCommonService || 0)
      const amountService = Number(invoice.amountService || 0)
      const isIssueInvoice = Number(invoice.amountRoom) === 0 && Number(invoice.amountElec) === 0 && Number(invoice.amountWater) === 0 && amountCommonService === 0 && amountService > 0

      let issueInfo = null
      let issueRepairCost = 0
      let managementFee = amountCommonService // Phí dịch vụ chung - luôn lấy từ amountCommonService của invoice

      // Find the most recent relevant issue for this invoice's amountService
      const relatedIssue = allIssues.find(iss => {
        const repairCost = Number(iss.repairCost);
        // Check if the issue's repair cost matches the invoice's amountService
        // and if the issue's creation date is around the invoice period (within a reasonable window)
        // This is a heuristic, adjust as needed. For simplicity, we'll just match repairCost.
        return Math.abs(repairCost - amountService) < 1000; // Allow for minor discrepancies
      });

      if (relatedIssue) {
        issueInfo = { id: relatedIssue.id, title: relatedIssue.title };
        issueRepairCost = Number(relatedIssue.repairCost);
      }

      return {
        ...invoice,
        amountCommonService,
        meterReading: meterReading ? {
          elecOld: meterReading.elecOld,
          elecNew: meterReading.elecNew,
          waterOld: meterReading.waterOld,
          waterNew: meterReading.waterNew
        } : null,
        quantities: { elecConsumption, waterConsumption, numberOfPeople },
        prices: { elecPrice, waterPrice, commonServicePrice },
        issueInfo,
        isIssueInvoice,
        issueRepairCost,
        managementFee: amountCommonService
      }
    })

    // Sort: prioritize UNPAID invoices first, then by year/month descending
    enrichedInvoices.sort((a, b) => {
      // Priority order: UNPAID > OVERDUE > PAID
      const statusPriority = { UNPAID: 0, OVERDUE: 1, PAID: 2 }
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 3
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 3

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // If same status, sort by year/month descending
      if (a.year !== b.year) {
        return b.year - a.year
      }
      return b.month - a.month
    })

    // Filter by search if provided
    let filteredInvoices = enrichedInvoices
    if (search) {
      const searchLower = search.toLowerCase()
      filteredInvoices = enrichedInvoices.filter(inv => {
        const monthYear = `${inv.month}/${inv.year}`
        return monthYear.includes(searchLower)
      })
    }

    return NextResponse.json(filteredInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
