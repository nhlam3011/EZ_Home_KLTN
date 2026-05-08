'use client'

import { useEffect, useState } from 'react'
import { DollarSign, FileText, MessageSquare, TrendingUp, ArrowRight, Bell, Wrench, CheckCircle2, Clock, XCircle, AlertCircle, AlertTriangle, Receipt, X } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Loading from '@/components/Loading'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface DashboardData {
  currentInvoice: any
  contract: any
  contractStatus: {
    isExpired: boolean
    daysUntilExpiry: number | null
    graceDaysRemaining?: number | null
  }
  walletBalance: number
  rewardPoints: number
  utilityCosts: any[]
  costStructures: any[]
  recentActivities: any[]
  currentMonth: number
  currentYear: number
  unreadMessagesCount: number
  unpaidInvoices: any[]
  unpaidInvoicesCount: number
  unpaidAmount: number
  issues: {
    pending: number
    processing: number
    done: number
    cancelled: number
  }
}

export default function TenantDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [utilityMonths, setUtilityMonths] = useState(3)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedCostMonth, setSelectedCostMonth] = useState<string>('')

  useEffect(() => {
    fetchDashboardData()

    // Detect dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    checkDarkMode()

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [utilityMonths])

  const fetchDashboardData = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return

      const user = JSON.parse(userData)
      const response = await fetch(`/api/tenant/dashboard?months=${utilityMonths}&userId=${user.id}`)
      const dashboardData = await response.json()
      setData(dashboardData)
      if (dashboardData.costStructures && dashboardData.costStructures.length > 0) {
        if (!selectedCostMonth || !dashboardData.costStructures.some((c: any) => c.label === selectedCostMonth)) {
          const latest = dashboardData.costStructures[dashboardData.costStructures.length - 1]
          setSelectedCostMonth(latest.label)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getDaysRemaining = (endDate: Date | string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleRenewContract = () => {
    setShowRenewModal(true)
  }

  const confirmRenewContract = async () => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (!userData) {
      alert('Vui lòng đăng nhập lại')
      return
    }

    let user
    try {
      user = JSON.parse(userData)
    } catch (e) {
      alert('Vui lòng đăng nhập lại')
      return
    }

    // Get contract info
    const contractRes = await fetch(`/api/contracts?userId=${user.id}`)
    if (!contractRes.ok) {
      alert('Không tìm thấy hợp đồng')
      return
    }

    const contracts = await contractRes.json()
    const activeContract = contracts.find((c: any) => c.status === 'ACTIVE')

    if (!activeContract) {
      alert('Không tìm thấy hợp đồng đang hoạt động')
      return
    }

    // Calculate new end date (default: extend by 1 year)
    const currentEndDate = new Date(activeContract.endDate)
    const newEndDate = new Date(currentEndDate)
    newEndDate.setFullYear(newEndDate.getFullYear() + 1)

    try {
      const response = await fetch('/api/contracts/renewals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractId: activeContract.id,
          userId: user.id,
          newEndDate: newEndDate.toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Yêu cầu gia hạn hợp đồng đã được gửi. Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.')
        setShowRenewModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error submitting renewal request:', error)
      alert('Có lỗi xảy ra khi gửi yêu cầu')
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Đang tải dữ liệu..." />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">TỔNG QUAN</h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">Quản lý thông tin và thanh toán của bạn</p>
      </div>

      {/* Key Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Invoice Card - Shows unpaid invoices count or current month invoice */}
        <div className={`card relative overflow-hidden flex flex-col h-full ${data.unpaidInvoicesCount > 0
          ? 'stat-card-red'
          : 'stat-card-blue'
          }`}>
          <div className={`absolute top-0 right-0 w-35 h-35 rounded-full -mr-16 -mt-16 opacity-50 ${data.unpaidInvoicesCount > 0
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-blue-50 dark:bg-blue-900/20'
            }`}></div>
          <div className="relative flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-primary">
                {data.unpaidInvoicesCount > 0
                  ? 'Hóa đơn chưa thanh toán'
                  : `Hóa đơn tháng ${data.currentMonth}/${data.currentYear}`
                }
              </h3>
              <div className="relative flex-shrink-0">
                {data.unpaidInvoicesCount > 0 ? (
                  <>
                    <AlertTriangle className="text-red-500 dark:text-red-400 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {data.unpaidInvoicesCount > 9 ? '9+' : data.unpaidInvoicesCount}
                    </span>
                  </>
                ) : (
                  <Receipt className="text-blue-500 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
            </div>
            {data.unpaidInvoicesCount > 0 ? (
              <>
                <p className="text-xl sm:text-2xl font-bold text-primary mb-2">
                  {formatCurrency(data.unpaidAmount || 0)}
                </p>
                <span className="badge badge-error">
                  {data.unpaidInvoicesCount} hóa đơn chưa thanh toán
                </span>
                <p className="text-xs text-secondary mt-2 mb-3 sm:mb-4">
                  Tổng số tiền cần thanh toán
                </p>
                <div className="mt-auto">
                  <Link
                    href="/tenant/invoices"
                    className="btn btn-primary btn-sm sm:btn-md w-full text-xs sm:text-sm"
                  >
                    Xem và thanh toán
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-primary mb-2">
                  {formatCurrency(data.currentInvoice?.totalAmount || 0)}
                </p>
                <span className={`badge ${data.currentInvoice?.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                  {data.currentInvoice?.status === 'PAID' ? 'Đã thanh toán' : 'Chưa có hóa đơn'}
                </span>
                <p className="text-xs text-secondary mt-2 mb-3 sm:mb-4">
                  {data.currentInvoice?.status === 'PAID' ? 'Đã thanh toán đầy đủ' : 'Không có hóa đơn chưa thanh toán'}
                </p>
                <div className="mt-auto">
                  <Link
                    href="/tenant/invoices"
                    className="btn btn-secondary btn-sm sm:btn-md w-full text-xs sm:text-sm"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contract Card */}
        {data.contractStatus?.isExpired ? (
          <div className="card stat-card-red relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-35 h-35 bg-red-50 dark:bg-red-900/30 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-primary">Hợp đồng thuê</h3>
                <FileText className="text-red-500 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-primary mb-2">
                {formatDate(data.contract?.endDate || new Date())}
              </p>
              <span className="badge badge-danger">
                Hết hiệu lực
              </span>
              <p className="text-xs text-secondary mt-2 mb-3 sm:mb-4">
                Hợp đồng của bạn đã hết hạn. Vui lòng liên hệ quản lý để gia hạn.
                {data.contractStatus?.graceDaysRemaining !== undefined && data.contractStatus?.graceDaysRemaining !== null && data.contractStatus?.graceDaysRemaining > 0 && (
                  <span className="block mt-1 text-red-600 dark:text-red-400 font-semibold">
                    Tài khoản sẽ bị khóa sau {data.contractStatus.graceDaysRemaining} ngày nữa.
                  </span>
                )}
              </p>
              <div className="mt-auto">
                <Link
                  href="/tenant/contracts"
                  className="btn btn-primary btn-sm sm:btn-md w-full text-xs sm:text-sm"
                >
                  Xem chi tiết hợp đồng
                </Link>
              </div>
            </div>
          </div>
        ) : data.contractStatus?.daysUntilExpiry !== null && data.contractStatus?.daysUntilExpiry <= 30 ? (
          <div className="card stat-card-orange relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-35 h-35 bg-orange-50 dark:bg-orange-900/30 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-primary">Hợp đồng thuê</h3>
                <FileText className="text-orange-500 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-primary mb-2">
                {formatDate(data.contract?.endDate || new Date())}
              </p>
              <span className="badge" style={{ backgroundColor: '#f97316', color: 'white' }}>
                Sắp hết hạn
              </span>
              <p className="text-xs text-secondary mt-2 mb-3 sm:mb-4">
                Còn hiệu lực: {data.contractStatus?.daysUntilExpiry || 0} ngày
              </p>
              <div className="mt-auto">
                <button
                  onClick={handleRenewContract}
                  className="btn btn-secondary btn-sm sm:btn-md w-full text-xs sm:text-sm"
                >
                  Gia hạn hợp đồng
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card stat-card-green relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-35 h-35 bg-green-50 dark:bg-green-900/30 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-primary">Hợp đồng thuê</h3>
                <FileText className="text-green-500 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-primary mb-2">
                {formatDate(data.contract?.endDate || new Date())}
              </p>
              <span className="badge badge-success">
                Đang hiệu lực
              </span>
              <p className="text-xs text-secondary mt-2 mb-3 sm:mb-4">
                Còn hiệu lực: {getDaysRemaining(data.contract?.endDate || new Date())} ngày
              </p>
              <div className="mt-auto">
                <button
                  onClick={handleRenewContract}
                  className="btn btn-secondary btn-sm sm:btn-md w-full text-xs sm:text-sm"
                >
                  Gia hạn hợp đồng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Card */}
        <div className="card stat-card-purple relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-35 h-35 bg-purple-50 dark:bg-purple-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-primary">Tin nhắn</h3>
              <div className="relative flex-shrink-0">
                <MessageSquare className="text-purple-500 dark:text-purple-400 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                {data.unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {data.unreadMessagesCount > 9 ? '9+' : data.unreadMessagesCount}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-1">
              {data.unreadMessagesCount || 0} tin mới
            </p>
            <p className="text-xs sm:text-sm text-secondary mb-3 sm:mb-4">
              Tin nhắn từ quản lý
            </p>
            <div className="mt-auto">
              <Link
                href="/tenant/messages"
                className="btn btn-primary btn-sm sm:btn-md w-full text-xs sm:text-sm"
              >
                Xem tin nhắn
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Unpaid Invoices List */}
      {data.unpaidInvoicesCount > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-primary">Hóa đơn chưa thanh toán</h3>
              <p className="text-xs sm:text-sm text-secondary mt-0.5 sm:mt-1">{data.unpaidInvoicesCount} hóa đơn • {formatCurrency(data.unpaidAmount || 0)}</p>
            </div>
            <Link href="/tenant/invoices" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
              Xem tất cả
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {data.unpaidInvoices.slice(0, 5).map((invoice: any) => (
              <div key={invoice.id} className="flex items-center justify-between p-3.5 sm:p-4 bg-tertiary rounded-xl border border-primary gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 sm:mb-1.5 flex-wrap">
                    <h4 className="text-sm sm:text-base font-bold text-primary whitespace-nowrap leading-none">
                      T{invoice.month}/{invoice.year}
                    </h4>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      invoice.status === 'OVERDUE' 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' 
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                    }`}>
                      {invoice.status === 'OVERDUE' ? 'Quá hạn' : 'Chờ'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(invoice.totalAmount || 0)}
                    </p>
                    {invoice.paymentDueDate && (
                      <p className="text-[11px] sm:text-xs text-secondary flex items-center gap-1">
                        <Clock size={12} className="opacity-70" />
                        Hạn: {formatDate(invoice.paymentDueDate)}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight size={16} className="text-secondary opacity-30 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card stat-card-yellow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Clock className="text-white" size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-primary mb-1 font-medium">Sự cố chờ xử lý</p>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-1">{data.issues?.pending || 0}</p>
            <Link href="/tenant/issues" className="text-xs text-secondary hover:text-primary transition-colors">
              Xem chi tiết →
            </Link>
          </div>
        </div>

        <div className="card stat-card-blue">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Wrench className="text-white" size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-primary mb-1 font-medium">Đang xử lý</p>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-1">{data.issues?.processing || 0}</p>
            <Link href="/tenant/issues" className="text-xs text-secondary hover:text-primary transition-colors">
              Xem chi tiết →
            </Link>
          </div>
        </div>

        <div className="card stat-card-green">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <CheckCircle2 className="text-white" size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-primary mb-1 font-medium">Đã hoàn thành</p>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-1">{data.issues?.done || 0}</p>
            <Link href="/tenant/issues" className="text-xs text-secondary hover:text-primary transition-colors">
              Xem chi tiết →
            </Link>
          </div>
        </div>

        <div className="card stat-card-gray">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <XCircle className="text-white" size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-primary mb-1 font-medium">Đã hủy</p>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-1">{data.issues?.cancelled || 0}</p>
            <Link href="/tenant/issues" className="text-xs text-secondary hover:text-primary transition-colors">
              Xem chi tiết →
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Utility Costs Chart */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-primary">Điện & Nước</h3>
            <select
              value={utilityMonths}
              onChange={(e) => setUtilityMonths(parseInt(e.target.value))}
              className="input text-xs sm:text-sm px-2 sm:px-3 py-1 w-full sm:w-auto"
            >
              <option value={3}>3 tháng gần nhất</option>
              <option value={6}>6 tháng gần nhất</option>
              <option value={12}>12 tháng gần nhất</option>
            </select>
          </div>
          <div className="min-h-[320px]">
            <Chart
              type="bar"
              height={320}
              options={{
                chart: {
                  toolbar: { show: false },
                  zoom: { enabled: false },
                  fontFamily: 'var(--font-inter)',
                  background: 'transparent',
                  animations: {
                    enabled: true,
                    speed: 800,
                    animateGradually: { enabled: true, delay: 150 },
                    dynamicAnimation: { enabled: true, speed: 350 }
                  }
                },
                colors: isDarkMode ? ['#facc15', '#60a5fa'] : ['#eab308', '#3b82f6'],
                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: '65%',
                    borderRadius: 6,
                    borderRadiusApplication: 'end',
                    dataLabels: {
                      position: 'top'
                    },
                    distributed: false
                  }
                },
                dataLabels: {
                  enabled: false
                },
                stroke: {
                  show: true,
                  width: 2,
                  colors: ['transparent'],
                  curve: 'smooth'
                },
                fill: {
                  type: 'gradient',
                  gradient: {
                    shade: 'light',
                    type: 'vertical',
                    stops: [0, 90, 100]
                  }
                },
                xaxis: {
                  categories: data.utilityCosts?.map(c => c.monthName || `${c.month}/${c.year}`) || [],
                  axisBorder: { show: false },
                  axisTicks: { show: false },
                  tickPlacement: 'between',
                  labels: {
                    style: {
                      colors: 'var(--text-tertiary)',
                      fontSize: '11px',
                      fontWeight: 500
                    }
                  }
                },
                yaxis: {
                  labels: {
                    style: {
                      colors: 'var(--text-tertiary)',
                      fontSize: '11px',
                      fontWeight: 500
                    },
                    formatter: (val: number) => {
                      return new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0
                      }).format(val).replace('₫', '').trim().slice(0, -3) + 'K'
                    }
                  }
                },
                tooltip: {
                  theme: 'light',
                  style: { fontSize: '13px' },
                  y: {
                    formatter: (val: number) => formatCurrency(val)
                  }
                },
                legend: {
                  position: 'top',
                  horizontalAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 500,
                  itemMargin: {
                    horizontal: 16,
                    vertical: 0
                  }
                },
                grid: {
                  borderColor: 'var(--border-primary)',
                  strokeDashArray: 5,
                  xaxis: { lines: { show: false } },
                  yaxis: { lines: { show: false } },
                  padding: { left: 10, right: 10 }
                },
                states: {
                  hover: {
                    filter: {
                      type: '' as const
                    }
                  },
                  active: {
                    filter: {
                      type: 'darken' as const
                    }
                  }
                }
              }}
              series={[
                {
                  name: 'Điện',
                  data: data.utilityCosts?.map(c => c.elec) || []
                },
                {
                  name: 'Nước',
                  data: data.utilityCosts?.map(c => c.water) || []
                }
              ]}
            />
          </div>
        </div>

        {/* Cost Structure Chart */}
        {(() => {
          const currentCostStructure = data.costStructures?.find((c: any) => c.label === selectedCostMonth) || { room: 0, services: 0, other: 0, roomAmount: 0, servicesAmount: 0, otherAmount: 0, total: 0 }
          
          return (
            <div className="card flex flex-col h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-primary">
                  Cơ cấu chi phí tháng {selectedCostMonth || `${data.currentMonth}/${data.currentYear}`}
                </h3>
                {data.costStructures && data.costStructures.length > 0 && (
                  <select
                    value={selectedCostMonth}
                    onChange={(e) => setSelectedCostMonth(e.target.value)}
                    className="input text-xs sm:text-sm px-2 sm:px-3 py-1 w-full sm:w-auto"
                  >
                    {data.costStructures.map((c: any) => (
                      <option key={c.label} value={c.label}>Tháng {c.label}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {currentCostStructure.total > 0 ? (
                <div className="flex flex-col flex-1 justify-between">
                  <div className="flex items-center justify-center flex-1 min-h-[240px]">
                    <div className="w-full max-w-[280px] sm:max-w-[640px]">
                      <Chart
                        type="bar"
                        height={240}
                        options={{
                          chart: {
                            fontFamily: 'var(--font-inter)',
                            background: 'transparent',
                            toolbar: { show: false },
                            animations: {
                              enabled: true,
                              speed: 800,
                              animateGradually: {
                                enabled: true,
                                delay: 150
                              },
                              dynamicAnimation: {
                                enabled: true,
                                speed: 350
                              }
                            }
                          },
                          colors: isDarkMode ? ['#facc15', '#60a5fa', '#34d399'] : ['#eab308', '#3b82f6', '#10b981'],
                          plotOptions: {
                            bar: {
                              horizontal: true,
                              borderRadius: 8,
                              borderRadiusApplication: 'end',
                              barHeight: '60%',
                              distributed: true,
                              dataLabels: {
                                position: 'top',
                                maxItems: 100,
                                hideOverflowingLabels: true
                              }
                            }
                          },
                          dataLabels: {
                            enabled: true,
                            style: {
                              fontSize: '14px',
                              fontWeight: 700,
                              colors: [isDarkMode ? '#1f2937' : '#ffffff']
                            },
                            offsetX: 30
                          },
                          xaxis: {
                            categories: ['Tiền phòng', 'Dịch vụ', 'Khác'],
                            max: 100,
                            labels: {
                              style: {
                                colors: 'var(--text-tertiary)',
                                fontSize: '12px'
                              },
                              formatter: (val: number) => `${val}%`
                            }
                          },
                          yaxis: {
                            labels: {
                              style: {
                                colors: 'var(--text-tertiary)',
                                fontSize: '12px',
                                fontWeight: 500
                              }
                            }
                          },
                          grid: {
                            borderColor: 'var(--border-primary)',
                            strokeDashArray: 4,
                            xaxis: { lines: { show: true } },
                            yaxis: { lines: { show: false } }
                          },
                          legend: {
                            show: false
                          },
                          tooltip: {
                            enabled: true,
                            theme: 'light',
                            style: { fontSize: '13px' },
                            y: {
                              formatter: function(val: number, opts: any) {
                                const index = opts.dataPointIndex;
                                let amount = 0;
                                if (index === 0) amount = currentCostStructure.roomAmount || 0;
                                else if (index === 1) amount = currentCostStructure.servicesAmount || 0;
                                else if (index === 2) amount = currentCostStructure.otherAmount || 0;
                                
                                const formattedAmount = new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                  minimumFractionDigits: 0
                                }).format(amount);
                                return `${val}% (${formattedAmount})`;
                              }
                            }
                          }
                        }}
                        series={[{
                          data: [currentCostStructure.room, currentCostStructure.services, currentCostStructure.other]
                        }]}
                      />
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                      <div className={`w-3 h-3 mx-auto mb-2 rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'}`}></div>
                      <p className="text-xs text-primary font-medium mb-1">Tiền phòng</p>
                      <p className="text-sm font-bold text-primary mb-1">{currentCostStructure.room}%</p>
                      <p className="text-[10px] text-secondary font-medium">{formatCurrency(currentCostStructure.roomAmount || 0)}</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                      <div className={`w-3 h-3 mx-auto mb-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                      <p className="text-xs text-primary font-medium mb-1">Dịch vụ</p>
                      <p className="text-sm font-bold text-primary mb-1">{currentCostStructure.services}%</p>
                      <p className="text-[10px] text-secondary font-medium">{formatCurrency(currentCostStructure.servicesAmount || 0)}</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                      <div className={`w-3 h-3 mx-auto mb-2 rounded-full ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
                      <p className="text-xs text-primary font-medium mb-1">Khác</p>
                      <p className="text-sm font-bold text-primary mb-1">{currentCostStructure.other}%</p>
                      <p className="text-[10px] text-secondary font-medium">{formatCurrency(currentCostStructure.otherAmount || 0)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[240px] text-tertiary">
                  <Receipt className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Không có dữ liệu chi phí tháng này</p>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-primary">Hoạt động gần đây</h3>
          <Link href="/tenant/activities" className="text-xs sm:text-sm text-primary hover:text-secondary flex items-center gap-1 transition-colors">
            Xem tất cả
            <ArrowRight size={14} className="sm:w-4 sm:h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {data.recentActivities && data.recentActivities.length > 0 ? (
            data.recentActivities.map((activity, idx) => {
              const getStatusConfig = () => {
                if (activity.status === 'Thành công' || activity.status === 'Hoàn thành') {
                  return {
                    color: 'text-green-600 dark:text-green-400',
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    icon: CheckCircle2,
                    iconColor: 'text-green-500'
                  }
                } else if (activity.status === 'Đang xử lý' || activity.status === 'Chờ xử lý') {
                  return {
                    color: 'text-orange-600 dark:text-orange-400',
                    bg: 'bg-orange-50 dark:bg-orange-900/20',
                    border: 'border-orange-200 dark:border-orange-800',
                    icon: Clock,
                    iconColor: 'text-orange-500'
                  }
                } else if (activity.status === 'Quá hạn' || activity.status === 'Đã hủy') {
                  return {
                    color: 'text-red-600 dark:text-red-400',
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    icon: XCircle,
                    iconColor: 'text-red-500'
                  }
                } else {
                  return {
                    color: 'text-secondary',
                    bg: 'bg-tertiary',
                    border: 'border-primary',
                    icon: AlertCircle,
                    iconColor: 'text-secondary'
                  }
                }
              }

              const getTypeIcon = () => {
                if (activity.type === 'Tài chính') {
                  return DollarSign
                } else if (activity.type === 'Kỹ thuật') {
                  return Wrench
                }
                return FileText
              }

              const statusConfig = getStatusConfig()
              const StatusIcon = statusConfig.icon
              const TypeIcon = getTypeIcon()

              return (
                <div
                  key={idx}
                  className={`p-3 sm:p-4 rounded-lg border ${statusConfig.bg} ${statusConfig.border} hover:shadow-md transition-all`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${statusConfig.bg} border ${statusConfig.border}`}>
                      <TypeIcon className={`${statusConfig.iconColor} w-5 h-5 sm:w-6 sm:h-6`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-primary mb-1">
                            {activity.description}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                              {activity.time}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <FileText size={12} className="sm:w-3.5 sm:h-3.5" />
                              {activity.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusIcon className={`${statusConfig.iconColor} w-4 h-4 sm:w-5 sm:h-5`} />
                          <span className={`text-xs sm:text-sm font-semibold ${statusConfig.color}`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-tertiary rounded-full flex items-center justify-center">
                <FileText className="text-secondary w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <p className="text-sm sm:text-base text-tertiary font-medium">Chưa có hoạt động nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Renew Contract Confirmation Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowRenewModal(false)}>
          <div className="bg-primary rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary">Gia hạn hợp đồng</h2>
                <button onClick={() => setShowRenewModal(false)} className="p-2 hover:bg-tertiary rounded-lg">
                  <X size={20} className="text-secondary" />
                </button>
              </div>
              <p className="text-secondary mb-6">
                Bạn có muốn gia hạn hợp đồng thuê? Chúng tôi sẽ liên hệ với bạn để xác nhận chi tiết.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setShowRenewModal(false)} className="btn btn-secondary btn-md">
                  Hủy
                </button>
                <button onClick={confirmRenewContract} className="btn btn-primary btn-md">
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

