'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, AlertTriangle, Building2, DollarSign, Info, BarChart3, Sparkles, Loader2 } from 'lucide-react'
import Loading from '@/components/Loading'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

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
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

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
        <Loading size="lg" text="Đang tải dữ liệu dự đoán..." />
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

  return (
    <div className="space-y-6 pb-10">
      {/* Header - Unified with other pages */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">Dự đoán AI</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Phân tích doanh thu và dự báo rủi ro trống phòng</p>
        </div>
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="btn btn-outline-primary h-11 px-4 rounded-xl flex items-center justify-center gap-2"
        >
          <Info size={18} />
          <span className="font-bold">Phương pháp</span>
        </button>
      </div>

      {/* Methodology Modal - Simplified */}
      {showMethodology && (
        <div className="card border border-primary animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary">Phương pháp phân tích</h2>
            <button
              onClick={() => setShowMethodology(false)}
              className="p-2 hover:bg-tertiary rounded-full transition-colors text-tertiary hover:text-primary"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs">1</span>
                {data.methodology.revenueForecast.method}
              </h3>
              <p className="text-sm text-secondary">{data.methodology.revenueForecast.description}</p>
              <div className="flex flex-wrap gap-2">
                {data.methodology.revenueForecast.factors.map((factor, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 text-xs">2</span>
                {data.methodology.vacancyRisk.method}
              </h3>
              <p className="text-sm text-secondary">{data.methodology.vacancyRisk.description}</p>
              <div className="flex flex-wrap gap-2">
                {data.methodology.vacancyRisk.factors.map((factor, idx) => (
                  <span key={idx} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Forecast Summary Cards - Unified style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">Doanh thu tháng tới</p>
              <p className="text-xl sm:text-xl font-bold text-primary">
                {formatLargeCurrency(data.revenueForecast.forecast[0]?.predictedRevenue || 0)}
              </p>
              <p className="text-xs text-tertiary mt-1">Dự báo AI</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="text-white" size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {parseFloat(data.revenueForecast.growthRate) >= 0 ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${parseFloat(data.revenueForecast.growthRate) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(parseFloat(data.revenueForecast.growthRate))}% so với tháng trước
            </span>
          </div>
        </div>

        <div className="card stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">Doanh thu quý tới</p>
              <p className="text-xl sm:text-xl font-bold text-primary">
                {formatLargeCurrency(data.revenueForecast.summary.nextQuarter)}
              </p>
              <p className="text-xs text-tertiary mt-1">3 tháng tới</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white" size={20} />
            </div>
          </div>
        </div>

        <div className="card stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">Doanh thu 6 tháng</p>
              <p className="text-xl sm:text-xl font-bold text-primary">
                {formatLargeCurrency(data.revenueForecast.summary.nextHalfYear)}
              </p>
              <p className="text-xs text-tertiary mt-1">Nửa năm tới</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
          </div>
        </div>

        <div className="card stat-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">Trung bình/tháng</p>
              <p className="text-xl sm:text-xl font-bold text-primary">
                {formatLargeCurrency(data.revenueForecast.avgMonthlyRevenue)}
              </p>
              <p className="text-xs text-tertiary mt-1">12 tháng qua</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <DollarSign className="text-white" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Forecast Chart - Clean design */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={20} />
              Biểu đồ doanh thu
            </h2>
            <p className="text-xs sm:text-sm text-tertiary mt-1">Dữ liệu thực tế (12 tháng) và dự báo AI (6 tháng)</p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="w-full h-80 flex flex-col items-center justify-center text-tertiary space-y-2">
            <BarChart3 size={48} className="opacity-20" />
            <p className="font-medium">Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="h-[320px] sm:h-[420px]">
            <Chart
              type="bar"
              height="100%"
              options={{
                chart: {
                  id: 'revenue-forecast',
                  toolbar: { show: false },
                  zoom: { enabled: false },
                  fontFamily: 'inherit',
                  background: 'transparent',
                  animations: {
                    enabled: true,
                    speed: 900,
                    animateGradually: { enabled: true, delay: 100 },
                    dynamicAnimation: { enabled: true, speed: 400 }
                  }
                },
                colors: ['#8b5cf6', '#06b6d4'],
                plotOptions: {
                  bar: {
                    columnWidth: '55%',
                    borderRadius: 6,
                    borderRadiusApplication: 'end'
                  }
                },
                fill: {
                  type: ['gradient', 'gradient'],
                  gradient: {
                    shade: 'dark',
                    type: 'vertical',
                    shadeIntensity: 0.4,
                    opacityFrom: 0.95,
                    opacityTo: 0.6,
                    stops: [0, 100]
                  }
                },
                stroke: {
                  show: true,
                  width: [0, 3],
                  curve: 'smooth',
                  dashArray: [0, 6]
                },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: chartData.map(d => d.monthName),
                  axisBorder: { show: false },
                  axisTicks: { show: false },
                  labels: {
                    style: { colors: Array(chartData.length).fill('var(--text-tertiary)'), fontSize: '11px' },
                    rotate: -30,
                    rotateAlways: false
                  }
                },
                yaxis: {
                  labels: {
                    style: { colors: ['var(--text-tertiary)'], fontSize: '11px' },
                    formatter: (val: number) => formatLargeCurrency(val)
                  }
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                  theme: 'dark',
                  y: { formatter: (val: number) => val ? formatLargeCurrency(val) : '—' }
                },
                grid: {
                  borderColor: 'var(--border-primary)',
                  strokeDashArray: 4,
                  xaxis: { lines: { show: false } }
                },
                legend: {
                  show: false
                },
                annotations: {
                  xaxis: data.revenueForecast.history.length > 0 ? [{
                    x: chartData[data.revenueForecast.history.length - 1]?.monthName,
                    x2: chartData[data.revenueForecast.history.length]?.monthName,
                    fillColor: '#06b6d4',
                    opacity: 0.05,
                    label: {
                      text: '▶ Dự báo AI',
                      style: { color: '#06b6d4', background: 'transparent', fontSize: '11px', fontWeight: 700 },
                      position: 'top',
                      orientation: 'horizontal'
                    }
                  }] : []
                }
              }}
              series={[
                {
                  name: 'Doanh thu thực tế',
                  type: 'bar',
                  data: chartData.map(d => d.type === 'history' ? d.value : null)
                },
                {
                  name: 'Dự báo AI',
                  type: 'line',
                  data: (() => {
                    const arr: (number | null)[] = chartData.map(() => null)
                    const lastHistIdx = data.revenueForecast.history.length - 1
                    if (lastHistIdx >= 0) arr[lastHistIdx] = chartData[lastHistIdx].value
                    data.revenueForecast.forecast.forEach((_, i) => {
                      arr[data.revenueForecast.history.length + i] = chartData[data.revenueForecast.history.length + i].value
                    })
                    return arr
                  })()
                }
              ]}
            />
          </div>
        )}
        <div className="flex items-center gap-6 mt-2 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 bg-violet-500 rounded" style={{ opacity: 0.85 }}></div>
            <span className="text-xs text-secondary">Lịch sử thực tế</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-cyan-500 rounded border-t-2 border-dashed border-cyan-500"></div>
            <span className="text-xs text-secondary">Dự báo AI</span>
          </div>
        </div>
      </div>

      {/* Vacancy Risk Section - Advanced Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Summary with Radial Chart */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-4">
          <div className="card flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-primary">Phân tích rủi ro</h2>
                <p className="text-xs text-tertiary">Mức độ rủi ro dựa trên dữ liệu thanh toán và hợp đồng</p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500">
                <AlertTriangle size={20} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
              <div className="w-full sm:w-1/2 h-[240px]">
                <Chart
                  type="radialBar"
                  height="100%"
                  options={{
                    chart: {
                      id: 'risk-summary-radial',
                      fontFamily: 'inherit'
                    },
                    colors: ['#ef4444', '#f59e0b', '#10b981'],
                    plotOptions: {
                      radialBar: {
                        dataLabels: {
                          name: { fontSize: '14px', fontWeight: 600, show: true, offsetY: -5 },
                          value: { fontSize: '16px', fontWeight: 700, show: true, offsetY: 5, formatter: (val) => `${val} phòng` },
                          total: {
                            show: true,
                            label: 'TỔNG',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--text-tertiary)',
                            formatter: () => `${data.vacancyRisk.summary.totalAtRiskRevenue > 0 ? (data.vacancyRisk.summary.highRiskCount + data.vacancyRisk.summary.mediumRiskCount) : 0}`
                          }
                        },
                        track: { background: 'var(--border-primary)', strokeWidth: '95%' },
                        hollow: { size: '55%' }
                      }
                    },
                    labels: ['Rủi ro cao', 'Trung bình', 'An toàn'],
                    stroke: { lineCap: 'round' },
                    legend: { show: false }
                  }}
                  series={[
                    (data.vacancyRisk.summary.highRiskCount / (data.vacancyRisk.summary.totalRooms || 1)) * 100,
                    (data.vacancyRisk.summary.mediumRiskCount / (data.vacancyRisk.summary.totalRooms || 1)) * 100,
                    (data.vacancyRisk.summary.lowRiskCount / (data.vacancyRisk.summary.totalRooms || 1)) * 100
                  ]}
                />
              </div>

              <div className="w-full sm:w-1/2 space-y-3">
                <div className="p-3 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20 rounded-xl border-l-4 border-red-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Nguy cấp</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 rounded">
                      {data.vacancyRisk.summary.highRiskCount} phòng
                    </span>
                  </div>
                  <p className="text-base font-bold text-primary">{formatLargeCurrency(data.vacancyRisk.summary.highRiskRevenue)}</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-950/20 rounded-xl border-l-4 border-yellow-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Cảnh báo</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 rounded">
                      {data.vacancyRisk.summary.mediumRiskCount} phòng
                    </span>
                  </div>
                  <p className="text-base font-bold text-primary">{formatLargeCurrency(data.vacancyRisk.summary.mediumRiskRevenue)}</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 rounded-xl border-l-4 border-green-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Ổn định</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-600 rounded">
                      {data.vacancyRisk.summary.lowRiskCount} phòng
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-primary">
              <div className="flex items-center justify-between text-tertiary text-xs mb-2 italic">
                <span>Dự báo doanh thu bị ảnh hưởng</span>
                <span>{(data.vacancyRisk.summary.totalAtRiskRevenue / (data.revenueForecast.avgMonthlyRevenue || 1) * 100).toFixed(1)}% / tổng</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xl font-bold text-primary">
                  {formatLargeCurrency(data.vacancyRisk.summary.totalAtRiskRevenue)}
                </p>
                <div className="flex-1 h-3 bg-tertiary rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full animate-pulse-slow"
                    style={{ width: `${Math.min(100, (data.vacancyRisk.summary.totalAtRiskRevenue / (data.revenueForecast.avgMonthlyRevenue || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Details Table Enhanced */}
        <div className="lg:col-span-12 xl:col-span-7 card flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Hợp đồng rủi ro nhất</h2>
              <p className="text-xs text-tertiary">Danh sách phòng cần lưu ý xử lý gia hạn hoặc thu hồi</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-600 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span> High
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-bold text-yellow-600 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span> Mid
              </span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-primary bg-white dark:bg-[#1a1a1a]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-tertiary/50 text-tertiary text-[11px] font-bold uppercase tracking-wider border-b border-primary">
                  <th className="px-5 py-3.5">Phòng & Khách</th>
                  <th className="px-5 py-3.5">Hết hạn dự kiến</th>
                  <th className="px-5 py-3.5">Chỉ số rủi ro</th>
                  <th className="px-5 py-3.5 text-right">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary">
                {data.vacancyRisk.risks.slice(0, 8).map((risk) => (
                  <tr key={risk.contractId} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all duration-300">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${risk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'}`}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm">{risk.roomName}</p>
                          <p className="text-[11px] text-tertiary font-medium">{risk.tenantName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-primary">
                        {new Date(risk.endDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <p className={`text-[11px] font-bold mt-0.5 ${risk.daysUntilExpiry <= 15 ? 'text-red-500 animate-pulse' : risk.daysUntilExpiry <= 30 ? 'text-orange-500' : 'text-tertiary'}`}>
                        {risk.daysUntilExpiry <= 0 ? (
                          <span className="flex items-center gap-1"><AlertTriangle size={10}/> Quá hạn</span>
                        ) : `Còn ${risk.daysUntilExpiry} ngày`}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-tertiary">SCORE</span>
                          <span className="text-[10px] font-bold text-primary">{risk.riskScore}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-tertiary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${risk.riskLevel === 'HIGH' ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-600'}`}
                            style={{ width: `${risk.riskScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold tracking-tight uppercase border shadow-sm ${risk.riskLevel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                        risk.riskLevel === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                          'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        }`}>
                        {risk.riskLevel === 'HIGH' ? 'NGUY CƠ CAO' : risk.riskLevel === 'MEDIUM' ? 'TRUNG BÌNH' : 'AN TOÀN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View Enhanced */}
          <div className="md:hidden space-y-4">
            {data.vacancyRisk.risks.slice(0, 6).map((risk) => (
              <div key={risk.contractId} className="p-4 bg-white dark:bg-primary rounded-2xl border border-primary shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${risk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'}`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary text-sm">{risk.roomName}</h3>
                      <p className="text-xs text-tertiary font-medium">{risk.tenantName}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${risk.riskLevel === 'HIGH' ? 'bg-red-50 text-red-700 dark:bg-red-950/40' :
                    risk.riskLevel === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40' :
                      'bg-green-50 text-green-700 dark:bg-green-950/40'
                    }`}>
                    {risk.riskLevel === 'HIGH' ? 'Cao' : risk.riskLevel === 'MEDIUM' ? 'T.Bình' : 'An toàn'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-primary mb-3">
                  <div>
                    <p className="text-[10px] text-tertiary uppercase font-bold mb-1">Hết hạn</p>
                    <p className="text-xs font-bold text-primary">{new Date(risk.endDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-tertiary uppercase font-bold mb-1">Rủi ro</p>
                    <p className="text-xs font-bold text-primary">{risk.riskScore}%</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${risk.riskLevel === 'HIGH' ? 'bg-red-500' : 'bg-yellow-500'}`}
                    style={{ width: `${risk.riskScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {data.vacancyRisk.risks.length === 0 && (
            <div className="text-center py-16 bg-tertiary/20 rounded-2xl border-2 border-dashed border-primary">
              <AlertTriangle size={48} className="mx-auto text-tertiary/40 mb-4" />
              <p className="text-base font-bold text-tertiary">Tuyệt vời! Không có rủi ro nào được phát hiện</p>
              <p className="text-xs text-tertiary/60 mt-2">Dữ liệu vận hành phòng trọ của bạn đang rất ổn định</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Section - Premium AI Interface */}
      <div className="card relative overflow-hidden border border-indigo-500/20 group hover:border-indigo-500/40 transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 animate-pulse-slow">
              <Sparkles size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Cố vấn Chiến lược AI
              </h2>
              <p className="text-xs text-tertiary font-medium">Khám phá cơ hội và tối ưu hóa lợi nhuận</p>
            </div>
          </div>
          <button
            onClick={async () => {
              setAiLoading(true)
              setAiInsights(null)
              try {
                const res = await fetch('/api/admin/forecast/ai-insights', { method: 'POST' })
                const result = await res.json()
                if (!res.ok) throw new Error(result.error)
                setAiInsights(result.insights)
              } catch (err: any) {
                setAiInsights(`Lỗi: ${err.message}`)
              } finally {
                setAiLoading(false)
              }
            }}
            disabled={aiLoading}
            className="btn btn-primary h-12 px-6 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all active:scale-95"
          >
            {aiLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Đang tổng hợp dữ liệu...</>
            ) : (
              <><Sparkles size={18} /> Phân tích ngay</>
            )}
          </button>
        </div>

        {aiInsights ? (
          <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/30 text-base leading-relaxed text-primary relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-full"></div>
            <div className="space-y-4">
              {aiInsights
                .replace(/###\s+/g, '')
                .replace(/##\s+/g, '')
                .replace(/#\s+/g, '')
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/\*([^*]+)\*/g, '$1')
                .split('\n')
                .map((line, i) => {
                  const trimmed = line.trim()
                  if (!trimmed) return <div key={i} className="h-4" />
                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                      <div key={i} className="flex gap-3">
                        <span className="text-indigo-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-sm sm:text-base">{trimmed.slice(2)}</span>
                      </div>
                    )
                  }
                  return <p key={i} className="text-sm sm:text-base">{trimmed}</p>
                })}
            </div>
          </div>
        ) : !aiLoading ? (
          <div className="text-center py-20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-3xl bg-indigo-50/30 dark:bg-indigo-900/5 group/empty">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover/empty:scale-110 transition-transform duration-500">
              <Sparkles size={40} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">Trình phân tích thông minh sẵn sàng</h3>
            <p className="text-sm text-tertiary max-w-sm mx-auto leading-relaxed">
              Nhấn nút phía trên để bắt đầu phân tích sâu về xu hướng thị trường, dự báo dòng tiền và các rủi ro tiềm ẩn cho nhà trọ của bạn.
            </p>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 size={48} className="animate-spin text-indigo-500" />
                <Sparkles size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">AI đang suy nghĩ...</p>
                <p className="text-xs text-tertiary">Đang quét hàng nghìn điểm dữ liệu của bạn</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
