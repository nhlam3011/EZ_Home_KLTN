'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Download, Search, Eye, Printer, MessageSquare, CheckCircle, AlertTriangle, FileText, Zap, Edit, Trash2 } from 'lucide-react'

interface Invoice {
  id: number
  month: number
  year: number
  amountRoom: number
  amountElec: number
  amountWater: number
  amountService: number
  totalAmount: number
  status: string
  createdAt: Date
  contract: {
    user: {
      fullName: string
    }
    room: {
      name: string
    }
  }
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState(`${new Date().getMonth() + 1}/${new Date().getFullYear()}`)
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchInvoices()
  }, [monthFilter, statusFilter, search])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const [month, year] = monthFilter.split('/')
      const params = new URLSearchParams()
      if (month) params.append('month', month)
      if (year) params.append('year', year)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/invoices?${params.toString()}`)
      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu hóa đơn này đã thanh toán? (Thanh toán tiền mặt)')) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'PAID' })
      })

      if (response.ok) {
        await fetchInvoices()
        alert('Đã đánh dấu hóa đơn là đã thanh toán')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Có lỗi xảy ra khi cập nhật hóa đơn')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Có lỗi xảy ra khi cập nhật hóa đơn. Vui lòng thử lại.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.')) {
      return
    }

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchInvoices()
        alert('Đã xóa hóa đơn thành công')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Có lỗi xảy ra khi xóa hóa đơn')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Có lỗi xảy ra khi xóa hóa đơn. Vui lòng thử lại.')
    }
  }

  const handleEdit = (invoiceId: number) => {
    try {
      router.push(`/admin/invoices/${invoiceId}/edit`)
    } catch (error) {
      console.error('Error navigating to edit page:', error)
      alert('Có lỗi xảy ra khi chuyển đến trang chỉnh sửa')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      UNPAID: { label: 'Chưa thanh toán', className: 'bg-yellow-100 text-yellow-700' },
      PAID: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
      OVERDUE: { label: 'Quá hạn', className: 'bg-red-100 text-red-700' }
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1)
  }

  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      options.push(`${month}/${year}`)
    }
    return options
  }

  const handleExport = async () => {
    try {
      const [month, year] = monthFilter.split('/')
      const params = new URLSearchParams()
      if (month) params.append('month', month)
      if (year) params.append('year', year)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/invoices/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Hoa-don-${month}-${year}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Không thể xuất file. Vui lòng thử lại sau.')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Có lỗi xảy ra khi xuất file')
    }
  }

  const handleSendMessage = async (invoiceId: number) => {
    const message = prompt('Nhập tin nhắn nhắc nhở thanh toán:')
    if (message && message.trim()) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        })

        if (response.ok) {
          alert('Tin nhắn đã được gửi đến khách thuê!')
        } else {
          const error = await response.json()
          alert(error.error || 'Có lỗi xảy ra khi gửi tin nhắn')
        }
      } catch (error) {
        console.error('Error sending message:', error)
        alert('Có lỗi xảy ra khi gửi tin nhắn')
      }
    }
  }

  const handleViewInvoice = (invoiceId: number) => {
    window.open(`/admin/invoices/${invoiceId}`, '_blank')
  }

  const handlePrintInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        alert('Không thể in hóa đơn. Vui lòng thử lại sau.')
      }
    } catch (error) {
      console.error('Error printing invoice:', error)
      alert('Có lỗi xảy ra khi in hóa đơn')
    }
  }

  const totalPages = Math.ceil(invoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = invoices.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/invoices"
            className="px-4 py-3 text-sm font-medium border-b-2 border-[#1e3a5f] text-[#1e3a5f] transition-colors"
          >
            <FileText size={18} className="inline mr-2" />
            Danh sách hóa đơn
          </Link>
          <Link
            href="/admin/finance"
            className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Zap size={18} className="inline mr-2" />
            Chốt điện nước
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Hóa đơn</h1>
            <p className="text-gray-600 mt-1">Danh sách hóa đơn và thanh toán</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Download size={18} />
              <span>Xuất Excel</span>
            </button>
            <Link
              href="/admin/invoices/new"
              className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Tạo hóa đơn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">KỲ THANH TOÁN:</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            >
              {generateMonthOptions().map(option => (
                <option key={option} value={option}>
                  Tháng {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">TÒA NHÀ:</label>
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
              <option>Tất cả tòa nhà</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">TRẠNG THÁI:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="OVERDUE">Quá hạn</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách hoặc số phòng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center align-middle">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase align-middle">
                  MÃ HD
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase align-middle">
                  PHÒNG / TÒA
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase align-middle">
                  KHÁCH THUÊ
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase align-middle">
                  KỲ TT
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase align-middle">
                  TIỀN PHÒNG
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase align-middle">
                  TIỀN ĐIỆN
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase align-middle">
                  TIỀN NƯỚC
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase align-middle">
                  DỊCH VỤ
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase align-middle">
                  TỔNG TIỀN
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase align-middle">
                  HẠN TT
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase align-middle">
                  TRẠNG THÁI
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase align-middle">
                  HÀNH ĐỘNG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedInvoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status)
                const initials = getInitials(invoice.contract.user.fullName)
                const isOverdue = invoice.status === 'OVERDUE'

                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-center align-middle">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm font-medium text-gray-900">
                        #INV-{invoice.id.toString().padStart(3, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm text-gray-900">
                        {invoice.contract.room.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-sm text-gray-900 truncate max-w-[150px]">{invoice.contract.user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <span className="text-sm text-gray-600">
                        {invoice.month}/{invoice.year}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-gray-900">
                        {formatCurrency(Number(invoice.amountRoom || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-gray-900">
                        {formatCurrency(Number(invoice.amountElec || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-gray-900">
                        {formatCurrency(Number(invoice.amountWater || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-gray-900">
                        {formatCurrency(Number(invoice.amountService || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(invoice.totalAmount))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(invoice.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-1">
                        {invoice.status === 'UNPAID' && (
                          <>
                            <button 
                              type="button"
                              onClick={() => handleSendMessage(invoice.id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Gửi tin nhắn"
                            >
                              <MessageSquare size={18} className="text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Đánh dấu đã thanh toán (tiền mặt)"
                            >
                              <CheckCircle size={18} className="text-green-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} className="text-blue-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </>
                        )}
                        {invoice.status === 'PAID' && (
                          <>
                            <button 
                              type="button"
                              onClick={() => handleViewInvoice(invoice.id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} className="text-gray-600" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handlePrintInvoice(invoice.id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="In hóa đơn"
                            >
                              <Printer size={18} className="text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} className="text-blue-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </>
                        )}
                        {invoice.status === 'OVERDUE' && (
                          <>
                            <button 
                              type="button"
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Quá hạn"
                            >
                              <AlertTriangle size={18} className="text-red-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Đánh dấu đã thanh toán (tiền mặt)"
                            >
                              <CheckCircle size={18} className="text-green-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} className="text-blue-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {invoices.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">
            Hiển thị {startIndex + 1} đến {Math.min(endIndex, invoices.length)} trong số {invoices.length} hóa đơn
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              if (pageNum > totalPages) return null
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
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-2">...</span>
            )}
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
