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
    
    // Lấy doanh thu 12 tháng gần đây để phân tích xu hướng
    const revenueHistory = []
    for (let i = 11; i >= 0; i--) {
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
      
      revenueHistory.push({
        month,
        year,
        monthName: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        revenue: Number(revenue._sum.totalAmount || 0)
      })
    }

    // Tính toán xu hướng (trend) bằng Linear Regression đơn giản
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    const n = revenueHistory.length
    
    // Nếu không có dữ liệu lịch sử, tính dự đoán dựa trên hợp đồng hiện tại
    let slope = 0
    let intercept = 0
    
    if (n > 0) {
      revenueHistory.forEach((item, index) => {
        const x = index + 1
        const y = item.revenue
        sumX += x
        sumY += y
        sumXY += x * y
        sumX2 += x * x
      })
      
      const denominator = n * sumX2 - sumX * sumX
      if (denominator !== 0) {
        slope = (n * sumXY - sumX * sumY) / denominator
        intercept = (sumY - slope * sumX) / n
      } else {
        // Nếu không thể tính slope, dùng giá trị trung bình
        intercept = sumY / n
      }
    } else {
      // Nếu không có dữ liệu lịch sử, tính dựa trên hợp đồng hiện tại
      const activeContracts = await prisma.contract.findMany({
        where: { status: 'ACTIVE' },
        include: { room: true }
      })
      
      const estimatedMonthlyRevenue = activeContracts.reduce((sum, contract) => {
        return sum + Number(contract.rentPrice || 0)
      }, 0)
      
      // Thêm ước tính cho điện nước và dịch vụ (khoảng 30% giá thuê)
      const estimatedTotalRevenue = estimatedMonthlyRevenue * 1.3
      
      intercept = estimatedTotalRevenue
      // Giả định tăng trưởng 0% nếu không có dữ liệu
      slope = 0
    }
    
    // Dự đoán doanh thu 6 tháng tới
    const revenueForecast = []
    const avgRevenue = n > 0 
      ? revenueHistory.reduce((sum, item) => sum + item.revenue, 0) / n 
      : intercept
    
    // Tính độ biến động (volatility) dựa trên độ lệch chuẩn
    let stdDev = 0
    if (n > 1) {
      const variance = revenueHistory.reduce((sum, item) => {
        return sum + Math.pow(item.revenue - avgRevenue, 2)
      }, 0) / n
      stdDev = Math.sqrt(variance)
    } else {
      // Nếu không có dữ liệu, ước tính độ lệch chuẩn = 20% của trung bình
      stdDev = avgRevenue * 0.2
    }
    
    for (let i = 1; i <= 6; i++) {
      const date = new Date(currentYear, currentMonth - 1 + i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      
      // Dự đoán dựa trên xu hướng
      const predictedRevenue = n > 0 
        ? Math.max(0, slope * (n + i) + intercept)
        : intercept // Nếu không có lịch sử, dùng giá trị ước tính
      
      // Dự đoán với khoảng tin cậy ±30% (dựa trên độ biến động)
      const confidenceInterval = stdDev * 0.3
      
      // Xác định độ tin cậy
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
      if (n >= 6) {
        confidence = stdDev < avgRevenue * 0.2 ? 'HIGH' : stdDev < avgRevenue * 0.4 ? 'MEDIUM' : 'LOW'
      } else if (n > 0) {
        confidence = 'MEDIUM'
      } else {
        confidence = 'LOW' // Không có dữ liệu lịch sử
      }
      
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

    // Tính tổng doanh thu dự đoán 6 tháng tới
    const totalForecastRevenue = revenueForecast.reduce((sum, item) => sum + item.predictedRevenue, 0)
    const calculatedAvgMonthlyRevenue = n > 0 
      ? revenueHistory.reduce((sum, item) => sum + item.revenue, 0) / n 
      : avgRevenue
    const growthRate = calculatedAvgMonthlyRevenue > 0 && slope > 0 
      ? (slope / calculatedAvgMonthlyRevenue) * 100 
      : 0

    // ============================================
    // 2. DỰ ĐOÁN RỦI RO TRỐNG PHÒNG (Vacancy Risk)
    // ============================================
    
    // Lấy tất cả hợp đồng đang hoạt động
    const activeContracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      include: {
        room: true,
        user: {
          select: {
            fullName: true,
            phone: true
          }
        }
      }
    })

    // Phân tích rủi ro trống phòng
    const vacancyRisks = []
    const now = new Date()
    
    for (const contract of activeContracts) {
      if (!contract.endDate) continue
      
      const endDate = new Date(contract.endDate)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // Tính điểm rủi ro dựa trên:
      // 1. Thời gian còn lại của hợp đồng (càng gần hết hạn càng rủi ro)
      // 2. Lịch sử thanh toán (nếu có hóa đơn quá hạn thì rủi ro cao)
      // 3. Thời gian thuê (thuê lâu thì ít rủi ro hơn)
      
      const contractDuration = Math.ceil((endDate.getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24))
      const monthsRented = Math.floor(contractDuration / 30)
      
      // Kiểm tra hóa đơn quá hạn
      const overdueInvoices = await prisma.invoice.count({
        where: {
          contractId: contract.id,
          status: 'OVERDUE'
        }
      })
      
      // Tính điểm rủi ro (0-100)
      let riskScore = 0
      
      // Rủi ro do sắp hết hạn (0-50 điểm)
      if (daysUntilExpiry <= 30) {
        riskScore += 50 // Rất rủi ro
      } else if (daysUntilExpiry <= 60) {
        riskScore += 30 // Rủi ro trung bình
      } else if (daysUntilExpiry <= 90) {
        riskScore += 15 // Rủi ro thấp
      }
      
      // Rủi ro do thanh toán (0-30 điểm)
      if (overdueInvoices > 0) {
        riskScore += Math.min(30, overdueInvoices * 10)
      }
      
      // Giảm rủi ro nếu thuê lâu (0-20 điểm giảm)
      if (monthsRented >= 12) {
        riskScore = Math.max(0, riskScore - 20)
      } else if (monthsRented >= 6) {
        riskScore = Math.max(0, riskScore - 10)
      }
      
      // Xác định mức rủi ro
      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
      if (riskScore >= 50) {
        riskLevel = 'HIGH'
      } else if (riskScore >= 25) {
        riskLevel = 'MEDIUM'
      }
      
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
        avgMonthlyRevenue: calculatedAvgMonthlyRevenue,
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
