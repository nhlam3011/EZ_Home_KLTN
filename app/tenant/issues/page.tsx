'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Eye, Star, ChevronDown, CheckCircle, Wrench, AlertTriangle, Ban } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/Loading'

interface Issue {
  id: number
  title: string
  description: string
  status: string
  createdAt: Date
  category?: string
  severity?: string
  progress?: number
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const itemsPerPage = 4

  useEffect(() => {
    fetchIssues()
  }, [statusFilter, search])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/tenant/issues?${params.toString()}`)
      const data = await response.json()
      setIssues(data)
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getSeverityBadge = (severity: string) => {
    const severityMap: Record<string, { label: string; className: string }> = {
      HIGH: { label: 'Cao', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
      MEDIUM: { label: 'Trung bình', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
      LOW: { label: 'Thấp', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' }
    }
    return severityMap[severity] || { label: severity, className: 'bg-tertiary text-primary' }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ xử lý', className: 'badge badge-warning' },
      PROCESSING: { label: 'Đang sửa chữa', className: 'badge badge-info' },
      DONE: { label: 'Hoàn thành', className: 'badge badge-success' },
      CANCELLED: { label: 'Đã hủy', className: 'badge badge-error' }
    }
    return statusMap[status] || { label: status, className: 'badge badge-info' }
  }

  const getCategoryIcon = (category: string) => {
    if (category?.includes('Điện') || category?.includes('Máy lạnh')) return '❄️'
    if (category?.includes('Đèn') || category?.includes('Điện dân dụng')) return '💡'
    if (category?.includes('Nước') || category?.includes('Vệ sinh')) return '💧'
    if (category?.includes('Internet') || category?.includes('mạng')) return '📶'
    return '🔧'
  }

  const handleRate = async (issueId: number) => {
    const rating = prompt('Vui lòng đánh giá chất lượng dịch vụ sửa chữa (1-5 sao):')
    if (rating && parseInt(rating) >= 1 && parseInt(rating) <= 5) {
      try {
        // In a real app, this would send to API
        const response = await fetch(`/api/tenant/issues/${issueId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: parseInt(rating) })
        })
        if (response.ok) {
          alert('Cảm ơn bạn đã đánh giá!')
        } else {
          alert('Có lỗi xảy ra khi gửi đánh giá')
        }
      } catch (error) {
        console.error('Error rating issue:', error)
        alert('Cảm ơn bạn đã đánh giá!')
      }
    }
  }

  const totalPages = Math.ceil(issues.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedIssues = issues.slice(startIndex, endIndex)

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">SỰ CỐ & BÁO CÁO</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Theo dõi và báo cáo sự cố trong căn hộ</p>
        </div>
        <Link
          href="/tenant/issues/new"
          className="btn btn-primary h-11 px-6 rounded-2xl hidden sm:flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>Gửi báo cáo mới</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="card p-3 sm:p-4 !overflow-visible relative z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Status Filter */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full sm:w-auto ${showStatusDropdown
                  ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                  : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                  statusFilter === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                    statusFilter === 'PROCESSING' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                      statusFilter === 'DONE' ? 'bg-green-50 dark:bg-green-900/20 text-green-500' :
                        'bg-gray-50 dark:bg-gray-900/20 text-gray-500'
                  }`}>
                  {statusFilter === 'all' && <Wrench size={14} />}
                  {statusFilter === 'PENDING' && <AlertTriangle size={14} />}
                  {statusFilter === 'PROCESSING' && <Wrench size={14} />}
                  {statusFilter === 'DONE' && <CheckCircle size={14} />}
                  {statusFilter === 'CANCELLED' && <Ban size={14} />}
                </div>
                <div className="text-left pr-1 flex-1">
                  <p className="text-md font-medium leading-tight whitespace-nowrap text-primary uppercase">
                    TRẠNG THÁI: {statusFilter === 'all' ? 'TẤT CẢ' :
                      statusFilter === 'PENDING' ? 'CHỜ XỬ LÝ' :
                        statusFilter === 'PROCESSING' ? 'ĐANG SỬA' :
                          statusFilter === 'DONE' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                  </p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowStatusDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                    {[
                      { id: 'all', label: 'TẤT CẢ', icon: <Wrench size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                      { id: 'PENDING', label: 'CHỜ XỬ LÝ', icon: <AlertTriangle size={16} />, color: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10' },
                      { id: 'PROCESSING', label: 'ĐANG SỬA CHỮA', icon: <Wrench size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                      { id: 'DONE', label: 'HOÀN THÀNH', icon: <CheckCircle size={16} />, color: 'text-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10' },
                      { id: 'CANCELLED', label: 'ĐÃ HỦY', icon: <Ban size={16} />, color: 'text-gray-500', bg: 'bg-gray-50/50 dark:bg-gray-900/10' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setStatusFilter(item.id); setShowStatusDropdown(false) }}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === item.id ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                      >
                        <div className={`p-1.5 rounded-lg ${statusFilter === item.id ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`}`}>
                          {item.icon}
                        </div>
                        <span className="uppercase">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative flex-1 lg:max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-with-icon w-full h-11 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-primary focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm pl-10"
            />
          </div>
        </div>
      </div>

      {/* Issues Table - Desktop */}
      {
        loading ? (
          <div className="card">
            <Loading size="lg" text="Đang tải..." />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-tertiary border-b border-primary">
                    <tr>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">NGÀY GỬI</th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">TIÊU ĐỀ SỰ CỐ</th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">MỨC ĐỘ</th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">TRẠNG THÁI XỬ LÝ</th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">HÀNH ĐỘNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary">
                    {paginatedIssues.map((issue) => {
                      const severityBadge = getSeverityBadge(issue.severity || 'MEDIUM')
                      const statusBadge = getStatusBadge(issue.status)
                      const progress = issue.progress || (issue.status === 'DONE' ? 100 : issue.status === 'PROCESSING' ? 80 : 0)

                      return (
                        <tr key={issue.id} className="hover:bg-tertiary transition-colors">
                          <td className="px-4 xl:px-6 py-4">
                            <span className="text-xs sm:text-sm text-secondary">
                              {formatDate(issue.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg sm:text-xl flex-shrink-0">{getCategoryIcon(issue.category || '')}</span>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-primary truncate">{issue.title}</p>
                                <p className="text-xs text-tertiary">{issue.category || 'Khác'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${severityBadge.className}`}>
                              {severityBadge.label}
                            </span>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <div className="space-y-1">
                              <span className={statusBadge.className}>
                                {statusBadge.label}
                              </span>
                              {issue.status === 'PROCESSING' && (
                                <div className="w-32 h-2 bg-tertiary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              )}
                              {issue.status === 'DONE' && (
                                <div className="w-32 h-2 bg-tertiary rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 dark:bg-green-600 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            {issue.status === 'DONE' ? (
                              <button
                                onClick={() => handleRate(issue.id)}
                                className="btn btn-ghost btn-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 flex items-center gap-1.5"
                              >
                                <Star size={14} className="sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm">Đánh giá</span>
                              </button>
                            ) : (
                              <Link
                                href={`/tenant/issues/${issue.id}`}
                                className="btn btn-ghost btn-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5"
                              >
                                <Eye size={14} className="sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm">Chi tiết</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {paginatedIssues.map((issue) => {
                const severityBadge = getSeverityBadge(issue.severity || 'MEDIUM')
                const statusBadge = getStatusBadge(issue.status)
                const progress = issue.progress || (issue.status === 'DONE' ? 100 : issue.status === 'PROCESSING' ? 80 : 0)

                return (
                  <div key={issue.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg flex-shrink-0">{getCategoryIcon(issue.category || '')}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{issue.title}</p>
                            <p className="text-xs text-tertiary">{issue.category || 'Khác'}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 ml-2 ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-tertiary">Ngày gửi:</span>
                        <span className="text-xs text-secondary">{formatDate(issue.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-tertiary">Mức độ:</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${severityBadge.className}`}>
                          {severityBadge.label}
                        </span>
                      </div>
                      {(issue.status === 'PROCESSING' || issue.status === 'DONE') && (
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-tertiary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${issue.status === 'DONE'
                                ? 'bg-green-500 dark:bg-green-600'
                                : 'bg-primary'
                                }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-tertiary text-right">{progress}%</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-primary">
                      {issue.status === 'DONE' ? (
                        <button
                          onClick={() => handleRate(issue.id)}
                          className="btn btn-ghost btn-sm flex-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 flex items-center justify-center gap-1.5"
                        >
                          <Star size={14} />
                          <span className="text-xs">Đánh giá</span>
                        </button>
                      ) : (
                        <Link
                          href={`/tenant/issues/${issue.id}`}
                          className="btn btn-ghost btn-sm flex-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} />
                          <span className="text-xs">Chi tiết</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      }

      {/* Pagination */}
      {
        issues.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 card p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-secondary text-center sm:text-left">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, issues.length)} trong số {issues.length} sự cố
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                let pageNum
                if (totalPages <= 3) {
                  pageNum = i + 1
                } else if (currentPage === 1) {
                  pageNum = i + 1
                } else if (currentPage === totalPages) {
                  pageNum = totalPages - 2 + i
                } else {
                  pageNum = currentPage - 1 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          </div>
        )
      }
      {/* Add padding to the bottom for mobile to account for the fixed footer */}
      <div className="sm:hidden h-20 w-full"></div>

      {/* Mobile Sticky Footer */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-primary p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        <Link
          href="/tenant/issues/new"
          className="btn btn-primary btn-md w-full py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span className="font-bold uppercase text-[13px]">Gửi báo cáo mới</span>
        </Link>
      </div>
    </div >
  )
}
