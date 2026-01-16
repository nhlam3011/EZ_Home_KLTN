import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    })

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

        // Check if this invoice is for issue repair cost only
        // If amountRoom = 0, amountElec = 0, amountWater = 0 and amountService > 0, it's an issue invoice
        const isIssueInvoice = Number(invoice.amountRoom) === 0 && 
                               Number(invoice.amountElec) === 0 && 
                               Number(invoice.amountWater) === 0 && 
                               Number(invoice.amountService) > 0

        // Try to find related issue by matching repairCost
        let issueInfo = null
        let issueRepairCost = 0
        let managementFee = 0

        if (isIssueInvoice) {
          // This is a separate invoice for issue repair cost
          issueRepairCost = Number(invoice.amountService)
          managementFee = 0
          
          // Try to find the related issue
          const relatedIssue = await prisma.issue.findFirst({
            where: {
              userId: invoice.contract.userId,
              roomId: invoice.contract.roomId,
              repairCost: {
                equals: Number(invoice.amountService)
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
        } else if (Number(invoice.amountService) > 0) {
          // Regular invoice - check if amountService includes issue repair cost
          const expectedManagementFee = commonServicePrice * numberOfPeople
          const actualServiceAmount = Number(invoice.amountService)
          
          // Try to find issue with repairCost that might be included
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
            // If repairCost matches or is part of amountService
            if (repairCost === actualServiceAmount || 
                (actualServiceAmount > expectedManagementFee && 
                 Math.abs(actualServiceAmount - expectedManagementFee - repairCost) < 1000)) {
              issueInfo = {
                id: relatedIssue.id,
                title: relatedIssue.title
              }
              issueRepairCost = repairCost
              managementFee = actualServiceAmount - repairCost
            } else {
              // All is management fee
              managementFee = actualServiceAmount
            }
          } else {
            // No issue found, all is management fee
            managementFee = actualServiceAmount
          }
        }

        return {
          ...invoice,
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
          managementFee
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
