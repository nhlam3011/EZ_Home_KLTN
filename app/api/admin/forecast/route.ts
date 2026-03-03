import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // ============================================
    // 1. DỰ ĐOÁN DOANH THU (Revenue Forecast)
    // ============================================

    // Preparation for parallel history
    const historyMonths = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1)
      historyMonths.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        monthName: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
      })
    }

    // Parallel fetch revenue history and active contracts
    const [historyResults, activeContracts] = await Promise.all([
      Promise.all(historyMonths.map(h => prisma.invoice.aggregate({
        where: { status: 'PAID', month: h.month, year: h.year },
        _sum: { totalAmount: true }
      }))),
      prisma.contract.findMany({
        where: { status: 'ACTIVE' },
        include: {
          room: true,
          user: { select: { fullName: true, phone: true } }
        }
      })
    ])

    const revenueHistory = historyMonths.map((h, i) => ({
      ...h,
      revenue: Number(historyResults[i]._sum.totalAmount || 0)
    }))

    // Calculate Trend using Linear Regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    const n = revenueHistory.length
    let slope = 0, intercept = 0

    if (n > 0) {
      revenueHistory.forEach((item, index) => {
        const x = index + 1
        const y = item.revenue
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x
      })

      const denominator = n * sumX2 - sumX * sumX
      if (denominator !== 0) {
        slope = (n * sumXY - sumX * sumY) / denominator
        intercept = (sumY - slope * sumX) / n
      } else {
        intercept = sumY / n
      }
    } else {
      const estimatedMonthlyRevenue = activeContracts.reduce((sum, c) => sum + Number(c.rentPrice || 0), 0)
      intercept = estimatedMonthlyRevenue * 1.3
      slope = 0
    }

    // Revenue Forecast (next 6 months)
    const revenueForecast = []
    const avgRevenue = n > 0 ? sumY / n : intercept
    let stdDev = n > 1 ? Math.sqrt(revenueHistory.reduce((sum, item) => sum + Math.pow(item.revenue - avgRevenue, 2), 0) / n) : avgRevenue * 0.2

    for (let i = 1; i <= 6; i++) {
      const date = new Date(currentYear, currentMonth - 1 + i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      const predictedRevenue = n > 0 ? Math.max(0, slope * (n + i) + intercept) : intercept
      const confidenceInterval = stdDev * 0.3

      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = n >= 6 ? (stdDev < avgRevenue * 0.2 ? 'HIGH' : stdDev < avgRevenue * 0.4 ? 'MEDIUM' : 'LOW') : n > 0 ? 'MEDIUM' : 'LOW'

      revenueForecast.push({
        month,
        year,
        monthName: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        predictedRevenue: Math.max(0, predictedRevenue),
        minRevenue: Math.max(0, predictedRevenue - confidenceInterval),
        maxRevenue: predictedRevenue + confidenceInterval,
        confidence
      })
    }

    // Final summary calculations
    const totalForecastRevenue = revenueForecast.reduce((sum, item) => sum + item.predictedRevenue, 0)
    const growthRate = avgRevenue > 0 && slope > 0 ? (slope / avgRevenue) * 100 : 0

    // ============================================
    // 2. DỰ ĐOÁN RỦI RO TRỐNG PHÒNG (Vacancy Risk)
    // ============================================

    // Resolve N+1: Fetch all overdue counts for active contracts in one go
    const overdueCounts = await prisma.invoice.groupBy({
      by: ['contractId'],
      where: {
        contractId: { in: activeContracts.map(c => c.id) },
        status: 'OVERDUE'
      },
      _count: { id: true }
    })
    const overdueMap = new Map(overdueCounts.map(o => [o.contractId, o._count.id]))

    const vacancyRisks = []
    const now = new Date()

    for (const contract of activeContracts) {
      if (!contract.endDate) continue

      const endDate = new Date(contract.endDate)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const monthsRented = Math.floor(Math.ceil((endDate.getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24)) / 30)
      const overdueInvoices = overdueMap.get(contract.id) || 0

      let riskScore = 0
      if (daysUntilExpiry <= 30) riskScore += 50
      else if (daysUntilExpiry <= 60) riskScore += 30
      else if (daysUntilExpiry <= 90) riskScore += 15

      if (overdueInvoices > 0) riskScore += Math.min(30, overdueInvoices * 10)
      if (monthsRented >= 12) riskScore = Math.max(0, riskScore - 20)
      else if (monthsRented >= 6) riskScore = Math.max(0, riskScore - 10)

      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW'

      if (riskScore > 0 || daysUntilExpiry <= 90) {
        vacancyRisks.push({
          contractId: contract.id,
          roomName: contract.room.name,
          roomFloor: contract.room.floor,
          tenantName: contract.user.fullName,
          tenantPhone: contract.user.phone,
          endDate: contract.endDate,
          daysUntilExpiry,
          monthsRented,
          overdueInvoices,
          riskScore,
          riskLevel,
          monthlyRent: Number(contract.rentPrice)
        })
      }
    }

    // Sắp xếp theo mức rủi ro
    vacancyRisks.sort((a, b) => b.riskScore - a.riskScore)

    // Tính tổng rủi ro doanh thu (nếu các phòng rủi ro cao trống)
    const highRiskRevenue = vacancyRisks
      .filter(r => r.riskLevel === 'HIGH')
      .reduce((sum, r) => sum + r.monthlyRent, 0)

    const mediumRiskRevenue = vacancyRisks
      .filter(r => r.riskLevel === 'MEDIUM')
      .reduce((sum, r) => sum + r.monthlyRent, 0)

    // Thống kê tổng quan
    const totalRooms = await prisma.room.count()
    const rentedRooms = activeContracts.length
    const highRiskCount = vacancyRisks.filter(r => r.riskLevel === 'HIGH').length
    const mediumRiskCount = vacancyRisks.filter(r => r.riskLevel === 'MEDIUM').length

    return NextResponse.json({
      // Revenue Forecast
      revenueForecast: {
        history: revenueHistory,
        forecast: revenueForecast,
        totalForecastRevenue,
        avgMonthlyRevenue: avgRevenue,
        growthRate: growthRate.toFixed(2),
        summary: {
          nextMonth: revenueForecast[0],
          nextQuarter: revenueForecast.slice(0, 3).reduce((sum, item) => sum + item.predictedRevenue, 0),
          nextHalfYear: totalForecastRevenue
        }
      },

      // Vacancy Risk
      vacancyRisk: {
        risks: vacancyRisks,
        summary: {
          totalRooms,
          rentedRooms,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount: vacancyRisks.filter(r => r.riskLevel === 'LOW').length,
          highRiskRevenue,
          mediumRiskRevenue,
          totalAtRiskRevenue: highRiskRevenue + mediumRiskRevenue
        }
      },

      // Methodology
      methodology: {
        revenueForecast: {
          method: 'Linear Regression (Xu hướng tuyến tính)',
          description: 'Phân tích doanh thu 12 tháng gần đây để tính xu hướng, sau đó dự đoán 6 tháng tới dựa trên đường xu hướng',
          factors: [
            'Lịch sử thanh toán 12 tháng',
            'Xu hướng tăng/giảm doanh thu',
            'Độ biến động (volatility)',
            'Khoảng tin cậy ±30% độ lệch chuẩn'
          ]
        },
        vacancyRisk: {
          method: 'Risk Scoring (Điểm rủi ro)',
          description: 'Tính điểm rủi ro dựa trên nhiều yếu tố để xác định khả năng phòng sẽ trống',
          factors: [
            'Thời gian còn lại của hợp đồng (0-50 điểm)',
            'Lịch sử thanh toán quá hạn (0-30 điểm)',
            'Thời gian thuê (giảm 0-20 điểm nếu thuê lâu)',
            'Tổng điểm: 0-100 (HIGH: ≥50, MEDIUM: 25-49, LOW: <25)'
          ]
        }
      }
    })
  } catch (error) {
    console.error('Error calculating forecast:', error)
    return NextResponse.json(
      { error: 'Failed to calculate forecast' },
      { status: 500 }
    )
  }
}
