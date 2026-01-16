'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Eye, Star } from 'lucide-react'
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
      HIGH: { label: 'Cao', className: 'bg-red-100 text-red-700' },
      MEDIUM: { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-700' },
      LOW: { label: 'Thấp', className: 'bg-blue-100 text-blue-700' }
    }
    return severityMap[severity] || { label: severity, className: 'bg-gray-100 text-gray-700' }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700' },
      PROCESSING: { label: 'Đang sửa chữa', className: 'bg-blue-100 text-blue-700' },
      DONE: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-700' }
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sự cố</h1>
          <p className="text-gray-600 mt-1">Theo dõi và báo cáo sự cố trong căn hộ</p>
        </div>
        <Link
          href="/tenant/issues/new"
          className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Gửi báo cáo mới</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">🔍</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Issues Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  NGÀY GỬI
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  TIÊU ĐỀ SỰ CỐ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  MỨC ĐỘ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  TRẠNG THÁI XỬ LÝ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  HÀNH ĐỘNG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedIssues.map((issue) => {
                const severityBadge = getSeverityBadge(issue.severity || 'MEDIUM')
                const statusBadge = getStatusBadge(issue.status)
                const progress = issue.progress || (issue.status === 'DONE' ? 100 : issue.status === 'PROCESSING' ? 80 : 0)

                return (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(issue.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(issue.category || '')}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                          <p className="text-xs text-gray-500">{issue.category || 'Khác'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityBadge.className}`}>
                        {severityBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        {issue.status === 'PROCESSING' && (
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-900 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        )}
                        {issue.status === 'DONE' && (
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {issue.status === 'DONE' ? (
                        <button 
                          onClick={() => handleRate(issue.id)}
                          className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1 transition-colors"
                        >
                          <Star size={16} />
                          <span>Đánh giá</span>
                        </button>
                      ) : (
                        <Link
                          href={`/tenant/issues/${issue.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                        >
                          <Eye size={16} />
                          <span>Chi tiết</span>
                          <span>→</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {issues.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, issues.length)} trong số {issues.length} sự cố
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className={`px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors ${
                    currentPage === pageNum ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : ''
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
