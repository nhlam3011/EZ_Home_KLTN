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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tính toán dự đoán...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không thể tải dữ liệu dự đoán</p>
      </div>
    )
  }

  // Combine history and forecast for chart
  const chartData = [
    ...data.revenueForecast.history.map(item => ({ ...item, type: 'history' as const })),
    ...data.revenueForecast.forecast.map(item => ({ ...item, type: 'forecast' as const }))
  ]

  const maxRevenue = Math.max(...chartData.map(d => d.revenue || d.predictedRevenue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dự đoán AI</h1>
          <p className="text-gray-600 mt-1">Dự đoán doanh thu và rủi ro trống phòng</p>
        </div>
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
          <Info size={18} />
          <span>Phương pháp tính toán</span>
        </button>
      </div>

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Phương pháp tính toán</h2>
            <button
              onClick={() => setShowMethodology(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                {data.methodology.revenueForecast.method}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{data.methodology.revenueForecast.description}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {data.methodology.revenueForecast.factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" />
                {data.methodology.vacancyRisk.method}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{data.methodology.vacancyRisk.description}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={24} />
            </div>
            {parseFloat(data.revenueForecast.growthRate) >= 0 ? (
              <TrendingUp className="text-green-600" size={20} />
            ) : (
              <TrendingDown className="text-red-600" size={20} />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Doanh thu tháng tới</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatLargeCurrency(data.revenueForecast.forecast[0]?.predictedRevenue || 0)}
            </p>
            <p className="text-xs text-gray-500">
              Tăng trưởng: {data.revenueForecast.growthRate}%
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <BarChart3 className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Doanh thu quý tới</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatLargeCurrency(data.revenueForecast.summary.nextQuarter)}
            </p>
            <p className="text-xs text-gray-500">
              3 tháng tiếp theo
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Doanh thu 6 tháng</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatLargeCurrency(data.revenueForecast.summary.nextHalfYear)}
            </p>
            <p className="text-xs text-gray-500">
              Nửa năm tới
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Trung bình/tháng</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatLargeCurrency(data.revenueForecast.avgMonthlyRevenue)}
            </p>
            <p className="text-xs text-gray-500">
              Dựa trên 12 tháng
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Forecast Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Dự đoán doanh thu</h2>
          <p className="text-sm text-gray-500">Lịch sử 12 tháng và dự đoán 6 tháng tới</p>
        </div>
        <div className="h-80 flex items-end justify-between gap-2">
          {chartData.map((item, index) => {
            const isForecast = item.type === 'forecast'
            const height = ((item.revenue || item.predictedRevenue) / maxRevenue) * 100
            const forecastItem = isForecast ? item as any : null
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex flex-col items-center justify-end h-64 relative">
                  {/* Confidence interval for forecast */}
                  {isForecast && forecastItem && (
                    <div
                      className="absolute w-full bg-blue-200 opacity-20 rounded-t"
                      style={{
                        height: `${((forecastItem.maxRevenue - forecastItem.minRevenue) / maxRevenue) * 100}%`,
                        bottom: `${(forecastItem.minRevenue / maxRevenue) * 100}%`
                      }}
                    ></div>
                  )}
                  <div
                    className={`w-full rounded-t transition-all cursor-pointer relative ${
                      isForecast
                        ? 'bg-gradient-to-t from-blue-500 to-blue-400 border-2 border-blue-300 border-b-0'
                        : 'bg-gradient-to-t from-gray-500 to-gray-400'
                    }`}
                    style={{ height: `${Math.max(height, 3)}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {isForecast
                        ? `${formatLargeCurrency(forecastItem.predictedRevenue)} (Dự đoán)`
                        : formatLargeCurrency(item.revenue || 0)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 font-medium text-center">
                  {item.monthName}
                </div>
                {isForecast && (
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded ${
                    forecastItem.confidence === 'HIGH' ? 'bg-green-100 text-green-700' :
                    forecastItem.confidence === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {forecastItem.confidence === 'HIGH' ? 'Cao' :
                     forecastItem.confidence === 'MEDIUM' ? 'TB' : 'Thấp'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-sm text-gray-600">Lịch sử</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-300"></div>
            <span className="text-sm text-gray-600">Dự đoán</span>
          </div>
        </div>
      </div>

      {/* Vacancy Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Rủi ro trống phòng</h2>
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Rủi ro cao</p>
                <p className="text-xs text-gray-500">{data.vacancyRisk.summary.highRiskCount} phòng</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{data.vacancyRisk.summary.highRiskCount}</p>
                <p className="text-xs text-gray-500">{formatLargeCurrency(data.vacancyRisk.summary.highRiskRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Rủi ro trung bình</p>
                <p className="text-xs text-gray-500">{data.vacancyRisk.summary.mediumRiskCount} phòng</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-600">{data.vacancyRisk.summary.mediumRiskCount}</p>
                <p className="text-xs text-gray-500">{formatLargeCurrency(data.vacancyRisk.summary.mediumRiskRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Rủi ro thấp</p>
                <p className="text-xs text-gray-500">{data.vacancyRisk.summary.lowRiskCount} phòng</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{data.vacancyRisk.summary.lowRiskCount}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Tổng doanh thu có rủi ro</p>
                <p className="text-lg font-bold text-red-600">
                  {formatLargeCurrency(data.vacancyRisk.summary.totalAtRiskRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Details Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết rủi ro</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phòng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Khách thuê</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hết hạn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Điểm rủi ro</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.vacancyRisk.risks.slice(0, 10).map((risk) => (
                  <tr key={risk.contractId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{risk.roomName}</p>
                        <p className="text-xs text-gray-500">Tầng {risk.roomFloor}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{risk.tenantName}</p>
                        <p className="text-xs text-gray-500">{risk.tenantPhone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          {new Date(risk.endDate).toLocaleDateString('vi-VN')}
                        </p>
                        <p className={`text-xs ${
                          risk.daysUntilExpiry <= 30 ? 'text-red-600 font-semibold' :
                          risk.daysUntilExpiry <= 60 ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                          Còn {risk.daysUntilExpiry} ngày
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              risk.riskLevel === 'HIGH' ? 'bg-red-500' :
                              risk.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${risk.riskScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{risk.riskScore}</span>
                      </div>
                      {risk.overdueInvoices > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {risk.overdueInvoices} hóa đơn quá hạn
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        risk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                        risk.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
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
              <div className="text-center py-8 text-gray-500">
                Không có rủi ro trống phòng
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
