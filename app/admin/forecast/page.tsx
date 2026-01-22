'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Building2, DollarSign, Info, BarChart3 } from 'lucide-react'

interface ForecastData {
  revenueForecast: {
    history: Array<{
      month: number
      year: number
      monthName: string
      revenue: number
    }>
    forecast: Array<{
      month: number
      year: number
      monthName: string
      predictedRevenue: number
      minRevenue: number
      maxRevenue: number
      confidence: string
    }>
    totalForecastRevenue: number
    avgMonthlyRevenue: number
    growthRate: string
    summary: {
      nextMonth: any
      nextQuarter: number
      nextHalfYear: number
    }
  }
  vacancyRisk: {
    risks: Array<{
      contractId: number
      roomName: string
      roomFloor: number
      tenantName: string
      tenantPhone: string
      endDate: string
      daysUntilExpiry: number
      monthsRented: number
      overdueInvoices: number
      riskScore: number
      riskLevel: string
      monthlyRent: number
    }>
    summary: {
      totalRooms: number
      rentedRooms: number
      highRiskCount: number
      mediumRiskCount: number
      lowRiskCount: number
      highRiskRevenue: number
      mediumRiskRevenue: number
      totalAtRiskRevenue: number
    }
  }
  methodology: {
    revenueForecast: {
      method: string
      description: string
      factors: string[]
    }
    vacancyRisk: {
      method: string
      description: string
      factors: string[]
    }
  }
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMethodology, setShowMethodology] = useState(false)

  useEffect(() => {
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/admin/forecast')
      const forecastData = await response.json()
      setData(forecastData)
    } catch (error) {
      console.error('Error fetching forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatLargeCurrency = (amount: number) => {
    if (!amount) return '0 triệu VNĐ'
    const billions = amount / 1000000000
    if (billions >= 1) {
      return `${billions.toFixed(1)} tỷ VNĐ`
    }
    const millions = amount / 1000000
    return `${millions.toFixed(0)} triệu VNĐ`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-tertiary">Đang tính toán dự đoán...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-tertiary">Không thể tải dữ liệu dự đoán</p>
      </div>
    )
  }

  // Combine history and forecast for chart
  const chartData = [
    ...data.revenueForecast.history.map(item => ({ ...item, type: 'history' as const, value: item.revenue || 0 })),
    ...data.revenueForecast.forecast.map(item => ({ ...item, type: 'forecast' as const, value: item.predictedRevenue || 0 }))
  ]

  // Tính maxRevenue với fallback tốt hơn
  const allValues = chartData.map(d => d.value).filter(v => v > 0)
  const maxRevenue = allValues.length > 0 ? Math.max(...allValues) : 1000000 // Fallback 1 triệu nếu không có dữ liệu

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dự đoán AI</h1>
          <p className="text-secondary mt-1">Dự đoán doanh thu và rủi ro trống phòng</p>
        </div>
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="px-4 py-2 border border-primary rounded-lg hover:bg-tertiary flex items-center gap-2 transition-colors text-primary"
        >
          <Info size={18} />
          <span>Phương pháp tính toán</span>
        </button>
      </div>

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Phương pháp tính toán</h2>
            <button
              onClick={() => setShowMethodology(false)}
              className="text-tertiary hover:text-primary transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-500 dark:text-blue-400" />
                {data.methodology.revenueForecast.method}
              </h3>
              <p className="text-sm text-secondary mb-3">{data.methodology.revenueForecast.description}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-secondary">
                {data.methodology.revenueForecast.factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500 dark:text-red-400" />
                {data.methodology.vacancyRisk.method}
              </h3>
              <p className="text-sm text-secondary mb-3">{data.methodology.vacancyRisk.description}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-secondary">
                {data.methodology.vacancyRisk.factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={24} />
            </div>
            {parseFloat(data.revenueForecast.growthRate) >= 0 ? (
              <TrendingUp className="text-green-500 dark:text-green-400" size={20} />
            ) : (
              <TrendingDown className="text-red-500 dark:text-red-400" size={20} />
            )}
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">Doanh thu tháng tới</p>
            <p className="text-2xl font-bold text-primary mb-1">
              {formatLargeCurrency(data.revenueForecast.forecast[0]?.predictedRevenue || 0)}
            </p>
            <p className="text-xs text-secondary font-medium">
              Tăng trưởng: {data.revenueForecast.growthRate}%
            </p>
          </div>
        </div>

        <div className="card stat-card-green">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <BarChart3 className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">Doanh thu quý tới</p>
            <p className="text-2xl font-bold text-primary mb-1">
              {formatLargeCurrency(data.revenueForecast.summary.nextQuarter)}
            </p>
            <p className="text-xs text-secondary font-medium">
              3 tháng tiếp theo
            </p>
          </div>
        </div>

        <div className="card stat-card-purple">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">Doanh thu 6 tháng</p>
            <p className="text-2xl font-bold text-primary mb-1">
              {formatLargeCurrency(data.revenueForecast.summary.nextHalfYear)}
            </p>
            <p className="text-xs text-secondary font-medium">
              Nửa năm tới
            </p>
          </div>
        </div>

        <div className="card stat-card-orange">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">Trung bình/tháng</p>
            <p className="text-2xl font-bold text-primary mb-1">
              {formatLargeCurrency(data.revenueForecast.avgMonthlyRevenue)}
            </p>
            <p className="text-xs text-secondary font-medium">
              Dựa trên 12 tháng
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Forecast Chart */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary mb-2">Dự đoán doanh thu</h2>
          <p className="text-sm text-secondary">Lịch sử 12 tháng và dự đoán 6 tháng tới</p>
        </div>
        <div className="h-80 flex items-end justify-between gap-2">
          {chartData.length === 0 ? (
            <div className="w-full h-64 flex items-center justify-center text-tertiary">
              <p>Chưa có dữ liệu để hiển thị</p>
            </div>
          ) : (
            chartData.map((item, index) => {
              const isForecast = item.type === 'forecast'
              const value = item.value || 0
              const height = maxRevenue > 0 ? (value / maxRevenue) * 100 : 0
              const forecastItem = isForecast ? item as any : null
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col items-center justify-end h-64 relative">
                    {/* Confidence interval for forecast */}
                    {isForecast && forecastItem && forecastItem.maxRevenue && forecastItem.minRevenue && (
                      <div
                        className="absolute w-full bg-blue-200 dark:bg-blue-800 opacity-20 rounded-t"
                        style={{
                          height: `${Math.max(((forecastItem.maxRevenue - forecastItem.minRevenue) / maxRevenue) * 100, 2)}%`,
                          bottom: `${Math.max((forecastItem.minRevenue / maxRevenue) * 100, 0)}%`
                        }}
                      ></div>
                    )}
                    <div
                      className={`w-full rounded-t transition-all cursor-pointer relative ${
                        isForecast
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500 border-2 border-blue-300 dark:border-blue-400 border-b-0'
                          : 'bg-gradient-to-t from-gray-500 to-gray-400 dark:from-gray-600 dark:to-gray-500'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%`, minHeight: value > 0 ? '4px' : '0' }}
                    >
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {isForecast
                          ? `${formatLargeCurrency(forecastItem?.predictedRevenue || 0)} (Dự đoán)`
                          : formatLargeCurrency(item.revenue || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-secondary font-medium text-center min-h-[2rem]">
                    {item.monthName}
                  </div>
                  {isForecast && forecastItem && (
                    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded mt-1 ${
                      forecastItem.confidence === 'HIGH' ? 'bg-success-soft border border-success-subtle text-fg-success-strong' :
                      forecastItem.confidence === 'MEDIUM' ? 'bg-warning-soft border border-warning-subtle text-warning' :
                      'bg-danger-soft border border-danger-subtle text-fg-danger-strong'
                    }`}>
                      {forecastItem.confidence === 'HIGH' ? 'Cao' :
                       forecastItem.confidence === 'MEDIUM' ? 'TB' : 'Thấp'}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
        <div className="flex items-center gap-4 mt-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 dark:bg-gray-400 rounded"></div>
            <span className="text-sm text-secondary">Lịch sử</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded border-2 border-blue-300 dark:border-blue-400"></div>
            <span className="text-sm text-secondary">Dự đoán</span>
          </div>
        </div>
      </div>

      {/* Vacancy Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Rủi ro trống phòng</h2>
            <AlertTriangle className="text-red-500 dark:text-red-400" size={24} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
              <div>
                <p className="text-sm font-medium text-primary">Rủi ro cao</p>
                <p className="text-xs text-tertiary">{data.vacancyRisk.summary.highRiskCount} phòng</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{data.vacancyRisk.summary.highRiskCount}</p>
                <p className="text-xs text-tertiary">{formatLargeCurrency(data.vacancyRisk.summary.highRiskRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div>
                <p className="text-sm font-medium text-primary">Rủi ro trung bình</p>
                <p className="text-xs text-tertiary">{data.vacancyRisk.summary.mediumRiskCount} phòng</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{data.vacancyRisk.summary.mediumRiskCount}</p>
                <p className="text-xs text-tertiary">{formatLargeCurrency(data.vacancyRisk.summary.mediumRiskRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800">
              <div>
                <p className="text-sm font-medium text-primary">Rủi ro thấp</p>
                <p className="text-xs text-tertiary">{data.vacancyRisk.summary.lowRiskCount} phòng</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{data.vacancyRisk.summary.lowRiskCount}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-primary">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">Tổng doanh thu có rủi ro</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatLargeCurrency(data.vacancyRisk.summary.totalAtRiskRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Details Table */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-primary mb-4">Chi tiết rủi ro</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-tertiary border-b border-primary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Phòng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Khách thuê</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Hết hạn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Điểm rủi ro</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary">
                {data.vacancyRisk.risks.slice(0, 10).map((risk) => (
                  <tr key={risk.contractId} className="hover:bg-tertiary transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-primary">{risk.roomName}</p>
                        <p className="text-xs text-tertiary">Tầng {risk.roomFloor}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-primary">{risk.tenantName}</p>
                        <p className="text-xs text-tertiary">{risk.tenantPhone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-primary">
                          {new Date(risk.endDate).toLocaleDateString('vi-VN')}
                        </p>
                        <p className={`text-xs ${
                          risk.daysUntilExpiry <= 30 ? 'text-red-600 dark:text-red-400 font-semibold' :
                          risk.daysUntilExpiry <= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-tertiary'
                        }`}>
                          Còn {risk.daysUntilExpiry} ngày
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-tertiary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              risk.riskLevel === 'HIGH' ? 'bg-red-500 dark:bg-red-400' :
                              risk.riskLevel === 'MEDIUM' ? 'bg-yellow-600 dark:bg-yellow-400' : 'bg-green-500 dark:bg-green-400'
                            }`}
                            style={{ width: `${risk.riskScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-primary">{risk.riskScore}</span>
                      </div>
                      {risk.overdueInvoices > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {risk.overdueInvoices} hóa đơn quá hạn
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${
                        risk.riskLevel === 'HIGH' ? 'bg-danger-soft border border-danger-subtle text-fg-danger-strong' :
                        risk.riskLevel === 'MEDIUM' ? 'bg-warning-soft border border-warning-subtle text-warning' :
                        'bg-success-soft border border-success-subtle text-fg-success-strong'
                      }`}>
                        {risk.riskLevel === 'HIGH' ? 'CAO' :
                         risk.riskLevel === 'MEDIUM' ? 'TRUNG BÌNH' : 'THẤP'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.vacancyRisk.risks.length === 0 && (
              <div className="text-center py-8 text-tertiary">
                Không có rủi ro trống phòng
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
