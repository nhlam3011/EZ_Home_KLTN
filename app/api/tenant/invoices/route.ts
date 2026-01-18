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
            room: true,
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

    // Enrich invoices with meter readings and calculated quantities
    const enrichedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        // Get meter reading for this invoice period
        const meterReading = await prisma.meterReading.findFirst({
          where: {
            roomId: invoice.contract.roomId,
            month: invoice.month,
            year: invoice.year
          }
        })

        // Calculate quantities
        const elecConsumption = meterReading 
          ? meterReading.elecNew - meterReading.elecOld 
          : 0
        const waterConsumption = meterReading 
          ? meterReading.waterNew - meterReading.waterOld 
          : 0
        const numberOfPeople = 1 + (invoice.contract.occupants?.length || 0)

        // Get amounts from invoice
        const amountCommonService = Number(invoice.amountCommonService || 0)
        const amountService = Number(invoice.amountService || 0)
        
        // Check if this invoice is for issue repair cost only
        // If amountRoom = 0, amountElec = 0, amountWater = 0, amountCommonService = 0 and amountService > 0, it's an issue invoice
        const isIssueInvoice = Number(invoice.amountRoom) === 0 && 
                               Number(invoice.amountElec) === 0 && 
                               Number(invoice.amountWater) === 0 && 
                               amountCommonService === 0 &&
                               amountService > 0

        // Try to find related issue by matching repairCost
        let issueInfo = null
        let issueRepairCost = 0
        // Phí dịch vụ chung - luôn lấy từ amountCommonService của invoice
        let managementFee = amountCommonService

        if (isIssueInvoice) {
          // This is a separate invoice for issue repair cost
          issueRepairCost = amountService
          managementFee = 0
          
          // Try to find the related issue
          const relatedIssue = await prisma.issue.findFirst({
            where: {
              userId: invoice.contract.userId,
              roomId: invoice.contract.roomId,
              repairCost: {
                equals: amountService
              },
              status: 'DONE'
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          })
          
          if (relatedIssue) {
            issueInfo = {
              id: relatedIssue.id,
              title: relatedIssue.title
            }
          }
        } else if (amountService > 0) {
          // Regular invoice - amountService might contain issue repair cost
          // Try to find issue with repairCost
          const relatedIssue = await prisma.issue.findFirst({
            where: {
              userId: invoice.contract.userId,
              roomId: invoice.contract.roomId,
              status: 'DONE',
              repairCost: {
                not: null
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          })
          
          if (relatedIssue && relatedIssue.repairCost) {
            const repairCost = Number(relatedIssue.repairCost)
            // If repairCost matches amountService
            if (Math.abs(repairCost - amountService) < 1000) {
              issueInfo = {
                id: relatedIssue.id,
                title: relatedIssue.title
              }
              issueRepairCost = repairCost
            }
          }
        }

        return {
          ...invoice,
          amountCommonService: amountCommonService, // Đảm bảo trả về amountCommonService
          meterReading: meterReading ? {
            elecOld: meterReading.elecOld,
            elecNew: meterReading.elecNew,
            waterOld: meterReading.waterOld,
            waterNew: meterReading.waterNew
          } : null,
          quantities: {
            elecConsumption,
            waterConsumption,
            numberOfPeople
          },
          prices: {
            elecPrice,
            waterPrice,
            commonServicePrice
          },
          issueInfo,
          isIssueInvoice,
          issueRepairCost,
          managementFee: amountCommonService // Đảm bảo managementFee = amountCommonService
        }
      })
    )

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
