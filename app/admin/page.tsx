'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  DollarSign, 
  Building2, 
  AlertTriangle, 
  Wrench,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight
} from 'lucide-react'

interface DashboardStats {
  totalRooms: number
  rentedRooms: number
  vacantRooms: number
  totalResidents: number
  monthlyRevenue: number
  yearRevenue: number
  revenueChange: number
  occupancyRate: number
  pendingIssues: number
  processingIssues: number
  doneIssues: number
  cancelledIssues: number
  unpaidInvoices: number
  unpaidAmount: number
  revenueChart: Array<{
    month: number
    year: number
    monthName: string
    revenue: number
  }>
  invoiceStatus: {
    paid: number
    unpaid: number
    overdue: number
    total: number
  }
  paymentRate: number
  issueStatus: {
    pending: number
    processing: number
    done: number
    cancelled: number
  }
  recentInvoices: Array<{
    id: number
    type: string
    user: string
    room: string
    amount: number
    status: string
    createdAt: string
  }>
  recentIssues: Array<{
    id: number
    type: string
    user: string
    room: string
    title: string
    status: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'DONE':
        return 'text-green-600 bg-green-50'
      case 'UNPAID':
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50'
      case 'OVERDUE':
        return 'text-red-600 bg-red-50'
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50'
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Đã thanh toán'
      case 'UNPAID': return 'Chưa thanh toán'
      case 'OVERDUE': return 'Quá hạn'
      case 'PENDING': return 'Chờ xử lý'
      case 'PROCESSING': return 'Đang xử lý'
      case 'DONE': return 'Hoàn thành'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...stats.revenueChart.map(d => d.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Quản lý và theo dõi hệ thống EZ-Home</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={24} />
            </div>
            {stats.revenueChange !== 0 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                stats.revenueChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stats.revenueChange > 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {Math.abs(stats.revenueChange)}%
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Doanh thu tháng này</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatLargeCurrency(Number(stats.monthlyRevenue))}
            </p>
            <p className="text-xs text-gray-500">
              Cả năm: {formatLargeCurrency(Number(stats.yearRevenue))}
            </p>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ lấp đầy</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.occupancyRate}%</p>
            <p className="text-xs text-gray-500">
              {stats.rentedRooms}/{stats.totalRooms} phòng đang thuê
            </p>
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <AlertTriangle className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Công nợ</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {stats.unpaidInvoices} hóa đơn
            </p>
            <p className="text-xs text-gray-500">
              Tổng: {formatLargeCurrency(Number(stats.unpaidAmount))}
            </p>
          </div>
        </div>

        {/* Pending Issues */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm p-6 border border-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-md">
              <Wrench className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Sự cố cần xử lý</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {stats.pendingIssues + stats.processingIssues}
            </p>
            <p className="text-xs text-gray-500">
              {stats.pendingIssues} chờ xử lý, {stats.processingIssues} đang xử lý
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Doanh thu 6 tháng gần đây</h2>
              <p className="text-sm text-gray-500 mt-1">Tổng doanh thu theo tháng</p>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.revenueChart.map((data, index) => {
              const height = (data.revenue / maxRevenue) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-48">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg transition-all hover:from-green-600 hover:to-emerald-500 cursor-pointer group relative"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {formatLargeCurrency(data.revenue)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 font-medium">
                    {data.monthName}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.year}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Invoice Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trạng thái hóa đơn</h2>
              <p className="text-sm text-gray-500 mt-1">Tỷ lệ thanh toán: {stats.paymentRate}%</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Đã thanh toán</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.invoiceStatus.paid}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.invoiceStatus.paid / stats.invoiceStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-700">Chưa thanh toán</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.invoiceStatus.unpaid}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.invoiceStatus.unpaid / stats.invoiceStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">Quá hạn</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.invoiceStatus.overdue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.invoiceStatus.overdue / stats.invoiceStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Status and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issues Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Trạng thái sự cố</h2>
            <Link href="/admin/maintenance" className="text-sm text-blue-600 hover:text-blue-700">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-600" size={20} />
                <span className="text-sm font-medium text-gray-700">Chờ xử lý</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{stats.issueStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <Wrench className="text-blue-600" size={20} />
                <span className="text-sm font-medium text-gray-700">Đang xử lý</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.issueStatus.processing}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-sm font-medium text-gray-700">Hoàn thành</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.issueStatus.done}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <XCircle className="text-gray-600" size={20} />
                <span className="text-sm font-medium text-gray-700">Đã hủy</span>
              </div>
              <span className="text-lg font-bold text-gray-600">{stats.issueStatus.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Hóa đơn gần đây</h2>
            <Link href="/admin/invoices" className="text-sm text-blue-600 hover:text-blue-700">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentInvoices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có hóa đơn</p>
            ) : (
              stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{invoice.user}</p>
                    <p className="text-xs text-gray-500">Phòng {invoice.room} • {formatCurrency(invoice.amount)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Sự cố gần đây</h2>
            <Link href="/admin/maintenance" className="text-sm text-blue-600 hover:text-blue-700">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentIssues.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có sự cố</p>
            ) : (
              stats.recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{issue.user}</p>
                    <p className="text-xs text-gray-500">Phòng {issue.room}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{issue.title}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(issue.status)}`}>
                    {getStatusLabel(issue.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng cư dân</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalResidents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Phòng trống</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vacantRooms}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tỷ lệ thanh toán</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paymentRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
