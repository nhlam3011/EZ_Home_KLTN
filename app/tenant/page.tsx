'use client'

import { useEffect, useState } from 'react'
import { DollarSign, FileText, MessageSquare, TrendingUp, ArrowRight, Bell } from 'lucide-react'
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
}

export default function TenantDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/tenant/dashboard')
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
        <h1 className="text-2xl font-bold text-primary">Tổng quan</h1>
        <p className="text-secondary mt-1">Quản lý thông tin và thanh toán của bạn</p>
      </div>

      {/* Key Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invoice Card */}
        <div className="card stat-card-blue relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-35 h-35 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary">
                Hóa đơn tháng {data.currentMonth}/{data.currentYear}
              </h3>
              <DollarSign className="text-blue-500" size={24} />
            </div>
            <p className="text-2xl font-bold text-primary mb-2">
              {formatCurrency(data.currentInvoice?.totalAmount || 0)}
            </p>
            <span className={`badge ${
              data.currentInvoice?.status === 'UNPAID' 
                ? 'badge-error' 
                : 'badge-success'
            }`}>
              {data.currentInvoice?.status === 'UNPAID' ? 'Chưa thanh toán' : 'Đã thanh toán'}
            </span>
            <p className="text-xs text-secondary mt-2 mb-4">
              Hạn thanh toán: {formatDate(data.currentInvoice?.createdAt || new Date())}
            </p>
            <div className="mt-auto">
              {data.currentInvoice?.status === 'UNPAID' && (
                <Link
                  href="/tenant/invoices"
                  className="btn btn-primary btn-md w-full"
                >
                  Thanh toán ngay
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Contract Card */}
        <div className="card stat-card-green relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-35 h-35 bg-green-50 dark:bg-green-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary">Hợp đồng thuê</h3>
              <FileText className="text-green-500" size={24} />
            </div>
            <p className="text-lg font-semibold text-primary mb-2">
              {formatDate(data.contract?.endDate || new Date())}
            </p>
            <span className="badge badge-success">
              Đang hiệu lực
            </span>
            <p className="text-xs text-secondary mt-2 mb-4">
              Còn hiệu lực: {getDaysRemaining(data.contract?.endDate || new Date())} ngày
            </p>
            <div className="mt-auto">
              <button 
                onClick={handleRenewContract}
                className="btn btn-secondary btn-md w-full"
              >
                Gia hạn hợp đồng
              </button>
            </div>
          </div>
        </div>

        {/* Messages Card */}
        <div className="card stat-card-purple relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-35 h-35 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary">Tin nhắn</h3>
              <div className="relative">
                <MessageSquare className="text-purple-500 dark:text-purple-400" size={24} />
                {data.unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {data.unreadMessagesCount > 9 ? '9+' : data.unreadMessagesCount}
                  </span>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-primary mb-1">
              {data.unreadMessagesCount || 0} tin mới
            </p>
            <p className="text-sm text-secondary mb-4">
              Tin nhắn từ quản lý
            </p>
            <div className="mt-auto">
              <Link
                href="/tenant/messages"
                className="btn btn-primary btn-md w-full"
              >
                Xem tin nhắn
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utility Costs Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">Chi phí Điện & Nước</h3>
            <select className="input text-sm px-3 py-1 w-auto">
              <option>6 tháng gần nhất</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.utilityCosts?.map((cost, idx) => {
              const maxValue = Math.max(...data.utilityCosts.map(c => Math.max(c.elec, c.water)), 1)
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1 h-48 justify-end">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer group relative"
                      style={{ height: `${(cost.elec / maxValue) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary dark:bg-secondary text-inverse dark:text-primary text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg border border-primary">
                        Điện: {formatCurrency(cost.elec)}
                      </div>
                    </div>
                    <div 
                      className="w-full bg-blue-300 rounded-t transition-all hover:bg-blue-400 cursor-pointer group relative"
                      style={{ height: `${(cost.water / maxValue) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary dark:bg-secondary text-inverse dark:text-primary text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg border border-primary">
                        Nước: {formatCurrency(cost.water)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-semibold">{cost.monthName || `${cost.month}/${cost.year}`}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-primary font-medium">Điện</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 dark:bg-blue-500 rounded-full"></div>
              <span className="text-sm text-primary font-medium">Nước</span>
            </div>
          </div>
        </div>

        {/* Cost Structure Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Cơ cấu chi phí tháng {data.currentMonth}/{data.currentYear}
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90" viewBox="0 0 100 100">
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
                  <p className="text-l font-bold text-primary">
                    {data.currentInvoice 
                      ? formatCurrency(data.currentInvoice.totalAmount || 0).replace('₫', '').trim()
                      : '0 VNĐ'
                    }
                  </p>
                  <p className="text-xs text-secondary font-medium">Tổng cộng</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-primary font-medium">Tiền phòng</span>
              </div>
              <span className="text-sm font-semibold text-primary">{data.costStructure?.room || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <span className="text-sm text-primary font-medium">Dịch vụ & Tiện ích</span>
              </div>
              <span className="text-sm font-semibold text-primary">{data.costStructure?.services || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <span className="text-sm text-primary font-medium">Khác</span>
              </div>
              <span className="text-sm font-semibold text-primary">{data.costStructure?.other || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Hoạt động gần đây</h3>
          <Link href="/tenant/activities" className="text-sm text-primary hover:text-secondary flex items-center gap-1 transition-colors">
            Xem tất cả
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 uppercase">HOẠT ĐỘNG</th>
                <th className="px-4 py-3 uppercase">THỜI GIAN</th>
                <th className="px-4 py-3 uppercase">LOẠI</th>
                <th className="px-4 py-3 uppercase">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivities && data.recentActivities.length > 0 ? (
                data.recentActivities.map((activity, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-primary">{activity.description}</td>
                    <td className="px-4 py-3 text-sm text-secondary">{activity.time}</td>
                    <td className="px-4 py-3 text-sm text-secondary">{activity.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 ${
                        activity.status === 'Thành công' || activity.status === 'Hoàn thành'
                          ? 'text-green-600'
                          : activity.status === 'Đang xử lý' || activity.status === 'Chờ xử lý'
                          ? 'text-orange-600'
                          : activity.status === 'Quá hạn' || activity.status === 'Đã hủy'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-secondary'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          activity.status === 'Thành công' || activity.status === 'Hoàn thành'
                            ? 'bg-green-500'
                            : activity.status === 'Đang xử lý' || activity.status === 'Chờ xử lý'
                            ? 'bg-orange-500'
                            : activity.status === 'Quá hạn' || activity.status === 'Đã hủy'
                            ? 'bg-red-500 dark:bg-red-600'
                            : 'bg-secondary'
                        }`}></span>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-tertiary">
                    Chưa có hoạt động nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
