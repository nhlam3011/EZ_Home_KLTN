'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Eye, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'

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
      PENDING: { label: 'Chờ xử lý', className: 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded' },
      PROCESSING: { label: 'Đang sửa chữa', className: 'bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      DONE: { label: 'Hoàn thành', className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded' }
    }
    return statusMap[status] || { label: status, className: 'bg-tertiary text-primary' }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Quản lý sự cố</h1>
          <p className="text-sm sm:text-base text-secondary mt-1">Theo dõi và báo cáo sự cố trong căn hộ</p>
        </div>
        <Link
          href="/tenant/issues/new"
          className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>Gửi báo cáo mới</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative min-w-0">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input px-3 sm:px-4 py-2 text-xs sm:text-sm min-w-[140px] sm:min-w-[160px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang sửa chữa</option>
              <option value="DONE">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table - Desktop */}
      {loading ? (
        <div className="card">
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
            <p className="text-tertiary">Đang tải...</p>
          </div>
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
                            <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${statusBadge.className}`}>
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
                    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${statusBadge.className}`}>
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
                            className={`h-full rounded-full transition-all ${
                              issue.status === 'DONE' 
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
      )}

      {/* Pagination */}
      {issues.length > 0 && (
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
                  className={`btn btn-sm ${
                    currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
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
      )}
    </div>
  )
}
