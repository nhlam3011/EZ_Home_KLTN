'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, CheckCircle, LayoutGrid, List, X, XCircle, Receipt } from 'lucide-react'

interface Service {
  id: number
  name: string
  unitPrice: number
  unit: string
  isActive: boolean
}

interface ServiceOrder {
  id: number
  quantity: number
  total: number
  orderDate: Date | string
  status: string
  note?: string
  user: {
    id: number
    fullName: string
    contracts: Array<{
      room: {
        name: string
      } | null
    }>
  }
  service: {
    id: number
    name: string
  }
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'config' | 'registrations' | 'history'>('registrations')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    unitPrice: '',
    unit: ''
  })
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [invoiceData, setInvoiceData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amountRoom: '0',
    amountElec: '0',
    amountWater: '0',
    amountService: '0'
  })
  const [contract, setContract] = useState<any>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'accept' | 'complete'; id: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'config') {
      fetchServices()
    } else if (activeTab === 'registrations') {
      fetchOrders()
    }
  }, [activeTab, orderSearch, orderStatusFilter])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/services?${params.toString()}`)
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Error toggling service:', error)
    }
  }

  const handleDelete = (id: number) => {
    setConfirmAction({ type: 'delete', id })
    setShowConfirmModal(true)
  }

  const confirmDelete = async () => {
    if (!confirmAction || confirmAction.type !== 'delete') return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/services/${confirmAction.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchServices()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Có lỗi xảy ra khi xóa dịch vụ')
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const handleAcceptOrder = (orderId: number) => {
    setConfirmAction({ type: 'accept', id: orderId })
    setShowConfirmModal(true)
  }

  const confirmAcceptOrder = async () => {
    if (!confirmAction || confirmAction.type !== 'accept') return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/service-orders/${confirmAction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROCESSING' })
      })
      if (response.ok) {
        alert('Đã nhận đơn hàng thành công!')
        fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error accepting order:', error)
      alert('Có lỗi xảy ra khi nhận đơn hàng')
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const handleCompleteOrder = (orderId: number) => {
    setConfirmAction({ type: 'complete', id: orderId })
    setShowConfirmModal(true)
  }

  const confirmCompleteOrder = async () => {
    if (!confirmAction || confirmAction.type !== 'complete') return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/service-orders/${confirmAction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' })
      })
      if (response.ok) {
        alert('Đã đánh dấu đơn hàng hoàn thành!')
        fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error completing order:', error)
      alert('Có lỗi xảy ra khi hoàn thành đơn hàng')
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const cancelConfirm = () => {
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const getServiceIcon = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('điện')) return '⚡'
    if (nameLower.includes('nước')) return '💧'
    if (nameLower.includes('internet') || nameLower.includes('wifi')) return '📶'
    if (nameLower.includes('vệ sinh')) return '🧹'
    if (nameLower.includes('xe')) return '🅿️'
    return '📋'
  }

  const filteredServices = services.filter(service => {
    if (search && !service.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (statusFilter === 'active' && !service.isActive) return false
    if (statusFilter === 'inactive' && service.isActive) return false
    return true
  })

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedServices = filteredServices.slice(startIndex, endIndex)

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setEditFormData({
      name: service.name,
      unitPrice: service.unitPrice.toString(),
      unit: service.unit
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingService) return

    if (!editFormData.name.trim()) {
      alert('Vui lòng nhập tên dịch vụ')
      return
    }
    if (!editFormData.unitPrice || parseFloat(editFormData.unitPrice) <= 0) {
      alert('Vui lòng nhập đơn giá hợp lệ')
      return
    }
    if (!editFormData.unit.trim()) {
      alert('Vui lòng nhập đơn vị tính')
      return
    }

    try {
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          unitPrice: parseFloat(editFormData.unitPrice),
          unit: editFormData.unit.trim()
        })
      })

      if (response.ok) {
        alert('Đã cập nhật dịch vụ thành công!')
        setShowEditModal(false)
        setEditingService(null)
        fetchServices()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error updating service:', error)
      alert('Có lỗi xảy ra khi cập nhật dịch vụ')
    }
  }

  const handleOpenInvoiceModal = async (order: ServiceOrder) => {
    setSelectedOrder(order)
    setInvoiceData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amountRoom: '0',
      amountElec: '0',
      amountWater: '0',
      amountService: order.total.toString()
    })

    // Fetch contract for this user
    try {
      const response = await fetch(`/api/contracts?userId=${order.user.id}&status=ACTIVE`)
      if (response.ok) {
        const contracts = await response.json()
        const activeContract = contracts.find((c: any) => c.status === 'ACTIVE')
        if (activeContract) {
          setContract(activeContract)
        } else {
          alert('Không tìm thấy hợp đồng hoạt động cho khách hàng này')
          return
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert('Có lỗi xảy ra khi tải thông tin hợp đồng')
      return
    }

    setShowInvoiceModal(true)
  }

  const handleCreateInvoice = async () => {
    if (!contract || !selectedOrder) {
      alert('Không tìm thấy hợp đồng hoạt động cho khách hàng này')
      return
    }

    try {
      const response = await fetch('/api/invoices/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          serviceOrderId: selectedOrder.id,
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
        alert(`Tạo hóa đơn thành công!\nHóa đơn #${newInvoice.id} đã được tạo cho đơn dịch vụ #${selectedOrder.id}.`)
        setShowInvoiceModal(false)
        setSelectedOrder(null)
        setContract(null)
        fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi tạo hóa đơn')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Có lỗi xảy ra khi tạo hóa đơn')
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const params = new URLSearchParams()
      if (orderSearch) params.append('search', orderSearch)
      if (orderStatusFilter !== 'all') params.append('status', orderStatusFilter)

      const response = await fetch(`/api/admin/service-orders?${params.toString()}`)
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleOpenCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleCancelOrder = async () => {
    if (!selectedOrderId || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn')
      return
    }

    try {
      const response = await fetch(`/api/admin/service-orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelReason: cancelReason.trim()
        })
      })
      if (response.ok) {
        setShowCancelModal(false)
        setSelectedOrderId(null)
        setCancelReason('')
        fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi hủy đơn')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Có lỗi xảy ra khi hủy đơn')
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    return 'Vừa xong'
  }

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString()

    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return `${time} - Hôm nay`
    if (isYesterday) return `${time} - Hôm qua`
    return `${time} - ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Mới', className: 'badge badge-error' },
      PROCESSING: { label: 'Đang làm', className: 'badge badge-info' },
      DONE: { label: 'Hoàn thành', className: 'badge badge-success' },
      CANCELLED: { label: 'Đã hủy', className: 'badge badge-warning' }
    }
    return statusMap[status] || { label: status, className: 'badge badge-info' }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const totalOrderPages = Math.ceil(orders.length / itemsPerPage)
  const orderStartIndex = (currentPage - 1) * itemsPerPage
  const orderEndIndex = orderStartIndex + itemsPerPage
  const paginatedOrders = orders.slice(orderStartIndex, orderEndIndex)

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Quản lý Dịch vụ</h1>
          <p className="text-sm sm:text-base text-secondary mt-1">
            Quản lý các loại dịch vụ và đơn đăng ký
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="btn btn-primary btn-sm sm:btn-md"
        >
          <Plus size={18} />
          <span>Thêm dịch vụ</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="card p-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('registrations')
              setCurrentPage(1)
            }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'registrations'
              ? 'bg-blue-500 text-white'
              : 'text-secondary hover:bg-tertiary'
              }`}
          >
            Danh sách đăng ký
          </button>
          <button
            onClick={() => {
              setActiveTab('config')
              setCurrentPage(1)
            }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'config'
              ? 'bg-blue-500 text-white'
              : 'text-secondary hover:bg-tertiary'
              }`}
          >
            Cấu hình Dịch vụ
          </button>
          <button
            onClick={() => {
              setActiveTab('history')
              setCurrentPage(1)
            }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'history'
              ? 'bg-blue-500 text-white'
              : 'text-secondary hover:bg-tertiary'
              }`}
          >
            Lịch sử
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'registrations' ? (
        <div className="card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo số phòng, tên dịch vụ, người yêu cầu..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="input input-with-icon w-full pr-4 py-2"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <List size={16} />
                <span>Danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <LayoutGrid size={16} />
                <span>Kanban</span>
              </button>
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="PENDING">Mới</option>
              <option value="PROCESSING">Đang làm</option>
              <option value="DONE">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên dịch vụ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-with-icon w-full pr-4 py-2"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>
        </div>
      )}

      {/* Orders List */}
      {activeTab === 'registrations' && (
        ordersLoading ? (
          <div className="text-center py-12">
            <p className="text-tertiary">Đang tải...</p>
          </div>
        ) : viewMode === 'list' ? (
          <>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-tertiary border-b border-primary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">PHÒNG</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">TÊN DỊCH VỤ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">NGƯỜI YÊU CẦU</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">THỜI GIAN TẠO</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">TRẠNG THÁI</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary">
                  {paginatedOrders.map((order) => {
                    const statusBadge = getStatusBadge(order.status)
                    const room = order.user.contracts[0]?.room
                    const roomName = room?.name || 'N/A'
                    const initials = getInitials(order.user.fullName)

                    return (
                      <tr key={order.id} className="hover:bg-tertiary">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-primary">{roomName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-primary">{order.service.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                            </div>
                            <span className="text-sm text-primary">{order.user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-secondary">{formatDateTime(order.orderDate)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                            {order.status === 'CANCELLED' && order.note && order.note.startsWith('Lý do hủy:') && (
                              <span className="text-xs text-tertiary italic mt-1" title={order.note}>
                                {order.note.replace('Lý do hủy: ', '')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Đơn hàng #${order.id}\nDịch vụ: ${order.service.name}\nSố lượng: ${order.quantity}\nTổng tiền: ${formatCurrency(order.total)}\nTrạng thái: ${statusBadge.label}\nNgười yêu cầu: ${order.user.fullName}\nPhòng: ${roomName}`)
                              }}
                              className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} className="text-secondary" />
                            </button>
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleAcceptOrder(order.id)
                                  }}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                  Nhận đơn
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleOpenCancelModal(order.id)
                                  }}
                                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 font-medium"
                                >
                                  <X size={14} />
                                  Hủy đơn
                                </button>
                              </>
                            )}
                            {order.status === 'PROCESSING' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleCompleteOrder(order.id)
                                }}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 font-medium"
                              >
                                <CheckCircle size={14} />
                                Xong
                              </button>
                            )}
                            {order.status === 'DONE' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleOpenInvoiceModal(order)
                                }}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 font-medium"
                              >
                                <Receipt size={14} />
                                Tạo hóa đơn
                              </button>
                            )}
                            {order.status === 'CANCELLED' && (
                              <span className="text-sm text-tertiary">Đã hủy</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {orders.length > 0 && (
              <div className="flex items-center justify-between card p-4">
                <p className="text-sm text-secondary">
                  Hiển thị {orderStartIndex + 1}-{Math.min(orderEndIndex, orders.length)} trong số {orders.length} đơn hàng
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    Trước
                  </button>
                  {Array.from({ length: Math.min(totalOrderPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalOrderPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalOrderPages - 2) {
                      pageNum = totalOrderPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    if (pageNum > totalOrderPages) return null
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalOrderPages, prev + 1))}
                    disabled={currentPage === totalOrderPages}
                    className="btn btn-secondary btn-sm"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* PENDING Column */}
            <div className="bg-tertiary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <h3 className="font-semibold text-primary">Mới</h3>
                <span className="bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded">
                  {orders.filter(o => o.status === 'PENDING').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'PENDING').map((order) => {
                  const room = order.user.contracts[0]?.room
                  const roomName = room?.name || 'N/A'
                  const initials = getInitials(order.user.fullName)
                  return (
                    <div
                      key={order.id}
                      className="card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-primary">{order.service.name}</p>
                          <p className="text-xs text-tertiary mt-1">Phòng {roomName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-secondary">{order.user.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-tertiary">Số lượng: {order.quantity}</span>
                        <span className="text-sm font-semibold text-primary">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAcceptOrder(order.id)
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Nhận đơn
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOpenCancelModal(order.id)
                          }}
                          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                          title="Hủy đơn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* PROCESSING Column */}
            <div className="bg-tertiary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold text-primary">Đang làm</h3>
                <span className="bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded">
                  {orders.filter(o => o.status === 'PROCESSING').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'PROCESSING').map((order) => {
                  const room = order.user.contracts[0]?.room
                  const roomName = room?.name || 'N/A'
                  const initials = getInitials(order.user.fullName)
                  return (
                    <div
                      key={order.id}
                      className="card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-primary">{order.service.name}</p>
                          <p className="text-xs text-tertiary mt-1">Phòng {roomName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-secondary">{order.user.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-tertiary">Số lượng: {order.quantity}</span>
                        <span className="text-sm font-semibold text-primary">{formatCurrency(order.total)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCompleteOrder(order.id)
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 font-medium"
                      >
                        <CheckCircle size={14} />
                        Hoàn thành
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* DONE Column */}
            <div className="bg-tertiary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h3 className="font-semibold text-primary">Hoàn thành</h3>
                <span className="bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded">
                  {orders.filter(o => o.status === 'DONE').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'DONE').map((order) => {
                  const room = order.user.contracts[0]?.room
                  const roomName = room?.name || 'N/A'
                  const initials = getInitials(order.user.fullName)
                  return (
                    <div key={order.id} className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-primary">{order.service.name}</p>
                          <p className="text-xs text-tertiary mt-1">Phòng {roomName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-secondary">{order.user.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-tertiary">Số lượng: {order.quantity}</span>
                        <span className="text-sm font-semibold text-primary">{formatCurrency(order.total)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleOpenInvoiceModal(order)
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 font-medium"
                      >
                        <Receipt size={14} />
                        Tạo hóa đơn
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CANCELLED Column */}
            <div className="bg-tertiary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <h3 className="font-semibold text-primary">Đã hủy</h3>
                <span className="bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded">
                  {orders.filter(o => o.status === 'CANCELLED').length}
                </span>
              </div>
              <div className="space-y-3">
                {orders.filter(o => o.status === 'CANCELLED').map((order) => {
                  const room = order.user.contracts[0]?.room
                  const roomName = room?.name || 'N/A'
                  const initials = getInitials(order.user.fullName)
                  return (
                    <div key={order.id} className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-primary">{order.service.name}</p>
                          <p className="text-xs text-tertiary mt-1">Phòng {roomName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-secondary">{order.user.fullName}</span>
                      </div>
                      {order.note && order.note.startsWith('Lý do hủy:') && (
                        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded text-xs text-red-900 dark:text-red-400">
                          {order.note.replace('Lý do hủy: ', '')}
                        </div>
                      )}
                      <div className="bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded text-center">
                        Đã hủy
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      )}

      {/* Services Table */}
      {activeTab === 'config' && (
        loading ? (
          <div className="text-center py-12">
            <p className="text-tertiary">Đang tải...</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full min-w-[600px]">
              <thead className="bg-tertiary border-b border-primary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    THÔNG TIN DỊCH VỤ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    ĐƠN VỊ TÍNH
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    ĐƠN GIÁ HIỆN TẠI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    TRẠNG THÁI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary">
                {paginatedServices.map((service) => (
                  <tr key={service.id} className="hover:bg-tertiary">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-tertiary flex items-center justify-center text-xl">
                          {getServiceIcon(service.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary">{service.name}</p>
                          <p className="text-xs text-tertiary mt-1">
                            Dịch vụ {service.name.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-secondary">{service.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(Number(service.unitPrice))} / {service.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={service.isActive}
                          onChange={() => handleToggleActive(service.id, service.isActive)}
                        />
                        <div className="w-11 h-6 bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary after:border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(service)}
                          className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} className="text-secondary" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(service.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Pagination for Services */}
      {activeTab === 'config' && filteredServices.length > 0 && (
        <div className="flex items-center justify-between card p-4">
          <p className="text-sm text-secondary">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredServices.length)} trong {filteredServices.length} dịch vụ
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
            >
              Trước
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
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card p-6">
          <p className="text-tertiary text-center py-12">Lịch sử điều chỉnh giá đang được phát triển...</p>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary">Hủy đơn dịch vụ</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrderId(null)
                    setCancelReason('')
                  }}
                  className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-tertiary" />
                </button>
              </div>
              <p className="text-secondary mb-4">
                Vui lòng nêu rõ lý do không nhận đơn sự cố này:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                className="input w-full px-4 py-3 resize-none"
                rows={4}
              />
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Xác nhận hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrderId(null)
                    setCancelReason('')
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

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-primary rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-primary">
              <h2 className="text-xl font-semibold text-primary">Chỉnh sửa dịch vụ</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="input w-full"
                  placeholder="Nhập tên dịch vụ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Đơn giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editFormData.unitPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, unitPrice: e.target.value })}
                  className="input w-full"
                  placeholder="Nhập đơn giá"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-tertiary mt-1">
                  Đơn giá hiện tại: {formatCurrency(editingService.unitPrice)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Đơn vị tính <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.unit}
                  onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Chọn đơn vị</option>
                  <option value="lần">lần</option>
                  <option value="tháng">tháng</option>
                  <option value="ngày">ngày</option>
                  <option value="giờ">giờ</option>
                  <option value="kg">kg</option>
                  <option value="m²">m²</option>
                  <option value="m³">m³</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-primary flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="btn btn-primary btn-md flex-1"
              >
                Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingService(null)
                  setEditFormData({ name: '', unitPrice: '', unit: '' })
                }}
                className="btn btn-secondary btn-md flex-1"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && contract && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-primary rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Receipt size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">Tạo hóa đơn dịch vụ</h2>
                    <p className="text-sm text-secondary">Đơn hàng #{selectedOrder.id}: {selectedOrder.service.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setSelectedOrder(null)
                    setContract(null)
                  }}
                  className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-tertiary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Khách hàng</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{selectedOrder.user.fullName}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Phòng {selectedOrder.user.contracts[0]?.room?.name || 'N/A'}</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Receipt size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                        Hóa đơn riêng cho dịch vụ
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Hóa đơn này sẽ được tạo <strong>riêng biệt</strong>, không gộp vào hóa đơn tháng hiện có.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Tháng
                    </label>
                    <select
                      value={invoiceData.month}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="input w-full"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Năm
                    </label>
                    <input
                      type="number"
                      value={invoiceData.year}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Phí dịch vụ (VND)
                    <span className="text-xs text-tertiary ml-2">(Đơn hàng #{selectedOrder.id}: {selectedOrder.service.name})</span>
                  </label>
                  <input
                    type="number"
                    value={invoiceData.amountService}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, amountService: e.target.value }))}
                    className="input w-full"
                    placeholder="Nhập phí dịch vụ"
                  />
                  <p className="text-xs text-tertiary mt-1">
                    Tổng tiền đơn hàng: {formatCurrency(selectedOrder.total)}
                  </p>
                </div>

                <div className="bg-tertiary rounded-lg p-4 border border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Tổng cộng:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(
                        parseFloat(invoiceData.amountService || '0')
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-primary">
                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  className="btn btn-success btn-md flex-1"
                >
                  <Receipt size={18} />
                  <span>Tạo hóa đơn riêng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setSelectedOrder(null)
                    setContract(null)
                  }}
                  className="btn btn-secondary btn-md"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={cancelConfirm}>
          <div className="bg-primary rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary">
                  {confirmAction.type === 'delete' && 'Xóa dịch vụ'}
                  {confirmAction.type === 'accept' && 'Nhận đơn hàng'}
                  {confirmAction.type === 'complete' && 'Hoàn thành đơn hàng'}
                </h2>
                <button onClick={cancelConfirm} className="p-2 hover:bg-tertiary rounded-lg">
                  <X size={20} className="text-secondary" />
                </button>
              </div>
              <p className="text-secondary mb-6">
                {confirmAction.type === 'delete' && 'Bạn có chắc chắn muốn xóa dịch vụ này?'}
                {confirmAction.type === 'accept' && 'Bạn có chắc chắn muốn nhận đơn hàng này?'}
                {confirmAction.type === 'complete' && 'Bạn có chắc chắn muốn đánh dấu đơn hàng này đã hoàn thành?'}
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={cancelConfirm} className="btn btn-secondary btn-md" disabled={actionLoading}>
                  Hủy
                </button>
                <button
                  onClick={confirmAction.type === 'delete' ? confirmDelete : confirmAction.type === 'accept' ? confirmAcceptOrder : confirmCompleteOrder}
                  disabled={actionLoading}
                  className={`btn btn-md ${confirmAction.type === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                >
                  {actionLoading ? 'Đang xử lý...' :
                    confirmAction.type === 'delete' ? 'Xóa' :
                      confirmAction.type === 'accept' ? 'Nhận' : 'Hoàn thành'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
