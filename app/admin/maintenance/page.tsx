'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TextInput, Select, Button, Badge } from 'flowbite-react'
import { Search, Eye, X, Save, XCircle, XCircle as XIcon, User, Calendar, MapPin, AlertCircle, Image as ImageIcon, DollarSign, FileText, Clock, CheckCircle2, XCircle as CancelIcon, Receipt, MoreVertical, Wrench, AlertTriangle, CheckCircle, Ban, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, Check, RotateCcw, Maximize, Plus } from 'lucide-react'
import { useBuilding } from '@/components/BuildingContext'

interface Issue {
  id: number
  title: string
  description: string
  status: string
  repairCost: number | null
  images: string[]
  createdAt: Date
  user: {
    id: number
    fullName: string
    phone?: string
    email?: string
  }
  room: {
    name: string
    floor?: number
  }
}

export default function MaintenancePage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [updateData, setUpdateData] = useState({
    status: '',
    repairCost: '',
    adminNotes: ''
  })
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [invoiceData, setInvoiceData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amountRoom: '0',
    amountElec: '0',
    amountWater: '0',
    amountService: '0'
  })
  const [contract, setContract] = useState<any>(null)
  const [existingInvoice, setExistingInvoice] = useState<any>(null)
  const { selectedBuildingId } = useBuilding()

  useEffect(() => {
    fetchIssues()
  }, [selectedBuildingId])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const url = selectedBuildingId
        ? `/api/maintenance?buildingId=${selectedBuildingId}`
        : '/api/maintenance'
      const response = await fetch(url)
      const data = await response.json()
      setIssues(data)
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (issue: Issue) => {
    setSelectedIssue(issue)
    setSelectedImageIndex(0) // Reset to first image
    // Extract admin notes from description if exists
    const adminNotesMatch = issue.description.match(/--- Admin Notes ---\n([\s\S]+?)(?:\n\n--- Lý do hủy ---|$)/)
    const adminNotes = adminNotesMatch ? adminNotesMatch[1].trim() : ''

    setUpdateData({
      status: issue.status,
      repairCost: issue.repairCost?.toString() || '',
      adminNotes: adminNotes
    })

    // Fetch contract for this user
    try {
      const response = await fetch(`/api/contracts?userId=${issue.user.id}&status=ACTIVE`)
      if (response.ok) {
        const contracts = await response.json()
        const activeContract = contracts.find((c: any) => c.status === 'ACTIVE')
        if (activeContract) {
          setContract(activeContract)
          setInvoiceData(prev => ({
            ...prev,
            amountRoom: '0',
            amountService: issue.repairCost?.toString() || '0'
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    }

    setShowSidePanel(true)
  }

  const handleOpenInvoiceModal = () => {
    if (!selectedIssue || !contract) return
    setExistingInvoice(null) // Reset existing invoice check
    setShowInvoiceModal(true)
  }

  const handleCreateInvoice = async () => {
    if (!contract || !selectedIssue) {
      alert('Không tìm thấy hợp đồng hoạt động cho khách hàng này')
      return
    }

    try {
      // Always create a new separate invoice for issue repair cost
      // Use a special endpoint or allow multiple invoices per period
      const response = await fetch('/api/invoices/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          issueId: selectedIssue.id,
          month: invoiceData.month,
          year: invoiceData.year,
          amountRoom: parseFloat(invoiceData.amountRoom || '0'),
          amountElec: parseFloat(invoiceData.amountElec || '0'),
          amountWater: parseFloat(invoiceData.amountWater || '0'),
          amountService: parseFloat(invoiceData.amountService || '0')
        })
      })

      if (response.ok) {
        const newInvoice = await response.json()
        alert(`Tạo hóa đơn riêng thành công!\nHóa đơn #${newInvoice.id} đã được tạo cho sự cố #${selectedIssue.id}.`)
        setShowInvoiceModal(false)
        setExistingInvoice(null)
        // Refresh issue list
        await fetchIssues()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi tạo hóa đơn')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Có lỗi xảy ra khi tạo hóa đơn')
    }
  }

  const handleOpenCancelModal = (issueId: number) => {
    setSelectedIssueId(issueId)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleCancelIssue = async () => {
    if (!selectedIssueId || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn')
      return
    }

    try {
      const response = await fetch(`/api/maintenance/${selectedIssueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelReason: cancelReason.trim()
        })
      })
      if (response.ok) {
        setShowCancelModal(false)
        setSelectedIssueId(null)
        setCancelReason('')
        await fetchIssues()
        // Close side panel if it's open for this issue
        if (selectedIssue && selectedIssue.id === selectedIssueId) {
          setShowSidePanel(false)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi hủy đơn')
      }
    } catch (error) {
      console.error('Error cancelling issue:', error)
      alert('Có lỗi xảy ra khi hủy đơn')
    }
  }

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return

    try {
      const response = await fetch(`/api/maintenance/${selectedIssue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: updateData.status,
          repairCost: updateData.repairCost ? parseFloat(updateData.repairCost) : null,
          adminNotes: updateData.adminNotes
        })
      })

      if (response.ok) {
        const updatedIssue = await response.json()
        // Update selected issue with new data
        setSelectedIssue(updatedIssue)
        // Refresh issues list
        await fetchIssues()
        alert('Cập nhật thành công!')
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi cập nhật')
      }
    } catch (error) {
      console.error('Error updating issue:', error)
      alert('Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleStatusChange = async (issueId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/maintenance/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchIssues()
      }
    } catch (error) {
      console.error('Error updating issue status:', error)
    }
  }

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    return 'Vừa xong'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Chờ xử lý', color: 'warning' },
      PROCESSING: { label: 'Đang sửa', color: 'info' },
      DONE: { label: 'Hoàn thành', color: 'success' },
      CANCELLED: { label: 'Đã hủy', color: 'failure' }
    }
    return statusMap[status] || { label: status, color: 'gray' }
  }

  const pendingIssues = issues.filter(i => i.status === 'PENDING' && (statusFilter === 'all' || statusFilter === 'PENDING'))
  const processingIssues = issues.filter(i => i.status === 'PROCESSING' && (statusFilter === 'all' || statusFilter === 'PROCESSING'))
  const doneIssues = issues.filter(i => i.status === 'DONE' && (statusFilter === 'all' || statusFilter === 'DONE'))
  const cancelledIssues = issues.filter(i => i.status === 'CANCELLED' && (statusFilter === 'all' || statusFilter === 'CANCELLED'))

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-primary truncate uppercase">BẢO TRÌ & SỰ CỐ</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Theo dõi và xử lý các yêu cầu bảo trì căn hộ.</p>
        </div>
        <div className="flex gap-2 justify-center sm:justify-end">
          <button type="button" onClick={() => setViewMode('table')} className={`btn btn-sm px-4 rounded-xl font-bold ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary text-primary'}`}>
            <List size={16} /> DANH SÁCH
          </button>
          <button type="button" onClick={() => setViewMode('kanban')} className={`btn btn-sm px-4 rounded-xl font-bold ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary text-primary'}`}>
            <LayoutGrid size={16} /> KANBAN
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {viewMode === 'table' ? (
          <div className="space-y-6">
            {/* Filters */}
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
                          {statusFilter === 'all' ? 'TẤT CẢ' :
                            statusFilter === 'PENDING' ? 'CHỜ XỬ LÝ' :
                              statusFilter === 'PROCESSING' ? 'ĐANG SỬA' :
                                statusFilter === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
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
                    placeholder="Tìm theo mã, nội dung, phòng hoặc cư dân..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input input-with-icon w-full h-11 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-gray-100 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-tertiary border-b border-primary">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">Thông tin yêu cầu</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">Phòng</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">Người báo cáo</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">Trạng thái</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-secondary uppercase">Chi phí</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary">
                    {issues
                      .filter(issue => {
                        if (statusFilter !== 'all' && issue.status !== statusFilter) return false
                        if (!searchQuery) return true
                        const query = searchQuery.toLowerCase()
                        return (
                          issue.title.toLowerCase().includes(query) ||
                          issue.room.name.toLowerCase().includes(query) ||
                          issue.user.fullName.toLowerCase().includes(query) ||
                          issue.id.toString().includes(query)
                        )
                      })
                      .map((issue) => {
                        const statusBadge = getStatusBadge(issue.status)
                        const initials = getInitials(issue.user.fullName)
                        return (
                          <tr key={issue.id} className="hover:bg-tertiary transition-colors">
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <div>
                                <span className="text-xs font-medium text-secondary">REQ-{issue.id}</span>
                                <p className="text-sm font-medium text-primary line-clamp-1">{issue.title}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock size={12} className="text-tertiary" />
                                  <span className="text-xs text-tertiary">{formatRelativeTime(issue.createdAt)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                              <span className="text-sm text-primary font-medium">{issue.room.name}</span>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                                </div>
                                <span className="text-sm text-primary truncate max-w-[150px]">{issue.user.fullName}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                              <Badge color={statusBadge.color} className="justify-center py-1 min-h-[24px]">{statusBadge.label}</Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
                              <span className="text-sm font-medium text-primary">
                                {issue.repairCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(issue.repairCost) : '---'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                              <button
                                onClick={() => handleViewDetails(issue)}
                                className="btn btn-ghost btn-icon text-primary"
                                title="Chi tiết"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-4">
              {issues
                .filter(issue => {
                  if (statusFilter !== 'all' && issue.status !== statusFilter) return false
                  if (!searchQuery) return true
                  const query = searchQuery.toLowerCase()
                  return (
                    issue.title.toLowerCase().includes(query) ||
                    issue.room.name.toLowerCase().includes(query) ||
                    issue.user.fullName.toLowerCase().includes(query) ||
                    issue.id.toString().includes(query)
                  )
                })
                .map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => handleViewDetails(issue)}
                    className="card p-4 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-medium text-secondary">#{issue.id}</span>
                        <p className="font-medium text-primary">{issue.title}</p>
                      </div>
                      <Badge color={getStatusBadge(issue.status).color} className="justify-center py-1 min-h-[24px]">{getStatusBadge(issue.status).label}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-tertiary">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} />
                        <span>P.{issue.room.name}</span>
                      </div>
                      <span>{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Empty State */}
            {
              issues.filter(issue => {
                if (statusFilter !== 'all' && issue.status !== statusFilter) return false
                if (!searchQuery) return true
                const query = searchQuery.toLowerCase()
                return (
                  issue.title.toLowerCase().includes(query) ||
                  issue.room.name.toLowerCase().includes(query) ||
                  issue.user.fullName.toLowerCase().includes(query) ||
                  issue.id.toString().includes(query)
                )
              }).length === 0 && (
                <div className="card p-12 text-center">
                  <Search size={52} className="mx-auto text-tertiary" />
                  <h3 className="mt-4 text-lg font-semibold text-primary">Không tìm thấy yêu cầu</h3>
                  <p className="mt-2 text-sm text-secondary">Thử thay đổi bộ lọc để xem thêm dữ liệu.</p>
                </div>
              )
            }
          </div>
        ) : (
          /* Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { status: 'PENDING', title: 'Chờ xử lý', items: pendingIssues, dotClass: 'bg-amber-500', countClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-200 dark:border-amber-800' },
              { status: 'PROCESSING', title: 'Đang sửa', items: processingIssues, dotClass: 'bg-blue-500', countClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800' },
              { status: 'DONE', title: 'Hoàn thành', items: doneIssues, dotClass: 'bg-green-500', countClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 border border-green-200 dark:border-green-800' },
              { status: 'CANCELLED', title: 'Đã hủy', items: cancelledIssues, dotClass: 'bg-gray-400 dark:bg-gray-500', countClass: 'bg-neutral-secondary-medium border border-default-medium text-heading' }
            ].map((col) => (
              <div key={col.status} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${col.dotClass}`}></div>
                    <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">{col.title}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${col.countClass}`}>{col.items.length}</span>
                </div>
                <div className="flex-1 space-y-3 p-2 rounded-2xl bg-tertiary/30 border border-dashed border-primary min-h-[400px]">
                  {col.items.map((issue) => {
                    const initials = getInitials(issue.user.fullName)
                    return (
                      <div
                        key={issue.id}
                        className="card p-4 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleViewDetails(issue)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-secondary">#{issue.id}</span>
                          <MoreVertical size={14} className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-sm font-medium text-primary line-clamp-2 mb-3">{issue.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-secondary mb-3">
                          <MapPin size={12} className="text-blue-500" />
                          <span>{issue.room.name}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-primary">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">{initials}</div>
                            <span className="text-xs text-secondary truncate max-w-[80px]">{issue.user.fullName}</span>
                          </div>
                          <span className="text-[10px] text-tertiary">{formatRelativeTime(issue.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {col.items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-40">
                      <Wrench size={28} className="text-tertiary mb-2" />
                      <p className="text-xs text-tertiary">Trống</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div >

      {/* Side Panel */}
      {
        showSidePanel && selectedIssue && (
          <div className="fixed inset-0 z-50 flex items-stretch justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSidePanel(false)} />
            <div className="relative w-full max-w-2xl bg-primary shadow-2xl flex flex-col border-l border-primary">
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-primary">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-secondary">REQ-{selectedIssue.id}</span>
                    <Badge color={getStatusBadge(selectedIssue.status).color} className="justify-center py-1 min-h-[24px]">{getStatusBadge(selectedIssue.status).label}</Badge>
                  </div>
                  <button onClick={() => setShowSidePanel(false)} className="btn btn-ghost btn-icon text-secondary">
                    <X size={20} />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-primary">{selectedIssue.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-xs text-secondary">
                  <div className="flex items-center gap-1"><MapPin size={14} /> Phòng {selectedIssue.room.name}</div>
                  <div className="flex items-center gap-1"><Clock size={14} /> {formatRelativeTime(selectedIssue.createdAt)}</div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                <section>
                  <h3 className="text-xs font-semibold text-secondary uppercase mb-3">Người báo cáo</h3>
                  <div className="card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">{getInitials(selectedIssue.user.fullName)}</div>
                    <div>
                      <h4 className="text-sm font-medium text-primary">{selectedIssue.user.fullName}</h4>
                      <p className="text-xs text-tertiary">Cư dân tòa nhà</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold text-secondary uppercase mb-3">Nội dung chi tiết</h3>
                  <div className="card p-4">
                    <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedIssue.description.split('\n\n--- Admin Notes ---')[0].split('\n\n--- Lý do hủy ---')[0]}
                    </p>
                  </div>
                </section>

                {selectedIssue.description.includes('--- Admin Notes ---') && (
                  <section>
                    <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-3">Ghi chú xử lý</h3>
                    <div className="card p-4 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                      <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                        {selectedIssue.description.split('--- Admin Notes ---\n')[1]?.split('\n\n--- Lý do hủy ---')[0] || ''}
                      </p>
                    </div>
                  </section>
                )}

                {selectedIssue.images && selectedIssue.images.length > 0 && (
                  <section>
                    <h3 className="text-xs font-semibold text-secondary uppercase mb-3">Hình ảnh hiện trạng</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedIssue.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-tertiary cursor-pointer group" onClick={() => window.open(img, '_blank')}>
                          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <Maximize size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="pt-4 border-t border-primary">
                  <h3 className="text-xs font-semibold text-secondary uppercase mb-3">Cập nhật tiến độ</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-medium text-secondary mb-1 block">Trạng thái mới</label>
                      <Select value={updateData.status} onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="PROCESSING">Đang sửa chữa</option>
                        <option value="DONE">Hoàn thành</option>
                        <option value="CANCELLED">Hủy bỏ</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-secondary mb-1 block">Chi phí (VNĐ)</label>
                      <input type="number" value={updateData.repairCost} onChange={(e) => setUpdateData(prev => ({ ...prev, repairCost: e.target.value }))} className="input w-full" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary mb-1 block">Ghi chú quản lý</label>
                    <textarea value={updateData.adminNotes} onChange={(e) => setUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))} className="input w-full min-h-[100px] resize-none" placeholder="Nhập ghi chú xử lý..." />
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 sm:p-8 border-t border-primary bg-tertiary flex items-center gap-3">
                {selectedIssue.status === 'PENDING' && (
                  <button onClick={() => handleOpenCancelModal(selectedIssue.id)} className="btn btn-secondary flex-1 h-11 rounded-xl uppercase font-bold text-[11px] tracking-wider">Hủy yêu cầu</button>
                )}
                {selectedIssue.status === 'DONE' && contract && (
                  <button onClick={handleOpenInvoiceModal} className="btn btn-success flex-1 h-11 rounded-xl uppercase font-bold text-[11px] tracking-wider">Tạo hóa đơn</button>
                )}
                <button onClick={handleUpdateIssue} className="btn btn-primary flex-1 h-11 rounded-xl uppercase font-bold text-[11px] tracking-wider shadow-md hover:shadow-lg transition-all">Lưu thay đổi</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Invoice Modal */}
      {
        showInvoiceModal && contract && selectedIssue && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInvoiceModal(false)} />
            <div className="relative w-full max-w-lg card p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4"><Receipt size={28} /></div>
                  <h2 className="text-xl font-bold text-primary">Tạo hóa đơn sửa chữa</h2>
                  <p className="text-sm text-secondary mt-1">Sự cố #{selectedIssue.id}</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-secondary mb-1 block">Tháng</label>
                      <Select value={invoiceData.month} onChange={(e) => setInvoiceData(prev => ({ ...prev, month: parseInt(e.target.value) }))}>
                        {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-secondary mb-1 block">Năm</label>
                      <input type="number" value={invoiceData.year} onChange={(e) => setInvoiceData(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="input w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary mb-1 block">Số tiền (VNĐ)</label>
                    <input type="number" value={invoiceData.amountService} onChange={(e) => setInvoiceData(prev => ({ ...prev, amountService: e.target.value }))} className="input w-full text-lg font-bold" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={handleCreateInvoice} className="btn btn-primary w-full h-11 rounded-xl uppercase font-bold text-[11px] tracking-wider shadow-md hover:shadow-lg transition-all">Xác nhận tạo</button>
                  <button onClick={() => setShowInvoiceModal(false)} className="btn btn-secondary w-full h-11 rounded-xl uppercase font-bold text-[11px] tracking-wider">Hủy thao tác</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Cancel Modal */}
      {
        showCancelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
            <div className="relative w-full max-w-lg card p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4"><Ban size={28} /></div>
                  <h2 className="text-xl font-bold text-primary">Lý do hủy yêu cầu?</h2>
                </div>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input w-full min-h-[120px] resize-none" placeholder="Vui lòng cho cư dân biết lý do..." />
                <div className="flex flex-col gap-2 pt-3">
                  <button onClick={handleCancelIssue} className="btn btn-danger w-full h-11 rounded-xl uppercase font-bold text-[11px] tracking-wider shadow-md hover:shadow-lg transition-all">Xác nhận hủy</button>
                  <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary w-full h-11 rounded-xl uppercase font-bold text-[11px] tracking-wider">Trở lại</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
