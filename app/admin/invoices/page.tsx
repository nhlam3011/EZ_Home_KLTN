'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Download, Search, Eye, Printer, MessageSquare, CheckCircle, AlertTriangle, FileText, Zap, Edit, Trash2, Upload } from 'lucide-react'

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
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [monthFilter, statusFilter, search])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (monthFilter !== 'all') {
        const [month, year] = monthFilter.split('/')
        if (month) params.append('month', month)
        if (year) params.append('year', year)
      }
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
      UNPAID: { label: 'Chưa thanh toán', className: 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 font-semibold' },
      PAID: { label: 'Đã thanh toán', className: 'badge badge-success' },
      OVERDUE: { label: 'Quá hạn', className: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 font-semibold' }
    }
    return statusMap[status] || { label: status, className: 'bg-tertiary text-primary' }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1)
  }

  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    // Include 12 months in the past and 12 months in the future
    for (let i = 12; i >= -12; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      options.push(`${month}/${year}`)
    }
    return options
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (monthFilter !== 'all') {
        const [month, year] = monthFilter.split('/')
        if (month) params.append('month', month)
        if (year) params.append('year', year)
      }
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/invoices/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fileName = monthFilter !== 'all' 
          ? `Hoa-don-${monthFilter.replace('/', '-')}.xlsx`
          : `Hoa-don-tat-ca.xlsx`
        a.download = fileName
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
        const html = await response.text()
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          // Wait for content to load then print
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
      } else {
        alert('Không thể in hóa đơn. Vui lòng thử lại sau.')
      }
    } catch (error) {
      console.error('Error printing invoice:', error)
      alert('Có lỗi xảy ra khi in hóa đơn')
    }
  }

  const handleImportExcel = async () => {
    if (!importFile) {
      alert('Vui lòng chọn file Excel để nhập')
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/invoices/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${data.message}\n\nChi tiết:\n- Thành công: ${data.results.success}\n- Thất bại: ${data.results.failed}${data.results.errors.length > 0 ? '\n\nLỗi:\n' + data.results.errors.slice(0, 10).join('\n') + (data.results.errors.length > 10 ? `\n... và ${data.results.errors.length - 10} lỗi khác` : '') : ''}`)
        setShowImportModal(false)
        setImportFile(null)
        fetchInvoices()
      } else {
        alert(data.error || 'Có lỗi xảy ra khi nhập file')
      }
    } catch (error) {
      console.error('Error importing:', error)
      alert('Có lỗi xảy ra khi nhập file')
    } finally {
      setImporting(false)
    }
  }

  const totalPages = Math.ceil(invoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = invoices.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-primary">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/invoices"
            className="px-4 py-3 text-sm font-medium border-b-2 border-accent-blue text-accent-blue transition-colors"
          >
            <FileText size={18} className="inline mr-2" />
            Danh sách hóa đơn
          </Link>
          <Link
            href="/admin/finance"
            className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-secondary hover:text-primary transition-colors"
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
            <h1 className="text-2xl font-bold text-primary">Quản lý Hóa đơn</h1>
            <p className="text-secondary mt-1">Danh sách hóa đơn và thanh toán</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary btn-md"
            >
              <Upload size={18} />
              <span>Nhập Excel</span>
            </button>
            <button 
              onClick={handleExport}
              className="btn btn-secondary btn-md"
            >
              <Download size={18} />
              <span>Xuất Excel</span>
            </button>
            <Link
              href="/admin/invoices/new"
              className="btn btn-primary btn-md"
            >
              <Plus size={18} />
              <span>Tạo hóa đơn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary whitespace-nowrap text-center flex items-center mb-0">KỲ THANH TOÁN:</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input px-4 py-2 text-sm"
            >
              <option value="all">Tất cả</option>
              {generateMonthOptions().map(option => (
                <option key={option} value={option}>
                  Tháng {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary whitespace-nowrap text-center flex items-center mb-0">TÒA NHÀ:</label>
            <select className="input px-4 py-2 text-sm">
              <option>Tất cả tòa nhà</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary whitespace-nowrap text-center flex items-center mb-0">TRẠNG THÁI:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input px-4 py-2 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="OVERDUE">Quá hạn</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách hoặc số phòng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-tertiary">Đang tải...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-tertiary border-b border-primary">
              <tr>
                <th className="px-4 py-3 text-center align-middle">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                  MÃ HD
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                  PHÒNG / TÒA
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                  KHÁCH THUÊ
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                  KỲ TT
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase align-middle">
                  TIỀN PHÒNG
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase align-middle">
                  TIỀN ĐIỆN
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase align-middle">
                  TIỀN NƯỚC
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase align-middle">
                  DỊCH VỤ
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase align-middle">
                  TỔNG TIỀN
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                  HẠN TT
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                  TRẠNG THÁI
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                  HÀNH ĐỘNG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary">
              {paginatedInvoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status)
                const initials = getInitials(invoice.contract.user.fullName)
                const isOverdue = invoice.status === 'OVERDUE'

                return (
                  <tr key={invoice.id} className="hover:bg-tertiary">
                    <td className="px-4 py-4 text-center align-middle">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm font-medium text-primary">
                        #INV-{invoice.id.toString().padStart(3, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm text-primary">
                        {invoice.contract.room.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-sm text-primary truncate max-w-[150px]">{invoice.contract.user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <span className="text-sm text-secondary">
                        {invoice.month}/{invoice.year}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-primary">
                        {formatCurrency(Number(invoice.amountRoom || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-primary">
                        {formatCurrency(Number(invoice.amountElec || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-primary">
                        {formatCurrency(Number(invoice.amountWater || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm text-primary">
                        {formatCurrency(Number(invoice.amountService || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(Number(invoice.totalAmount))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-secondary'}`}>
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
                              className="btn btn-ghost btn-icon"
                              title="Gửi tin nhắn"
                            >
                              <MessageSquare size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Đánh dấu đã thanh toán (tiền mặt)"
                            >
                              <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Xóa"
                            >
                              <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                            </button>
                          </>
                        )}
                        {invoice.status === 'PAID' && (
                          <>
                            <button 
                              type="button"
                              onClick={() => handleViewInvoice(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handlePrintInvoice(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="In hóa đơn"
                            >
                              <Printer size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Xóa"
                            >
                              <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                            </button>
                          </>
                        )}
                        {invoice.status === 'OVERDUE' && (
                          <>
                            <button 
                              type="button"
                              className="btn btn-ghost btn-icon"
                              title="Quá hạn"
                            >
                              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Đánh dấu đã thanh toán (tiền mặt)"
                            >
                              <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Xóa"
                            >
                              <Trash2 size={18} className="text-red-600 dark:text-red-400" />
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
        <div className="flex items-center justify-between card p-4">
          <p className="text-sm text-secondary">
            Hiển thị {startIndex + 1} đến {Math.min(endIndex, invoices.length)} trong số {invoices.length} hóa đơn
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
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
                  className={`btn btn-sm ${
                    currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-2 text-secondary">...</span>
            )}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary">Nhập hóa đơn từ Excel</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }}
                  className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-primary mb-2">
                  Chọn file Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImportFile(file)
                    }
                  }}
                  className="input w-full"
                />
                <p className="text-xs text-tertiary mt-2">
                  File Excel cần có các cột: Phòng, Khách thuê, Kỳ TT (MM/YYYY), Tiền phòng, Tiền điện, Tiền nước, Dịch vụ, Dịch vụ chung
                </p>
              </div>

              {importFile && (
                <div className="mb-4 p-3 bg-tertiary rounded-lg">
                  <p className="text-sm text-primary">
                    <strong>File đã chọn:</strong> {importFile.name}
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Kích thước: {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleImportExcel}
                  disabled={!importFile || importing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Đang nhập...' : 'Nhập dữ liệu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }}
                  className="flex-1 px-4 py-2 border border-primary text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
