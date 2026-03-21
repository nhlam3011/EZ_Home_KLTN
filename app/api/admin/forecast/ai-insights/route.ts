import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geminiModel } from '@/lib/gemini'

// Structured data types for AI insights
export interface StructuredInsight {
  overview: {
    currentRevenue: number
    previousRevenue: number
    revenueTrend: 'up' | 'down' | 'stable'
    revenueTrendPercent: number
    last3MonthsRevenue: number[]
    occupancyRate: number
  }
  warnings: {
    expiringContracts: Array<{
      contractId: number
      roomName: string
      tenantName: string
      endDate: string
      daysUntilExpiry: number
    }>
    overdueInvoices: Array<{
      invoiceId: number
      roomName: string
      tenantName: string
      amount: number
      overdueDays: number
    }>
    totalDebt: number
  }
  recommendations: Array<{
    id: number
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    actionType: 'view_list' | 'send_message' | 'renew_contract' | 'check_invoice'
    targetCount?: number
  }>
}

export async function POST(request: Request) {
  try {
    const { buildingId } = await request.json().catch(() => ({}));
    const buildingIdInt = buildingId && buildingId !== 'all' ? parseInt(buildingId) : null

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 })
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Gather data in parallel
    const [
      building,
      totalRooms,
      availableRooms,
      activeContracts,
      recentInvoices,
      overdueInvoicesData,
      expiringContractsData
    ] = await Promise.all([
      buildingIdInt ? prisma.building.findUnique({ where: { id: buildingIdInt } }) : Promise.resolve(null),
      prisma.room.count({ where: buildingIdInt ? { buildingId: buildingIdInt } : {} }),
      prisma.room.count({ 
        where: { 
          status: 'AVAILABLE',
          ...(buildingIdInt ? { buildingId: buildingIdInt } : {})
        } 
      }),
      prisma.contract.count({ 
        where: { 
          status: 'ACTIVE',
          ...(buildingIdInt ? { room: { buildingId: buildingIdInt } } : {})
        } 
      }),
      prisma.invoice.findMany({
        where: { 
          year: currentYear,
          ...(buildingIdInt ? { buildingId: buildingIdInt } : {})
        },
        select: { month: true, year: true, totalAmount: true, status: true },
        orderBy: { month: 'asc' }
      }),
      prisma.invoice.findMany({
        where: { 
          status: 'OVERDUE',
          ...(buildingIdInt ? { buildingId: buildingIdInt } : {})
        },
        include: {
          contract: {
            include: {
              room: { select: { name: true } },
              user: { select: { fullName: true } }
            }
          }
        },
        orderBy: { paymentDueDate: 'asc' }
      }),
      prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: currentDate,
            lte: new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
          ...(buildingIdInt ? { room: { buildingId: buildingIdInt } } : {})
        },
        include: {
          room: { select: { name: true } },
          user: { select: { fullName: true } },
        },
        orderBy: { endDate: 'asc' }
      }),
    ])

    // Calculate monthly revenue for trend analysis
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const monthInvoices = recentInvoices.filter((inv) => inv.month === i + 1)
      return {
        month: i + 1,
        total: monthInvoices.reduce((s, inv) => s + Number(inv.totalAmount), 0),
        paid: monthInvoices.filter((inv) => inv.status === 'PAID').reduce((s, inv) => s + Number(inv.totalAmount), 0),
        count: monthInvoices.length,
      }
    })

    // Get last 3 months with data for sparkline
    const last3MonthsRevenue = monthlyRevenue
      .filter(m => m.count > 0)
      .slice(-3)
      .map(m => m.paid)

    // Current month revenue (latest month with data)
    const currentMonthData = monthlyRevenue.find(m => m.month === currentMonth && m.count > 0)
    const previousMonthData = monthlyRevenue.find(m => m.month === currentMonth - 1 && m.count > 0)

    const currentRevenue = currentMonthData?.paid || 0
    const previousRevenue = previousMonthData?.paid || 0
    const revenueTrendPercent = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100)
      : 0
    const revenueTrend: 'up' | 'down' | 'stable' = revenueTrendPercent > 5 ? 'up' : revenueTrendPercent < -5 ? 'down' : 'stable'

    // Occupancy rate
    const occupancyRate = totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100) : 0

    // Process overdue invoices
    const overdueInvoices = overdueInvoicesData.map(inv => {
      const dueDate = new Date(inv.paymentDueDate)
      const daysOverdue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        invoiceId: inv.id,
        roomName: inv.contract?.room?.name || 'N/A',
        tenantName: inv.contract?.user?.fullName || 'N/A',
        amount: Number(inv.totalAmount),
        overdueDays: daysOverdue
      }
    })

    const totalDebt = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)

    // Process expiring contracts
    const expiringContracts = expiringContractsData.map(contract => {
      const endDate = new Date(contract.endDate!)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        contractId: contract.id,
        roomName: contract.room.name,
        tenantName: contract.user.fullName,
        endDate: contract.endDate!.toLocaleDateString('vi-VN'),
        daysUntilExpiry
      }
    })

    // Get data for AI analysis
    const dataContext = `
DỮ LIỆU THỐNG KÊ NHÀ TRỌ EZ-HOME (Tháng ${currentMonth}/${currentYear})${building ? ` - TÒA NHÀ: ${building.name} (${building.address})` : ''}:

1. PHÒNG:
- Tổng: ${totalRooms} phòng
- Trống: ${availableRooms} phòng
- Tỷ lệ lấp đầy: ${occupancyRate.toFixed(1)}%
- Hợp đồng đang hoạt động: ${activeContracts}

2. DOANH THU THEO THÁNG (${currentYear}):
${monthlyRevenue.filter(m => m.count > 0).map((m) => `- Tháng ${m.month}: Tổng ${m.total.toLocaleString('vi-VN')} VNĐ, Đã thu ${m.paid.toLocaleString('vi-VN')} VNĐ`).join('\n')}

3. HOÁ ĐƠN QUÁ HẠN: ${overdueInvoices.length} hoá đơn, Tổng nợ: ${totalDebt.toLocaleString('vi-VN')} VNĐ

4. HỢP ĐỒNG SẮP HẾT HẠN (90 NGÀY TỚI): ${expiringContracts.length} hợp đồng
`

    // Generate AI insights with structured prompt
    const prompt = `Bạn là chuyên gia quản lý nhà trọ. Phân tích dữ liệu sau và trả về JSON hợp lệ (không markdown code block):

${dataContext}

Trả về JSON với format sau (chỉ JSON, không có gì khác):
{
  "recommendations": [
    {
      "priority": "high|medium|low",
      "title": "Tiêu đề ngắn gọn",
      "description": "Mô tả chi tiết hành động cần làm",
      "actionType": "view_list|send_message|renew_contract|check_invoice",
      "targetCount": số lượng liên quan
    }
  ]
}

Chỉ trả về JSON, không có giải thích.`

    let aiRecommendations: StructuredInsight['recommendations'] = []

    try {
      const result = await geminiModel.generateContent(prompt)
      const text = result.response.text()

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        aiRecommendations = parsed.recommendations || []
      }
    } catch (e) {
      console.error('AI parsing error, using fallback recommendations')
    }

    // Fallback recommendations if AI fails
    if (aiRecommendations.length === 0) {
      aiRecommendations = [
        {
          id: 1,
          priority: 'high',
          title: 'Gia hạn hợp đồng sắp hết hạn',
          description: `${expiringContracts.length} hợp đồng sắp hết hạn trong 90 ngày tới. Liên hệ khách hàng để gia hạn ngay.`,
          actionType: 'renew_contract',
          targetCount: expiringContracts.length
        },
        {
          id: 2,
          priority: 'high',
          title: 'Thu hồi công nợ',
          description: `${overdueInvoices.length} hóa đơn quá hạn với tổng nợ ${totalDebt.toLocaleString('vi-VN')} VNĐ.`,
          actionType: 'send_message',
          targetCount: overdueInvoices.length
        },
        {
          id: 3,
          priority: 'medium',
          title: 'Cải thiện tỷ lệ lấp đầy',
          description: `Tỷ lệ lấp đầy hiện tại là ${occupancyRate.toFixed(1)}%. ${availableRooms} phòng đang trống.`,
          actionType: 'view_list',
          targetCount: availableRooms
        },
        {
          id: 4,
          priority: 'low',
          title: 'Theo dõi doanh thu',
          description: `Doanh thu tháng này ${revenueTrend === 'up' ? 'tăng' : revenueTrend === 'down' ? 'giảm' : 'ổn định'} ${Math.abs(revenueTrendPercent).toFixed(1)}% so với tháng trước.`,
          actionType: 'check_invoice',
          targetCount: 0
        }
      ]
    }

    // Add IDs to recommendations
    aiRecommendations = aiRecommendations.map((rec, idx) => ({ ...rec, id: idx + 1 }))

    // Return structured data
    const structuredData: StructuredInsight = {
      overview: {
        currentRevenue,
        previousRevenue,
        revenueTrend,
        revenueTrendPercent,
        last3MonthsRevenue,
        occupancyRate
      },
      warnings: {
        expiringContracts,
        overdueInvoices,
        totalDebt
      },
      recommendations: aiRecommendations
    }

    return NextResponse.json(structuredData)
  } catch (error: any) {
    console.error('[AI Insights] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Lỗi khi phân tích AI' },
      { status: 500 }
    )
  }
}
