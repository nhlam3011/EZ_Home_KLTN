'use client'

import { useEffect, useState } from 'react'
import { DollarSign, FileText, MessageSquare, TrendingUp, ArrowRight, Bell, Wrench, CheckCircle2, Clock, XCircle, AlertCircle, AlertTriangle, Receipt } from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  currentInvoice: any
  contract: any
  walletBalance: number
  rewardPoints: number
  utilityCosts: any[]
  costStructure: any
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
  const [selectedUtilityBar, setSelectedUtilityBar] = useState<{type: 'elec' | 'water', index: number} | null>(null)
  const [utilityMonths, setUtilityMonths] = useState(6)

  useEffect(() => {
    fetchDashboardData()
  }, [utilityMonths])

  const fetchDashboardData = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return
      
      const user = JSON.parse(userData)
      const response = await fetch(`/api/tenant/dashboard?months=${utilityMonths}&userId=${user.id}`)
      const data = await response.json()
      setData(data)
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
    const confirmed = confirm('Bạn có muốn gia hạn hợp đồng thuê? Chúng tôi sẽ liên hệ với bạn để xác nhận chi tiết.')
    if (confirmed) {
      // In a real app, this would send to API
      alert('Yêu cầu gia hạn hợp đồng đã được gửi. Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.')
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-tertiary">Đang tải...</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Tổng quan</h1>
        <p className="text-sm sm:text-base text-secondary mt-1">Quản lý thông tin và thanh toán của bạn</p>
      </div>

      {/* Key Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Invoice Card - Shows unpaid invoices count or current month invoice */}
        <div className={`card relative overflow-hidden flex flex-col h-full ${
          data.unpaidInvoicesCount > 0
            ? 'stat-card-red'
            : 'stat-card-blue'
        }`}>
          <div className={`absolute top-0 right-0 w-35 h-35 rounded-full -mr-16 -mt-16 opacity-50 ${
            data.unpaidInvoicesCount > 0
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
                <span className="bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded">
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
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  data.currentInvoice?.status === 'PAID'
                    ? 'bg-success-soft border border-success-subtle text-fg-success-strong'
                    : 'bg-neutral-secondary-medium border border-default-medium text-heading'
                }`}>
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
            <span className="bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-primary">Hóa đơn chưa thanh toán</h3>
              <p className="text-xs sm:text-sm text-secondary mt-1">Danh sách các hóa đơn cần thanh toán</p>
            </div>
            <Link href="/tenant/invoices" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
              Xem tất cả
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.unpaidInvoices.slice(0, 5).map((invoice: any) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 sm:p-4 bg-tertiary rounded-lg hover:bg-secondary transition-colors border border-primary">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1">
                    <h4 className="text-sm sm:text-base font-semibold text-primary">
                      Hóa đơn tháng {invoice.month}/{invoice.year}
                    </h4>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      invoice.status === 'OVERDUE'
                        ? 'bg-danger-soft border border-danger-subtle text-fg-danger-strong'
                        : 'bg-warning-soft border border-warning-subtle text-warning'
                    }`}>
                      {invoice.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-secondary">
                    Tổng tiền: <span className="font-semibold text-primary">{formatCurrency(invoice.totalAmount || 0)}</span>
                  </p>
                  {invoice.paymentDueDate && (
                    <p className="text-xs text-tertiary mt-1">
                      Hạn thanh toán: {formatDate(invoice.paymentDueDate)}
                    </p>
                  )}
                </div>
                <Link
                  href={`/tenant/invoices`}
                  className="btn btn-primary btn-sm flex-shrink-0 ml-3 sm:ml-4 text-xs sm:text-sm"
                >
                  Thanh toán
                </Link>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-primary">Chi phí Điện & Nước</h3>
            <select 
              value={utilityMonths}
              onChange={(e) => {
                setUtilityMonths(parseInt(e.target.value))
                setSelectedUtilityBar(null) // Reset selection when changing months
              }}
              className="input text-xs sm:text-sm px-2 sm:px-3 py-1 w-full sm:w-auto"
            >
              <option value={3}>3 tháng gần nhất</option>
              <option value={6}>6 tháng gần nhất</option>
              <option value={12}>12 tháng gần nhất</option>
            </select>
          </div>
          <div className="flex items-end justify-between gap-1 sm:gap-2 overflow-x-auto pb-2 pt-14 sm:pt-16 min-h-[200px] sm:min-h-[280px]">
            {data.utilityCosts?.map((cost, idx) => {
              const maxValue = Math.max(...data.utilityCosts.map(c => Math.max(c.elec, c.water)), 1)
              const isElecSelected = selectedUtilityBar?.type === 'elec' && selectedUtilityBar?.index === idx
              const isWaterSelected = selectedUtilityBar?.type === 'water' && selectedUtilityBar?.index === idx
              const elecHeight = Math.max((cost.elec / maxValue) * 100, 5)
              const waterHeight = Math.max((cost.water / maxValue) * 100, 5)
              const totalHeight = elecHeight + waterHeight
              const showTooltipAbove = totalHeight > 70 // Show tooltip above if bar is tall
              
              return (
                <div key={idx} className="flex-1 min-w-[40px] sm:min-w-0 flex flex-col items-center gap-1 sm:gap-2">
                  <div className="w-full flex flex-col gap-1 h-36 sm:h-48 justify-end relative">
                    <div 
                      onClick={() => setSelectedUtilityBar(isElecSelected ? null : { type: 'elec', index: idx })}
                      className={`w-full bg-blue-500 rounded-t transition-all cursor-pointer relative ${isElecSelected ? 'bg-blue-600 ring-2 ring-blue-400' : 'hover:bg-blue-600'}`}
                      style={{ height: `${elecHeight}%` }}
                    >
                      {isElecSelected && (
                        <div className={`absolute left-1/2 transform -translate-x-1/2 bg-primary dark:bg-secondary text-inverse dark:text-primary text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg border border-primary z-10 ${
                          showTooltipAbove ? '-top-12' : 'top-full mt-1'
                        }`}>
                          Điện: {formatCurrency(cost.elec)}
                        </div>
                      )}
                    </div>
                    <div 
                      onClick={() => setSelectedUtilityBar(isWaterSelected ? null : { type: 'water', index: idx })}
                      className={`w-full bg-cyan-500 dark:bg-cyan-400 rounded-t transition-all cursor-pointer relative ${isWaterSelected ? 'bg-cyan-600 dark:bg-cyan-500 ring-2 ring-cyan-400' : 'hover:bg-cyan-600 dark:hover:bg-cyan-500'}`}
                      style={{ height: `${waterHeight}%` }}
                    >
                      {isWaterSelected && (
                        <div className={`absolute left-1/2 transform -translate-x-1/2 bg-primary dark:bg-secondary text-inverse dark:text-primary text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg border border-primary z-10 ${
                          showTooltipAbove ? '-top-12' : 'top-full mt-1'
                        }`}>
                          Nước: {formatCurrency(cost.water)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-primary font-semibold text-center">{cost.monthName || `${cost.month}/${cost.year}`}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-primary font-medium">Điện</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-500 dark:bg-cyan-400 rounded-full"></div>
              <span className="text-xs sm:text-sm text-primary font-medium">Nước</span>
            </div>
          </div>
        </div>

        {/* Cost Structure Chart */}
        <div className="card">
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-4">
            Cơ cấu chi phí tháng {data.currentMonth}/{data.currentYear}
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${(data.costStructure?.room || 0) * 2 * Math.PI * 40 / 100} ${2 * Math.PI * 40}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="20"
                  strokeDasharray={`${(data.costStructure?.services || 0) * 2 * Math.PI * 40 / 100} ${2 * Math.PI * 40}`}
                  strokeDashoffset={`-${(data.costStructure?.room || 0) * 2 * Math.PI * 40 / 100}`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="20"
                  strokeDasharray={`${(data.costStructure?.other || 0) * 2 * Math.PI * 40 / 100} ${2 * Math.PI * 40}`}
                  strokeDashoffset={`-${((data.costStructure?.room || 0) + (data.costStructure?.services || 0)) * 2 * Math.PI * 40 / 100}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-base sm:text-lg font-bold text-primary">
                    {data.costStructure?.total 
                      ? formatCurrency(data.costStructure.total).replace('₫', '').trim()
                      : '0 VNĐ'
                    }
                  </p>
                  <p className="text-xs text-secondary font-medium">Tổng cộng</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                <span className="text-xs sm:text-sm text-primary font-medium">Tiền phòng</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-primary">{data.costStructure?.room || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-300 rounded"></div>
                <span className="text-xs sm:text-sm text-primary font-medium">Dịch vụ & Tiện ích</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-primary">{data.costStructure?.services || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-200 rounded"></div>
                <span className="text-xs sm:text-sm text-primary font-medium">Khác</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-primary">{data.costStructure?.other || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
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
    </div>
  )
}
