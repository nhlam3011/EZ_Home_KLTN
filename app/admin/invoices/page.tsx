'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Download, Search, Eye, Printer, MessageSquare, CheckCircle, AlertTriangle, FileText, Zap, Edit, Trash2, Upload, MoreVertical, X } from 'lucide-react'

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
  paymentDueDate: Date
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
  const pathname = usePathname()
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
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

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
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setInvoices(data)
      } else {
        console.error('API returned non-array data:', data)
        setInvoices([])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setInvoices([]) // Set to empty array on error
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
      UNPAID: { label: 'Chưa thanh toán', className: 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded' },
      PAID: { label: 'Đã thanh toán', className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      OVERDUE: { label: 'Quá hạn', className: 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded' }
    }
    return statusMap[status] || { label: status, className: 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded' }
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

  const handleViewInvoice = async (invoiceId: number) => {
    setLoadingDetail(true)
    setShowViewModal(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedInvoiceDetail(data)
      } else {
        alert('Không thể tải chi tiết hóa đơn')
        setShowViewModal(false)
      }
    } catch (error) {
      console.error('Error fetching invoice detail:', error)
      alert('Có lỗi xảy ra khi tải chi tiết hóa đơn')
      setShowViewModal(false)
    } finally {
      setLoadingDetail(false)
    }
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

  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : []
  const totalPages = Math.ceil(invoicesArray.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = invoicesArray.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Tài chính</h1>
        <p className="text-sm sm:text-base text-secondary mt-1">Quản lý hóa đơn và chốt điện nước</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
          <Link
            href="/admin/invoices"
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              pathname === '/admin/invoices'
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <FileText size={18} className="inline mr-1 sm:mr-2" />
            Danh sách hóa đơn
          </Link>
          <Link
            href="/admin/finance"
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              pathname === '/admin/finance'
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Zap size={18} className="inline mr-1 sm:mr-2" />
            Chốt điện nước
          </Link>
        </div>
      </div>

      {/* Content */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-primary">Quản lý Hóa đơn</h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">Danh sách hóa đơn và thanh toán</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary btn-sm sm:btn-md flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]"
            >
              <Upload size={18} />
              <span className="text-xs sm:text-sm">Nhập Excel</span>
            </button>
            <button 
              onClick={handleExport}
              className="btn btn-secondary btn-sm sm:btn-md flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]"
            >
              <Download size={18} />
              <span className="text-xs sm:text-sm">Xuất Excel</span>
            </button>
            <Link
              href="/admin/invoices/new"
              className="btn btn-primary btn-sm sm:btn-md flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]"
            >
              <Plus size={18} />
              <span className="text-xs sm:text-sm">Tạo hóa đơn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-xs sm:text-sm text-secondary whitespace-nowrap font-medium">KỲ THANH TOÁN:</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm w-full sm:w-auto"
            >
              <option value="all">Tất cả</option>
              {generateMonthOptions().map(option => (
                <option key={option} value={option}>
                  Tháng {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-xs sm:text-sm text-secondary whitespace-nowrap font-medium">TÒA NHÀ:</label>
            <select className="input px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm w-full sm:w-auto">
              <option>Tất cả tòa nhà</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-xs sm:text-sm text-secondary whitespace-nowrap font-medium">TRẠNG THÁI:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm w-full sm:w-auto"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="OVERDUE">Quá hạn</option>
            </select>
          </div>
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm"
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
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-tertiary border-b border-primary">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center align-middle w-12">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle min-w-[100px]">
                    MÃ HD
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle min-w-[120px]">
                    PHÒNG / TÒA
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle hidden md:table-cell min-w-[150px]">
                    KHÁCH THUÊ
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle min-w-[80px]">
                    KỲ TT
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-secondary uppercase align-middle hidden lg:table-cell min-w-[120px]">
                    TIỀN PHÒNG
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-secondary uppercase align-middle hidden lg:table-cell min-w-[120px]">
                    TIỀN ĐIỆN
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-secondary uppercase align-middle hidden lg:table-cell min-w-[120px]">
                    TIỀN NƯỚC
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-secondary uppercase align-middle hidden lg:table-cell min-w-[120px]">
                    DỊCH VỤ
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-secondary uppercase align-middle min-w-[130px]">
                    TỔNG TIỀN
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle hidden md:table-cell min-w-[100px]">
                    HẠN TT
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle min-w-[120px]">
                    TRẠNG THÁI
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle min-w-[160px]">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-primary">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-tertiary" />
                      <p className="text-sm text-tertiary font-medium">Không có hóa đơn nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status)
                const initials = getInitials(invoice.contract.user.fullName)
                const isOverdue = invoice.status === 'OVERDUE'

                return (
                  <tr key={invoice.id} className="hover:bg-tertiary transition-colors">
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center align-middle">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                      <span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">
                        #INV-{invoice.id.toString().padStart(3, '0')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                      <div>
                        <span className="text-xs sm:text-sm text-primary font-medium">
                          {invoice.contract.room.name}
                        </span>
                        <div className="md:hidden mt-1.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-[10px]">{initials}</span>
                            </div>
                            <span className="text-xs text-primary truncate">{invoice.contract.user.fullName}</span>
                          </div>
                          <div className="text-xs text-secondary">
                            {invoice.month}/{invoice.year}
                          </div>
                          <div className="lg:hidden space-y-0.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-tertiary">Phòng:</span>
                              <span className="text-primary">{formatCurrency(Number(invoice.amountRoom || 0))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-tertiary">Điện:</span>
                              <span className="text-primary">{formatCurrency(Number(invoice.amountElec || 0))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-tertiary">Nước:</span>
                              <span className="text-primary">{formatCurrency(Number(invoice.amountWater || 0))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-tertiary">Dịch vụ:</span>
                              <span className="text-primary">{formatCurrency(Number(invoice.amountService || 0))}</span>
                            </div>
                          </div>
                          <div className="md:hidden mt-1">
                            <span className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-secondary'}`}>
                              Hạn: {formatDate(invoice.paymentDueDate || invoice.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-sm text-primary truncate max-w-[150px]">{invoice.contract.user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center align-middle">
                      <span className="text-xs sm:text-sm text-secondary whitespace-nowrap">
                        {invoice.month}/{invoice.year}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right align-middle hidden lg:table-cell">
                      <span className="text-xs sm:text-sm text-primary whitespace-nowrap">
                        {formatCurrency(Number(invoice.amountRoom || 0))}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right align-middle hidden lg:table-cell">
                      <span className="text-xs sm:text-sm text-primary whitespace-nowrap">
                        {formatCurrency(Number(invoice.amountElec || 0))}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right align-middle hidden lg:table-cell">
                      <span className="text-xs sm:text-sm text-primary whitespace-nowrap">
                        {formatCurrency(Number(invoice.amountWater || 0))}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right align-middle hidden lg:table-cell">
                      <span className="text-xs sm:text-sm text-primary whitespace-nowrap">
                        {formatCurrency(Number(invoice.amountService || 0))}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right align-middle">
                      <span className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(Number(invoice.totalAmount))}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center align-middle hidden md:table-cell">
                      <span className={`text-xs sm:text-sm whitespace-nowrap ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-secondary'}`}>
                        {formatDate(invoice.paymentDueDate || invoice.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center align-middle">
                      <span
                        className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center align-middle">
                      {/* Desktop: Show all buttons */}
                      <div className="hidden md:flex items-center justify-center gap-1">
                        {invoice.status === 'UNPAID' && (
                          <>
                            <button 
                              type="button"
                              onClick={() => handleSendMessage(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Gửi tin nhắn"
                            >
                              <MessageSquare size={16} className="w-[18px] h-[18px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Đánh dấu đã thanh toán (tiền mặt)"
                            >
                              <CheckCircle size={16} className="w-[18px] h-[18px] text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Chỉnh sửa"
                            >
                              <Edit size={16} className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Xóa"
                            >
                              <Trash2 size={16} className="w-[18px] h-[18px] text-red-600 dark:text-red-400" />
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
                              <Eye size={16} className="w-[18px] h-[18px]" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handlePrintInvoice(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="In hóa đơn"
                            >
                              <Printer size={16} className="w-[18px] h-[18px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Chỉnh sửa"
                            >
                              <Edit size={16} className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Xóa"
                            >
                              <Trash2 size={16} className="w-[18px] h-[18px] text-red-600 dark:text-red-400" />
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
                              <AlertTriangle size={16} className="w-[18px] h-[18px] text-red-600 dark:text-red-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Đánh dấu đã thanh toán (tiền mặt)"
                            >
                              <CheckCircle size={16} className="w-[18px] h-[18px] text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Chỉnh sửa"
                            >
                              <Edit size={16} className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="btn btn-ghost btn-icon"
                              title="Xóa"
                            >
                              <Trash2 size={16} className="w-[18px] h-[18px] text-red-600 dark:text-red-400" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Mobile: Dropdown menu */}
                      <div className="md:hidden relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(openDropdownId === invoice.id ? null : invoice.id)}
                          className="btn btn-ghost btn-icon"
                          title="Thao tác"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openDropdownId === invoice.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-primary border border-primary rounded-lg shadow-lg z-20">
                              {invoice.status === 'UNPAID' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSendMessage(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <MessageSquare size={16} />
                                    Gửi tin nhắn
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleMarkAsPaid(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                                    Đánh dấu đã thanh toán
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleEdit(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <Edit size={16} className="text-blue-600 dark:text-blue-400" />
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDelete(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 size={16} />
                                    Xóa
                                  </button>
                                </>
                              )}
                              {invoice.status === 'PAID' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleViewInvoice(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <Eye size={16} />
                                    Xem chi tiết
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePrintInvoice(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <Printer size={16} />
                                    In hóa đơn
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleEdit(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <Edit size={16} className="text-blue-600 dark:text-blue-400" />
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDelete(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 size={16} />
                                    Xóa
                                  </button>
                                </>
                              )}
                              {invoice.status === 'OVERDUE' && (
                                <>
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                    disabled
                                  >
                                    <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                                    Quá hạn
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleMarkAsPaid(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                                    Đánh dấu đã thanh toán
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleEdit(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors"
                                  >
                                    <Edit size={16} className="text-blue-600 dark:text-blue-400" />
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDelete(invoice.id)
                                      setOpenDropdownId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2 transition-colors text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 size={16} />
                                    Xóa
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              }))}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {invoices.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 card p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-secondary">
            Hiển thị {startIndex + 1} đến {Math.min(endIndex, invoices.length)} trong số {invoices.length} hóa đơn
          </p>
          <div className="flex items-center gap-2 flex-wrap">
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

      {/* View Invoice Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-primary rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary">
              <h2 className="text-lg sm:text-xl font-bold text-primary">Chi tiết hóa đơn</h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedInvoiceDetail(null)
                }}
                className="p-2 hover:bg-tertiary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : selectedInvoiceDetail ? (
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="border-b border-primary pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-primary">EZ-Home Management</h3>
                        <p className="text-xs sm:text-sm text-secondary mt-1">59 - Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội</p>
                        <p className="text-xs sm:text-sm text-secondary">Hotline: 1900 1234</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <h3 className="text-xl sm:text-2xl font-bold text-primary mb-2">HÓA ĐƠN</h3>
                        <p className="text-xs sm:text-sm text-secondary">Mã HĐ: INV-{selectedInvoiceDetail.id.toString().padStart(6, '0')}</p>
                        <p className="text-xs sm:text-sm text-secondary">Ngày lập: {formatDate(selectedInvoiceDetail.createdAt)}</p>
                        <p className={`text-xs sm:text-sm font-medium mt-1 ${
                          selectedInvoiceDetail.status === 'UNPAID' || selectedInvoiceDetail.status === 'OVERDUE' 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-secondary'
                        }`}>
                          Hạn thanh toán: {formatDate(selectedInvoiceDetail.paymentDueDate || selectedInvoiceDetail.createdAt)}
                        </p>
                        <span className={`inline-block mt-2 text-xs font-medium px-1.5 py-0.5 rounded ${
                          selectedInvoiceDetail.status === 'UNPAID' 
                            ? 'bg-warning-soft border border-warning-subtle text-warning' 
                            : selectedInvoiceDetail.status === 'PAID'
                            ? 'bg-success-soft border border-success-subtle text-fg-success-strong'
                            : 'bg-danger-soft border border-danger-subtle text-fg-danger-strong'
                        }`}>
                          {selectedInvoiceDetail.status === 'UNPAID' ? 'Chưa thanh toán' : selectedInvoiceDetail.status === 'PAID' ? 'Đã thanh toán' : 'Quá hạn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tenant Info */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2">NGƯỜI NHẬN</h4>
                    <div className="bg-tertiary p-3 sm:p-4 rounded-lg border border-primary">
                      <p className="text-xs sm:text-sm text-primary font-medium">{selectedInvoiceDetail.contract?.user?.fullName || 'N/A'}</p>
                      <p className="text-xs sm:text-sm text-secondary mt-1">
                        Phòng {selectedInvoiceDetail.contract?.room?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Payment Period */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-primary mb-3">KỲ THANH TOÁN</h4>
                    <div className="bg-tertiary border border-primary rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="font-semibold text-primary">Tháng {selectedInvoiceDetail.month} / {selectedInvoiceDetail.year}</span>
                      </div>
                    </div>
                  </div>

                  {/* Services Table */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-primary mb-3">DỊCH VỤ</h4>
                    <div className="overflow-x-auto">
                      <table className="table min-w-full">
                        <thead>
                          <tr>
                            <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap text-left">DỊCH VỤ</th>
                            <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap text-right">THÀNH TIỀN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedInvoiceDetail.amountRoom || 0) > 0 && (
                            <tr>
                              <td className="px-3 sm:px-4 py-3">
                                <p className="text-xs sm:text-sm font-medium text-primary">Tiền Thuê Phòng</p>
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right">
                                {formatCurrency(Number(selectedInvoiceDetail.amountRoom))}
                              </td>
                            </tr>
                          )}
                          {(selectedInvoiceDetail.amountElec || 0) > 0 && (
                            <tr>
                              <td className="px-3 sm:px-4 py-3">
                                <p className="text-xs sm:text-sm font-medium text-primary">Tiền Điện</p>
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right">
                                {formatCurrency(Number(selectedInvoiceDetail.amountElec))}
                              </td>
                            </tr>
                          )}
                          {(selectedInvoiceDetail.amountWater || 0) > 0 && (
                            <tr>
                              <td className="px-3 sm:px-4 py-3">
                                <p className="text-xs sm:text-sm font-medium text-primary">Tiền Nước</p>
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right">
                                {formatCurrency(Number(selectedInvoiceDetail.amountWater))}
                              </td>
                            </tr>
                          )}
                          {(selectedInvoiceDetail.amountService || 0) > 0 && (
                            <tr>
                              <td className="px-3 sm:px-4 py-3">
                                <p className="text-xs sm:text-sm font-medium text-primary">Dịch vụ</p>
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right">
                                {formatCurrency(Number(selectedInvoiceDetail.amountService))}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-primary">
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold text-primary">TỔNG CỘNG</td>
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold text-primary text-right">
                              {formatCurrency(Number(selectedInvoiceDetail.totalAmount))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-secondary">Không thể tải chi tiết hóa đơn</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-primary">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedInvoiceDetail(null)
                }}
                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-tertiary transition-colors"
              >
                Đóng
              </button>
              {selectedInvoiceDetail && (
                <button
                  onClick={() => handlePrintInvoice(selectedInvoiceDetail.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Printer size={18} />
                  In hóa đơn
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
