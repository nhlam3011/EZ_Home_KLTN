'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, AlertTriangle, Building2, DollarSign, Info, BarChart3, Sparkles, Loader2, Search, Send, RefreshCw, ArrowRight } from 'lucide-react'
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

// Structured AI Insights Types
interface AiInsightsData {
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

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMethodology, setShowMethodology] = useState(false)
  const [aiInsights, setAiInsights] = useState<AiInsightsData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [expandedRecs, setExpandedRecs] = useState<Set<number>>(new Set())

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
    <div className="space-y-4 sm:space-y-6 pb-10">
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

      {/* Revenue Forecast Summary Cards - Refined alignment & fonts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card stat-card-blue flex flex-col justify-between h-full min-h-[120px]">
          <div className="flex items-center justify-between mb-3 w-full">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] sm:text-[11px] text-secondary mb-1 font-medium uppercase tracking-wider">Doanh thu tháng tới</p>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  {formatLargeCurrency(data.revenueForecast.forecast[0]?.predictedRevenue || 0)}
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${parseFloat(data.revenueForecast.growthRate) >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/40' : 'bg-red-100 text-red-600 dark:bg-red-900/40'}`}>
                    {parseFloat(data.revenueForecast.growthRate) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(parseFloat(data.revenueForecast.growthRate))}%
                  </div>
                  <span className="text-[10px] text-tertiary font-medium">so với tháng trước</span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <DollarSign className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-auto border-t border-[var(--border-primary)] pt-2">
            <p className="text-[9px] font-bold text-tertiary uppercase flex items-center gap-1 tracking-tight">
              <Sparkles size={10} /> Dự báo AI
            </p>
          </div>
        </div>

        <div className="card stat-card-green flex flex-col justify-between h-full min-h-[120px]">
          <div className="flex items-center justify-between mb-3 w-full">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] sm:text-[11px] text-secondary mb-1 font-medium uppercase tracking-wider">Doanh thu quý tới</p>
              <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis block leading-tight">
                {formatLargeCurrency(data.revenueForecast.summary.nextQuarter)}
              </span>
              <p className="text-[10px] text-tertiary mt-2 font-medium">Dự kiến trong 3 tháng tới</p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-green-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <BarChart3 className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-auto border-t border-[var(--border-primary)] pt-2">
            <p className="text-[9px] font-bold text-tertiary uppercase tracking-tight">Thống kê kỳ hạn</p>
          </div>
        </div>

        <div className="card stat-card-purple flex flex-col justify-between h-full min-h-[120px]">
          <div className="flex items-center justify-between mb-3 w-full">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] sm:text-[11px] text-secondary mb-1 font-medium uppercase tracking-wider">Doanh thu 6 tháng</p>
              <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis block leading-tight">
                {formatLargeCurrency(data.revenueForecast.summary.nextHalfYear)}
              </span>
              <p className="text-[10px] text-tertiary mt-2 font-medium">Dự kiến trong nửa năm tới</p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <TrendingUp className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-auto border-t border-[var(--border-primary)] pt-2">
            <p className="text-[9px] font-bold text-tertiary uppercase tracking-tight">Tăng trưởng dài hạn</p>
          </div>
        </div>

        <div className="card stat-card-orange flex flex-col justify-between h-full min-h-[120px]">
          <div className="flex items-center justify-between mb-3 w-full">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] sm:text-[11px] text-secondary mb-1 font-medium uppercase tracking-wider">Trung bình/tháng</p>
              <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis block leading-tight">
                {formatLargeCurrency(data.revenueForecast.avgMonthlyRevenue)}
              </span>
              <p className="text-[10px] text-tertiary mt-2 font-medium">Dựa trên dữ liệu 12 tháng qua</p>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <DollarSign className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-auto border-t border-[var(--border-primary)] pt-2">
            <p className="text-[9px] font-bold text-tertiary uppercase tracking-tight">Hiệu suất trung bình</p>
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
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[560px] sm:min-w-0 h-[340px] sm:h-[420px]">
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
                  colors: ['#3b64f6', '#10b981'],
                  plotOptions: {
                    bar: {
                      columnWidth: '65%',
                      borderRadius: 4,
                      borderRadiusApplication: 'end'
                    }
                  },
                  responsive: [
                    {
                      breakpoint: 640,
                      options: {
                        plotOptions: {
                          bar: {
                            columnWidth: '65%'
                          }
                        }
                      }
                    }
                  ],
                  fill: {
                    type: ['gradient', 'gradient'],
                    gradient: {
                      shade: 'light',
                      type: 'vertical',
                      shadeIntensity: 0.1,
                      opacityFrom: 1,
                      opacityTo: 0.7,
                      stops: [0, 100]
                    }
                  },
                  stroke: {
                    show: true,
                    width: [0, 2],
                    curve: 'smooth',
                    dashArray: [0, 4]
                  },
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: chartData.map(d => d.monthName.replace(/thg\s?/i, '')),
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                    labels: {
                      style: { colors: Array(chartData.length).fill('var(--text-tertiary)'), fontSize: '10px' },
                      rotate: 0,
                      rotateAlways: false
                    }
                  },
                  yaxis: {
                    labels: {
                      style: { colors: ['var(--text-tertiary)'], fontSize: '10px' },
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
                      x: chartData[data.revenueForecast.history.length - 1]?.monthName.replace(/thg\s?/i, ''),
                      x2: chartData[data.revenueForecast.history.length]?.monthName.replace(/thg\s?/i, ''),
                      fillColor: '#10b981',
                      opacity: 0.05,
                      label: {
                        text: '▶ Dự báo AI',
                        style: { color: '#10b981', background: 'transparent', fontSize: '10px', fontWeight: 600 },
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
          </div>
        )}
        <div className="flex items-center gap-4 sm:gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm shadow-sm" style={{ opacity: 0.8 }}></div>
            <span className="text-[11px] font-bold text-secondary tracking-tight uppercase">Thực tế</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500 rounded border-t-2 border-dashed border-green-500"></div>
            <span className="text-[11px] font-bold text-secondary tracking-tight uppercase">Dự báo AI</span>
          </div>
        </div>
      </div>

      {/* Vacancy Risk Section - Advanced Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
          <div className="card flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-primary">Phân tích rủi ro</h2>
                <p className="text-sm text-tertiary">Dự báo theo dòng tiền và hợp đồng</p>
              </div>
              <div className="w-11 h-11 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-200/50 dark:border-red-800/30">
                <AlertTriangle size={20} />
              </div>
            </div>

            <div className="flex flex-col gap-6 p-4 bg-tertiary/10 rounded-3xl border border-primary mb-6">
              <div className="w-full flex justify-center items-center py-4">
                <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
                  <Chart
                    type="donut"
                    height="100%"
                    options={{
                      chart: { id: 'risk-summary-donut', fontFamily: 'inherit' },
                      colors: ['#ef4444', '#f59e0b', '#10b981'],
                      stroke: { show: false },
                      dataLabels: { enabled: false },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '75%',
                            labels: {
                              show: true,
                              name: { show: true, fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', offsetY: -4 },
                              value: { show: true, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', offsetY: 8, formatter: (val) => `${val}` },
                              total: {
                                show: true,
                                label: 'TỔNG PHÒNG',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: 'var(--text-tertiary)',
                                formatter: () => `${data.vacancyRisk.summary.totalRooms}`
                              }
                            }
                          }
                        }
                      },
                      labels: ['Nguy cấp', 'Cảnh báo', 'Ổn định'],
                      legend: { show: false }
                    }}
                    series={[
                      data.vacancyRisk.summary.highRiskCount,
                      data.vacancyRisk.summary.mediumRiskCount,
                      data.vacancyRisk.summary.lowRiskCount
                    ]}
                  />
                </div>
              </div>

              {/* Risk Stat Cards List */}
              <div className="flex flex-col gap-3">
                {/* High Risk Card */}
                <div className="p-4 bg-white dark:bg-slate-900/40 rounded-2xl border-2 border-red-500/20 flex items-center justify-between transition-all hover:shadow-lg hover:border-red-500/40 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                      <AlertTriangle size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Phòng nguy cấp</span>
                      <p className="text-sm font-bold text-primary mt-1">{formatLargeCurrency(data.vacancyRisk.summary.highRiskRevenue)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary leading-none">{data.vacancyRisk.summary.highRiskCount}</span>
                    <p className="text-[9px] font-bold text-tertiary uppercase mt-1">Hợp đồng</p>
                  </div>
                </div>

                {/* Medium Risk Card */}
                <div className="p-4 bg-white dark:bg-slate-900/40 rounded-2xl border-2 border-yellow-500/20 flex items-center justify-between transition-all hover:shadow-lg hover:border-yellow-500/40 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500 text-white flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest leading-none">Cần cảnh báo</span>
                      <p className="text-sm font-bold text-primary mt-1">{formatLargeCurrency(data.vacancyRisk.summary.mediumRiskRevenue)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary leading-none">{data.vacancyRisk.summary.mediumRiskCount}</span>
                    <p className="text-[9px] font-bold text-tertiary uppercase mt-1">Hợp đồng</p>
                  </div>
                </div>

                {/* Low Risk Card */}
                <div className="p-4 bg-white dark:bg-slate-900/40 rounded-2xl border-2 border-green-500/20 flex items-center justify-between transition-all hover:shadow-lg hover:border-green-500/40 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest leading-none">Vùng an toàn</span>
                      <p className="text-sm font-bold text-primary mt-1">Hoạt động ổn định</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary leading-none">{data.vacancyRisk.summary.lowRiskCount}</span>
                    <p className="text-[9px] font-bold text-tertiary uppercase mt-1">Hợp đồng</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Footer Widget */}
            <div className="mt-auto pt-6 border-t border-primary px-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Tổng thiệt hại dự báo</span>
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg font-black">
                  +{(data.vacancyRisk.summary.totalAtRiskRevenue / (data.revenueForecast.avgMonthlyRevenue || 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-end justify-between mb-3">
                <p className="text-3xl font-black text-primary leading-none tracking-tighter">
                  {formatLargeCurrency(data.vacancyRisk.summary.totalAtRiskRevenue)}
                </p>
                <div className="flex items-center gap-2 text-tertiary">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Thời gian thực</span>
                </div>
              </div>
              <div className="h-4 bg-tertiary/20 rounded-full overflow-hidden p-0.5 border border-primary relative group">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-red-500 to-yellow-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, (data.vacancyRisk.summary.totalAtRiskRevenue / (data.revenueForecast.avgMonthlyRevenue || 1)) * 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-black text-primary uppercase drop-shadow-sm">Mức độ rủi ro doanh thu</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Details Table Enhanced */}
        <div className="lg:col-span-7 card flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-primary">Hợp đồng rủi ro nhất</h2>
              <p className="text-[11px] sm:text-xs text-tertiary">Danh sách phòng cần lưu ý xử lý gia hạn hoặc thu hồi</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-[11px] sm:text-xs font-bold text-red-600 uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span> Cao
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[11px] sm:text-xs font-bold text-yellow-600 uppercase">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span> T.bình
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
                          <span className="flex items-center gap-1"><AlertTriangle size={10} /> Quá hạn</span>
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
          <div className="md:hidden space-y-3">
            {data.vacancyRisk.risks.slice(0, 6).map((risk) => (
              <div key={risk.contractId} className="p-3.5 sm:p-4 bg-white dark:bg-primary rounded-2xl border border-primary shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${risk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'}`}>
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-primary text-sm">{risk.roomName}</h3>
                      <p className="text-[11px] text-tertiary font-medium truncate">{risk.tenantName}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase flex-shrink-0 ml-2 ${risk.riskLevel === 'HIGH' ? 'bg-red-50 text-red-700 dark:bg-red-950/40' :
                    risk.riskLevel === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40' :
                      'bg-green-50 text-green-700 dark:bg-green-950/40'
                    }`}>
                    {risk.riskLevel === 'HIGH' ? 'Cao' : risk.riskLevel === 'MEDIUM' ? 'T.Bình' : 'An toàn'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pb-2.5 border-b border-primary mb-2.5">
                  <div>
                    <p className="text-[10px] text-tertiary uppercase font-bold mb-0.5">Hết hạn</p>
                    <p className="text-[11px] sm:text-xs font-bold text-primary">{new Date(risk.endDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-tertiary uppercase font-bold mb-0.5">Rủi ro</p>
                    <p className="text-[11px] sm:text-xs font-bold text-primary">{risk.riskScore}%</p>
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

      {/* AI Insights Section - Improved Card-Based UI */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">Trợ lý AI</h2>
              <p className="text-xs text-tertiary">Phân tích thông minh & đề xuất hành động</p>
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
                setAiInsights(result)
              } catch (err: any) {
                console.error('AI Insights error:', err)
              } finally {
                setAiLoading(false)
              }
            }}
            disabled={aiLoading}
            className="btn btn-primary h-11 px-5 rounded-xl flex items-center gap-2"
          >
            {aiLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Đang phân tích...</>
            ) : (
              <><Sparkles size={16} /> Phân tích AI</>
            )}
          </button>
        </div>

        {aiLoading ? (
          <div className="card flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <p className="text-sm text-tertiary">AI đang phân tích dữ liệu...</p>
            </div>
          </div>
        ) : aiInsights ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Performance Overview - Scorecards */}
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-blue-500" size={20} />
                <h3 className="font-bold text-primary">Tổng quan hiệu suất</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Revenue Card with Sparkline */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Doanh thu tháng này</span>
                    <TrendingUp
                      size={14}
                      className={aiInsights?.overview?.revenueTrend === 'up' ? 'text-green-500' : aiInsights?.overview?.revenueTrend === 'down' ? 'text-red-500' : 'text-gray-500'}
                    />
                  </div>
                  <p className="text-2xl font-bold text-primary">{formatLargeCurrency(aiInsights?.overview?.currentRevenue || 0)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-bold ${(aiInsights?.overview?.revenueTrendPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(aiInsights?.overview?.revenueTrendPercent || 0) >= 0 ? '+' : ''}{(aiInsights?.overview?.revenueTrendPercent || 0).toFixed(1)}%
                    </span>
                    <span className="text-xs text-tertiary">so với tháng trước</span>
                  </div>
                  {/* Mini Sparkline */}
                  <div className="mt-3 h-8 flex items-end gap-0.5">
                    {aiInsights?.overview?.last3MonthsRevenue?.map((val, idx) => {
                      const max = Math.max(...(aiInsights?.overview?.last3MonthsRevenue || []), 1)
                      const height = (val / max) * 100
                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-blue-400/60 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Occupancy Rate Card with Progress */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200/50 dark:border-green-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Tỷ lệ lấp đầy</span>
                    <Building2 size={14} className="text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{(aiInsights?.overview?.occupancyRate || 0).toFixed(0)}%</p>
                  {/* Progress Bar */}
                  <div className="mt-3 h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${Math.min(100, (aiInsights?.overview?.occupancyRate || 0))}%` }}
                    />
                  </div>
                  <p className="text-xs text-tertiary mt-2">Phòng đang cho thuê</p>
                </div>
              </div>
            </div>

            {/* Card 2: Warnings - Urgent Alerts */}
            <div className="card border-red-200/50 dark:border-red-800/30 bg-red-50/30 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-red-500" size={20} />
                <h3 className="font-bold text-primary">Cảnh báo cấp bách</h3>
              </div>

              {/* Debt Warning */}
              {(aiInsights?.warnings?.totalDebt || 0) > 0 && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">Công nợ chưa thu</span>
                    <span className="text-xs bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded-full text-red-700 dark:text-red-300">
                      {aiInsights?.warnings?.overdueInvoices?.length} hóa đơn
                    </span>
                  </div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatLargeCurrency(aiInsights?.warnings?.totalDebt || 0)}</p>
                </div>
              )}

              {/* Expiring Contracts Warning */}
              {(aiInsights?.warnings?.expiringContracts?.length || 0) > 0 && (
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Hợp đồng sắp hết hạn</span>
                    <span className="text-xs bg-orange-200 dark:bg-orange-800 px-2 py-0.5 rounded-full text-orange-700 dark:text-orange-300">
                      {aiInsights?.warnings?.expiringContracts?.length} hợp đồng
                    </span>
                  </div>
                  <p className="text-sm text-tertiary mt-1">
                    Cần gia hạn trước {Math.max(...(aiInsights?.warnings?.expiringContracts?.map(c => c.daysUntilExpiry) || [0]))} ngày
                  </p>
                </div>
              )}

              {(aiInsights?.warnings?.totalDebt || 0) === 0 && (aiInsights?.warnings?.expiringContracts?.length || 0) === 0 && (
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <TrendingUp className="mx-auto text-green-500 mb-2" size={24} />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Không có cảnh báo</p>
                </div>
              )}
            </div>

            {/* Card 3: Actionable Recommendations */}
            <div className="card lg:col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-500" size={20} />
                <h3 className="font-bold text-primary">Đề xuất hành động</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {aiInsights?.recommendations?.map((rec) => {
                  const isExpanded = expandedRecs.has(rec.id)
                  return (
                    <div
                      key={rec.id}
                      className={`flex flex-col h-full rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${rec.priority === 'high'
                        ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-[#1a1a1a] border-red-200 dark:border-red-900/30'
                        : rec.priority === 'medium'
                          ? 'bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-[#1a1a1a] border-yellow-200 dark:border-yellow-900/30'
                          : 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-[#1a1a1a] border-blue-200 dark:border-blue-900/30'
                        }`}
                    >
                      <div className="p-4 sm:p-5 flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-2 h-2 rounded-full animate-pulse ${rec.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : rec.priority === 'medium' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                            }`}></span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${rec.priority === 'high' ? 'text-red-600 dark:text-red-400' : rec.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                            }`}>
                            {rec.priority === 'high' ? 'Khẩn cấp' : rec.priority === 'medium' ? 'Quan trọng' : 'Phân tích'}
                          </span>
                        </div>
                        <h4 className="font-bold text-primary text-sm sm:text-base mb-2 leading-tight">{rec.title}</h4>
                        <div className="space-y-2">
                          <p className={`text-xs text-tertiary leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                            {rec.description}
                          </p>
                          {rec.description.length > 60 && (
                            <button
                              onClick={() => {
                                setExpandedRecs(prev => {
                                  const next = new Set(prev)
                                  if (next.has(rec.id)) next.delete(rec.id)
                                  else next.add(rec.id)
                                  return next
                                })
                              }}
                              className={`text-[11px] font-bold inline-flex items-center gap-1 transition-all ${rec.priority === 'high' ? 'text-red-500 hover:text-red-600' : rec.priority === 'medium' ? 'text-yellow-600 hover:text-yellow-700' : 'text-blue-500 hover:text-blue-600'
                                }`}
                            >
                              {isExpanded ? '← Thu gọn' : 'Xem thêm →'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Action Button - New Premium Style */}
                      <div className="p-4 pt-0">
                        {rec.actionType === 'view_list' && (
                          <a
                            href="/admin/rooms"
                            className="w-full flex items-center justify-between py-2.5 px-4 bg-white dark:bg-slate-900/40 border-2 border-primary/20 hover:border-primary text-primary text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md hover:shadow-primary/10 transition-all group"
                          >
                            <span>Xem danh sách</span>
                            <Search size={14} className="group-hover:scale-110 transition-transform" />
                          </a>
                        )}
                        {rec.actionType === 'send_message' && (
                          <a
                            href="/admin/invoices"
                            className="w-full flex items-center justify-between py-2.5 px-4 bg-white dark:bg-slate-900/40 border-2 border-red-500/20 hover:border-red-500 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md hover:shadow-red-500/10 transition-all group"
                          >
                            <span>Gửi nhắc nợ</span>
                            <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        )}
                        {rec.actionType === 'renew_contract' && (
                          <a
                            href="/admin/renewals"
                            className="w-full flex items-center justify-between py-2.5 px-4 bg-white dark:bg-slate-900/40 border-2 border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md hover:shadow-orange-500/10 transition-all group"
                          >
                            <span>Gia hạn ngay</span>
                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                          </a>
                        )}
                        {rec.actionType === 'check_invoice' && (
                          <a
                            href="/admin/invoices"
                            className="w-full flex items-center justify-between py-2.5 px-4 bg-white dark:bg-slate-900/40 border-2 border-blue-500/20 hover:border-blue-500 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md hover:shadow-blue-500/10 transition-all group"
                          >
                            <span>Kiểm tra hóa đơn</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">Chưa có dữ liệu phân tích</h3>
            <p className="text-sm text-tertiary max-w-md mx-auto">
              Nhấn nút "Phân tích AI" để nhận các đề xuất hành động dựa trên dữ liệu hiện tại của nhà trọ.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
