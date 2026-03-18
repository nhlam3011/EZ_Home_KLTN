'use client'

import { useEffect, useState } from 'react'
import { Badge } from 'flowbite-react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  LayoutGrid,
  List,
  X,
  XCircle,
  Receipt,
  Sparkles,
  Settings2,
  ClipboardList,
  Wallet,
  PackageCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Loading from '@/components/Loading'

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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
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
    fetchServices()
    fetchOrders()
  }, [])

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchOrders()
    }
    if (activeTab === 'config') {
      fetchServices()
    }
  }, [activeTab, orderSearch, orderStatusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, search, statusFilter, orderSearch, orderStatusFilter])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
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
    setContract(null)
    setInvoiceData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amountRoom: '0',
      amountElec: '0',
      amountWater: '0',
      amountService: order.total.toString()
    })

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const formatRelativeTime = (date: Date | string) => {
    const current = new Date()
    const target = new Date(date)
    const diff = current.getTime() - target.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    return 'Vừa xong'
  }

  const formatDateTime = (date: Date | string) => {
    const target = new Date(date)
    const now = new Date()
    const isToday = target.toDateString() === now.toDateString()
    const isYesterday = target.toDateString() === new Date(now.getTime() - 86400000).toDateString()
    const time = target.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    if (isToday) return `${time} - Hôm nay`
    if (isYesterday) return `${time} - Hôm qua`
    return `${time} - ${target.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Mới', color: 'warning' },
      PROCESSING: { label: 'Đang làm', color: 'info' },
      DONE: { label: 'Hoàn thành', color: 'success' },
      CANCELLED: { label: 'Đã hủy', color: 'failure' }
    }
    return statusMap[status] || { label: status, color: 'gray' }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getServiceStatusBadge = (isActive: boolean) => {
    return isActive
      ? { label: 'Hoạt động', color: 'success' as const }
      : { label: 'Tạm ngưng', color: 'failure' as const }
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

  const totalOrderPages = Math.ceil(orders.length / itemsPerPage)
  const orderStartIndex = (currentPage - 1) * itemsPerPage
  const orderEndIndex = orderStartIndex + itemsPerPage
  const paginatedOrders = orders.slice(orderStartIndex, orderEndIndex)

  const activeServicesCount = services.filter(service => service.isActive).length
  const inactiveServicesCount = services.length - activeServicesCount
  const pendingOrdersCount = orders.filter(order => order.status === 'PENDING').length
  const processingOrdersCount = orders.filter(order => order.status === 'PROCESSING').length
  const completedOrdersCount = orders.filter(order => order.status === 'DONE').length
  const cancelledOrdersCount = orders.filter(order => order.status === 'CANCELLED').length
  const completedRevenue = orders
    .filter(order => order.status === 'DONE')
    .reduce((sum, order) => sum + Number(order.total), 0)

  const tabs = [
    { key: 'registrations' as const, label: 'Đơn đăng ký', description: 'Theo dõi nhu cầu dịch vụ' },
    { key: 'config' as const, label: 'Cấu hình', description: 'Quản lý biểu phí dịch vụ' },
    { key: 'history' as const, label: 'Lịch sử', description: 'Ghi nhận thay đổi' }
  ]

  const kanbanColumns = [
    { status: 'PENDING', title: 'Mới', dotClass: 'bg-red-500', countClass: 'bg-danger-soft border border-danger-subtle text-fg-danger-strong' },
    { status: 'PROCESSING', title: 'Đang làm', dotClass: 'bg-blue-500', countClass: 'bg-brand-softer border border-brand-subtle text-fg-brand-strong' },
    { status: 'DONE', title: 'Hoàn thành', dotClass: 'bg-green-500', countClass: 'bg-success-soft border border-success-subtle text-fg-success-strong' },
    { status: 'CANCELLED', title: 'Đã hủy', dotClass: 'bg-gray-400 dark:bg-gray-500', countClass: 'bg-neutral-secondary-medium border border-default-medium text-heading' }
  ]

  const renderOrderActions = (order: ServiceOrder) => {
    const statusBadge = getStatusBadge(order.status)
    const roomName = order.user.contracts[0]?.room?.name || 'N/A'

    return (
      <div className="flex flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => {
            alert(
              `Đơn hàng #${order.id}\nDịch vụ: ${order.service.name}\nSố lượng: ${order.quantity}\nTổng tiền: ${formatCurrency(order.total)}\nTrạng thái: ${statusBadge.label}\nNgười yêu cầu: ${order.user.fullName}\nPhòng: ${roomName}`
            )
          }}
          className="btn btn-ghost btn-icon text-primary"
          title="Chi tiết"
        >
          <Eye size={16} className="w-[18px] h-[18px]" />
        </button>

        {order.status === 'PENDING' && (
          <>
            <button
              type="button"
              onClick={() => handleAcceptOrder(order.id)}
              className="btn btn-ghost btn-icon text-info"
              title="Nhận đơn"
            >
              <CheckCircle size={16} className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenCancelModal(order.id)}
              className="btn btn-ghost btn-icon text-danger"
              title="Hủy đơn"
            >
              <XCircle size={16} className="w-[18px] h-[18px]" />
            </button>
          </>
        )}

        {order.status === 'PROCESSING' && (
          <button
            type="button"
            onClick={() => handleCompleteOrder(order.id)}
            className="btn btn-ghost btn-icon text-success"
            title="Hoàn thành"
          >
            <CheckCircle size={16} className="w-[18px] h-[18px]" />
          </button>
        )}

        {order.status === 'DONE' && (
          <button
            type="button"
            onClick={() => handleOpenInvoiceModal(order)}
            className="btn btn-ghost btn-icon text-success"
            title="Tạo hóa đơn"
          >
            <Receipt size={16} className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary truncate">Quản lý dịch vụ</h1>
          <p className="text-secondary mt-1 text-sm sm:text-base">Đồng bộ cấu hình dịch vụ, điều phối đơn đăng ký và kiểm soát.</p>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full lg:flex lg:flex-row lg:w-auto lg:items-center lg:gap-3">
          <Link
            href="/admin/services/new"
            className="btn btn-primary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 order-1 lg:order-none shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
            <span className="font-bold">Thêm dịch vụ</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Danh mục dịch vụ',
            value: services.length.toString(),
            helper: `${activeServicesCount} hoạt động · ${inactiveServicesCount} tạm ngưng`,
            Icon: Settings2,
            iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
            cardClass: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
          },
          {
            label: 'Đơn chờ xử lý',
            value: pendingOrdersCount.toString(),
            helper: `${processingOrdersCount} đơn đang triển khai`,
            Icon: ClipboardList,
            iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
            cardClass: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
          },
          {
            label: 'Đơn hoàn thành',
            value: completedOrdersCount.toString(),
            helper: `${cancelledOrdersCount} đơn đã hủy`,
            Icon: PackageCheck,
            iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
            cardClass: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
          },
          {
            label: 'Doanh thu ghi nhận',
            value: formatCurrency(completedRevenue),
            helper: 'Tổng đơn dịch vụ đã hoàn thành',
            Icon: Wallet,
            iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
            cardClass: 'from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20'
          }
        ].map(({ label, value, helper, Icon, iconClass, cardClass }) => (
          <div key={label} className={`card bg-gradient-to-br ${cardClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
                <p className="mt-3 break-words text-2xl font-bold text-primary">{value}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-secondary">{helper}</p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-primary mb-6">
        <div className="flex items-center gap-2 sm:gap-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                setCurrentPage(1)
              }}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-secondary hover:text-primary'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'registrations' && (
        <>
          <div className="card p-3 sm:p-4 mb-4 !overflow-visible relative z-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative flex-1 sm:max-w-[240px]">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown
                    ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                    : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${orderStatusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                    orderStatusFilter === 'PENDING' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                      orderStatusFilter === 'PROCESSING' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                        orderStatusFilter === 'DONE' ? 'bg-green-50 dark:bg-green-900/20 text-green-500' :
                          'bg-gray-50 dark:bg-gray-900/20 text-gray-500'
                    }`}>
                    {orderStatusFilter === 'all' && <ClipboardList size={14} />}
                    {orderStatusFilter === 'PENDING' && <AlertCircle size={14} />}
                    {orderStatusFilter === 'PROCESSING' && <Loader2 size={14} className="animate-spin-slow" />}
                    {orderStatusFilter === 'DONE' && <CheckCircle size={14} />}
                    {orderStatusFilter === 'CANCELLED' && <XCircle size={14} />}
                  </div>
                  <div className="text-left pr-1 flex-1">
                    <p className="text-md font-medium leading-tight whitespace-nowrap text-primary uppercase">
                      TRẠNG THÁI: {orderStatusFilter === 'all' ? 'TẤT CẢ' :
                        orderStatusFilter === 'PENDING' ? 'MỚI' :
                          orderStatusFilter === 'PROCESSING' ? 'ĐANG XỬ LÝ' :
                            orderStatusFilter === 'DONE' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showStatusDropdown && (
                  <>
                    <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowStatusDropdown(false)} />
                    <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                      {[
                        { id: 'all', label: 'TẤT CẢ TRẠNG THÁI', icon: <ClipboardList size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                        { id: 'PENDING', label: 'MỚI', icon: <AlertCircle size={16} />, color: 'text-red-500', bg: 'bg-red-50/50 dark:bg-red-900/10' },
                        { id: 'PROCESSING', label: 'ĐANG LÀM', icon: <Loader2 size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                        { id: 'DONE', label: 'HOÀN THÀNH', icon: <CheckCircle size={16} />, color: 'text-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10' },
                        { id: 'CANCELLED', label: 'ĐÃ HỦY', icon: <XCircle size={16} />, color: 'text-gray-500', bg: 'bg-gray-50/50 dark:bg-gray-900/10' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { setOrderStatusFilter(item.id); setShowStatusDropdown(false); setCurrentPage(1); }}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${orderStatusFilter === item.id ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                        >
                          <div className={`p-1.5 rounded-lg ${orderStatusFilter === item.id ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`}`}>
                            {item.icon}
                          </div>
                          <span className="uppercase">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="sm:col-span-1 lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
                <input
                  type="text"
                  placeholder="Tìm theo phòng, tên dịch vụ hoặc người yêu cầu..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="input input-with-icon w-full pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="mb-4 flex gap-2 justify-end">
            <button type="button" onClick={() => setViewMode('list')} className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}>
              <List size={16} /> Danh sách
            </button>
            <button type="button" onClick={() => setViewMode('kanban')} className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}>
              <LayoutGrid size={16} /> Kanban
            </button>
          </div>



          {ordersLoading ? (
            <div className="card">
              <Loading size="lg" text="Đang tải đơn đăng ký..." />
            </div>
          ) : orders.length === 0 ? (
            <div className="card p-12 text-center">
              <ClipboardList size={52} className="mx-auto text-tertiary" />
              <h3 className="mt-4 text-lg font-semibold text-primary">Chưa có đơn dịch vụ</h3>
              <p className="mt-2 text-sm text-secondary">Thử thay đổi bộ lọc để xem thêm dữ liệu.</p>
            </div>
          ) : viewMode === 'list' ? (
            <>
              <div className="hidden lg:block card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead className="border-b border-primary bg-tertiary/80">
                      <tr>
                        {['Dịch vụ', 'Phòng', 'Người yêu cầu', 'Thời gian', 'Trạng thái', 'Hành động'].map(header => (
                          <th
                            key={header}
                            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-secondary uppercase align-middle ${header === 'Hành động' ? 'text-center' : 'text-left'}`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary">
                      {paginatedOrders.map(order => {
                        const statusBadge = getStatusBadge(order.status)
                        const roomName = order.user.contracts[0]?.room?.name || 'N/A'
                        const initials = getInitials(order.user.fullName)

                        return (
                          <tr key={order.id} className="hover:bg-tertiary/60">
                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-tertiary text-lg">
                                  {getServiceIcon(order.service.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-primary">{order.service.name}</p>
                                  <p className="mt-0.5 text-xs text-tertiary">{order.quantity} yêu cầu · {formatCurrency(order.total)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle text-sm font-medium text-primary">{roomName}</td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                  {initials}
                                </div>
                                <span className="text-sm text-primary">{order.user.fullName}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                              <p className="text-sm text-secondary">{formatDateTime(order.orderDate)}</p>
                              <p className="mt-0.5 text-xs text-tertiary">{formatRelativeTime(order.orderDate)}</p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle align-top">
                              <Badge color={statusBadge.color} className="whitespace-nowrap rounded font-medium inline-flex justify-center py-1 min-h-[24px]">
                                {statusBadge.label}
                              </Badge>
                              {order.status === 'CANCELLED' && order.note?.startsWith('Lý do hủy:') && (
                                <p className="mt-1 text-xs italic text-tertiary">{order.note.replace('Lý do hủy: ', '')}</p>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle text-center">{renderOrderActions(order)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {paginatedOrders.map(order => {
                  const statusBadge = getStatusBadge(order.status)
                  const roomName = order.user.contracts[0]?.room?.name || 'N/A'
                  const initials = getInitials(order.user.fullName)

                  return (
                    <div key={order.id} className="card p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getServiceIcon(order.service.name)}</span>
                            <h3 className="truncate text-base font-semibold text-primary">{order.service.name}</h3>
                          </div>
                          <p className="mt-1 text-sm text-secondary">Phòng {roomName}</p>
                        </div>
                        <Badge color={statusBadge.color} className="whitespace-nowrap rounded font-medium shrink-0 justify-center py-1 min-h-[24px]">
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-tertiary/60 p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs text-secondary">Người yêu cầu</p>
                            <p className="text-sm font-medium text-primary">{order.user.fullName}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-secondary">Tổng tiền</p>
                          <p className="text-sm font-semibold text-primary">{formatCurrency(order.total)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary">Số lượng</p>
                          <p className="text-sm text-primary">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary">Thời gian</p>
                          <p className="text-sm text-primary">{formatDateTime(order.orderDate)}</p>
                        </div>
                      </div>

                      {order.status === 'CANCELLED' && order.note?.startsWith('Lý do hủy:') && (
                        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                          {order.note.replace('Lý do hủy: ', '')}
                        </div>
                      )}

                      <div className="mt-4 border-t border-primary pt-4">{renderOrderActions(order)}</div>
                    </div>
                  )
                })}
              </div>

              {orders.length > itemsPerPage && (
                <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-secondary">
                    Hiển thị {orderStartIndex + 1}–{Math.min(orderEndIndex, orders.length)} trong {orders.length} đơn hàng
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.min(totalOrderPages, 5) }, (_, index) => {
                      let pageNumber = index + 1

                      if (totalOrderPages > 5) {
                        if (currentPage <= 3) {
                          pageNumber = index + 1
                        } else if (currentPage >= totalOrderPages - 2) {
                          pageNumber = totalOrderPages - 4 + index
                        } else {
                          pageNumber = currentPage - 2 + index
                        }
                      }

                      if (pageNumber > totalOrderPages) return null

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`btn btn-sm ${currentPage === pageNumber ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                    <button
                      type="button"
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kanbanColumns.map(column => {
                const items = orders.filter(order => order.status === column.status)

                return (
                  <div key={column.status} className="card p-4">
                    <div className="mb-4 flex items-center gap-2 border-b border-primary pb-4">
                      <div className={`h-2.5 w-2.5 rounded-full ${column.dotClass}`} />
                      <h3 className="flex-1 text-sm font-semibold text-primary">{column.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${column.countClass}`}>{items.length}</span>
                    </div>

                    <div className="space-y-3">
                      {items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-primary bg-primary/60 px-4 py-8 text-center text-sm text-secondary">
                          Trống
                        </div>
                      ) : (
                        items.map(order => {
                          const roomName = order.user.contracts[0]?.room?.name || 'N/A'
                          const initials = getInitials(order.user.fullName)

                          return (
                            <div key={order.id} className="card p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-primary">{order.service.name}</p>
                                  <p className="mt-0.5 text-xs text-tertiary">Phòng {roomName}</p>
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-secondary">#{order.id}</span>
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                  {initials}
                                </div>
                                <span className="text-xs text-secondary">{order.user.fullName}</span>
                              </div>

                              <div className="mt-3 flex items-center justify-between text-xs">
                                <span className="text-tertiary">Số lượng: {order.quantity}</span>
                                <span className="font-semibold text-primary">{formatCurrency(order.total)}</span>
                              </div>

                              {order.status === 'CANCELLED' && order.note?.startsWith('Lý do hủy:') && (
                                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                  {order.note.replace('Lý do hủy: ', '')}
                                </div>
                              )}

                              <div className="mt-3 border-t border-primary pt-3">{renderOrderActions(order)}</div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'config' && (
        <>
          <div className="card p-3 sm:p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs sm:text-sm text-secondary whitespace-nowrap font-medium w-auto">TRẠNG THÁI:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select flex-1">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã tắt</option>
                </select>
              </div>
              <div className="sm:col-span-1 lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên dịch vụ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-with-icon w-full pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="card">
              <Loading size="lg" text="Đang tải dịch vụ..." />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="card p-12 text-center">
              <Settings2 size={52} className="mx-auto text-tertiary" />
              <h3 className="mt-4 text-lg font-semibold text-primary">Không tìm thấy dịch vụ phù hợp</h3>
              <p className="mt-2 text-sm text-secondary">Thử đổi bộ lọc hoặc từ khóa khác.</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead className="border-b border-primary bg-tertiary/80">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                          Thông tin dịch vụ
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                          Đơn vị tính
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-secondary uppercase align-middle">
                          Đơn giá hiện tại
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                          Trạng thái
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary">
                      {paginatedServices.map(service => (
                        <tr key={service.id} className="hover:bg-tertiary/60">
                          <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-tertiary text-xl">
                                {getServiceIcon(service.name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-primary">{service.name}</p>
                                <p className="mt-0.5 text-xs text-tertiary">Dịch vụ {service.name.toLowerCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle text-left text-sm text-secondary">
                            {service.unit}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle text-right text-sm font-semibold text-primary">
                            {formatCurrency(Number(service.unitPrice))} / {service.unit}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(service.id, service.isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${service.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                              </button>
                              <Badge color={getServiceStatusBadge(service.isActive).color} className="whitespace-nowrap rounded font-medium justify-center py-1 min-h-[24px]">
                                {getServiceStatusBadge(service.isActive).label}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" onClick={() => handleEdit(service)} className="btn btn-ghost btn-icon text-primary" title="Sửa">
                                <Edit size={16} className="w-[18px] h-[18px]" />
                              </button>
                              <button type="button" onClick={() => handleDelete(service.id)} className="btn btn-ghost btn-icon text-danger" title="Xóa">
                                <Trash2 size={16} className="w-[18px] h-[18px]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {paginatedServices.map(service => (
                  <div key={service.id} className="card p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getServiceIcon(service.name)}</span>
                          <h3 className="truncate text-base font-semibold text-primary">{service.name}</h3>
                        </div>
                        <p className="mt-1.5 text-sm text-secondary">{formatCurrency(Number(service.unitPrice))} / {service.unit}</p>
                      </div>
                      <Badge color={getServiceStatusBadge(service.isActive).color} className="shrink-0 whitespace-nowrap rounded font-medium justify-center py-1 min-h-[24px]">
                        {getServiceStatusBadge(service.isActive).label}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-tertiary/60 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Bật / tắt dịch vụ</p>
                        <p className="mt-0.5 text-sm text-primary">Cập nhật nhanh trạng thái</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(service.id, service.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${service.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-primary pt-4">
                      <button type="button" onClick={() => handleEdit(service)} className="btn btn-secondary btn-sm">
                        <Edit size={14} />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button type="button" onClick={() => handleDelete(service.id)} className="btn btn-ghost btn-icon text-danger" title="Xóa">
                        <Trash2 size={16} className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredServices.length > itemsPerPage && (
                <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-secondary">
                    Hiển thị {startIndex + 1}–{Math.min(endIndex, filteredServices.length)} trong {filteredServices.length} dịch vụ
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                      let pageNumber = index + 1

                      if (totalPages > 3) {
                        if (currentPage === 1) {
                          pageNumber = index + 1
                        } else if (currentPage === totalPages) {
                          pageNumber = totalPages - 2 + index
                        } else {
                          pageNumber = currentPage - 1 + index
                        }
                      }

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`btn btn-sm ${currentPage === pageNumber ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {pageNumber}
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
            </>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="card border-dashed p-8 lg:p-14">
          <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-tertiary text-tertiary">
              <PackageCheck size={30} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Lịch sử điều chỉnh dịch vụ đang được hoàn thiện</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
                Khu vực này sẽ hiển thị toàn bộ thay đổi biểu phí, trạng thái kích hoạt và dấu vết quản trị, hỗ trợ đối soát dịch vụ minh bạch trên desktop, tablet và mobile.
              </p>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">Hủy đơn dịch vụ</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrderId(null)
                    setCancelReason('')
                  }}
                  className="rounded-lg p-2 transition-colors hover:bg-tertiary"
                >
                  <XCircle size={20} className="text-tertiary" />
                </button>
              </div>
              <p className="mb-4 text-secondary">Vui lòng nêu rõ lý do hủy hoặc từ chối tiếp nhận đơn dịch vụ này:</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                className="input w-full resize-none px-4 py-3"
                rows={4}
              />
              <div className="mt-6 flex items-center gap-3">
                <button type="button" onClick={handleCancelOrder} className="btn btn-danger btn-md flex-1">
                  Xác nhận hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrderId(null)
                    setCancelReason('')
                  }}
                  className="btn btn-secondary btn-md flex-1"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-primary shadow-2xl">
            <div className="border-b border-primary px-6 py-4">
              <h2 className="text-xl font-semibold text-primary">Chỉnh sửa dịch vụ</h2>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-primary">
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
                <label className="mb-2 block text-sm font-medium text-primary">
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
                <p className="mt-1 text-xs text-tertiary">Đơn giá hiện tại: {formatCurrency(editingService.unitPrice)}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-primary">
                  Đơn vị tính <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.unit}
                  onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Chọn đơn vị</option>
                  {['lần', 'tháng', 'ngày', 'giờ', 'kg', 'm²', 'm³'].map(unit => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-primary px-6 py-4">
              <button type="button" onClick={handleSaveEdit} className="btn btn-primary btn-md flex-1">
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

      {showInvoiceModal && contract && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-primary shadow-2xl">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow">
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
                  className="rounded-lg p-2 transition-colors hover:bg-tertiary"
                >
                  <XCircle size={20} className="text-tertiary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Khách hàng</p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{selectedOrder.user.fullName}</p>
                  <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Phòng {selectedOrder.user.contracts[0]?.room?.name || 'N/A'}</p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex items-start gap-3">
                    <Receipt size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Hóa đơn riêng cho dịch vụ</p>
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                        Hóa đơn này sẽ được tạo <strong>riêng biệt</strong>, không gộp vào hóa đơn tháng hiện có.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-primary">Tháng</label>
                    <select
                      value={invoiceData.month}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="input w-full"
                    >
                      {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-primary">Năm</label>
                    <input
                      type="number"
                      value={invoiceData.year}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-primary">
                    Phí dịch vụ (VND)
                    <span className="ml-2 text-xs text-tertiary">(Đơn #{selectedOrder.id}: {selectedOrder.service.name})</span>
                  </label>
                  <input
                    type="number"
                    value={invoiceData.amountService}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, amountService: e.target.value }))}
                    className="input w-full"
                    placeholder="Nhập phí dịch vụ"
                  />
                  <p className="mt-1 text-xs text-tertiary">Tổng tiền đơn hàng: {formatCurrency(selectedOrder.total)}</p>
                </div>

                <div className="rounded-2xl border border-primary bg-tertiary p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Tổng cộng:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(parseFloat(invoiceData.amountService || '0'))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-primary pt-6">
                <button type="button" onClick={handleCreateInvoice} className="btn btn-success btn-md flex-1">
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

      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={cancelConfirm}>
          <div className="w-full max-w-md rounded-2xl bg-primary shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">
                  {confirmAction.type === 'delete' && 'Xóa dịch vụ'}
                  {confirmAction.type === 'accept' && 'Nhận đơn hàng'}
                  {confirmAction.type === 'complete' && 'Hoàn thành đơn hàng'}
                </h2>
                <button onClick={cancelConfirm} className="rounded-lg p-2 hover:bg-tertiary">
                  <X size={20} className="text-secondary" />
                </button>
              </div>
              <p className="mb-6 text-secondary">
                {confirmAction.type === 'delete' && 'Bạn có chắc chắn muốn xóa dịch vụ này?'}
                {confirmAction.type === 'accept' && 'Bạn có chắc chắn muốn nhận đơn hàng này?'}
                {confirmAction.type === 'complete' && 'Bạn có chắc chắn muốn đánh dấu đơn hàng này đã hoàn thành?'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={cancelConfirm} className="btn btn-secondary btn-md" disabled={actionLoading}>
                  Hủy
                </button>
                <button
                  onClick={
                    confirmAction.type === 'delete'
                      ? confirmDelete
                      : confirmAction.type === 'accept'
                        ? confirmAcceptOrder
                        : confirmCompleteOrder
                  }
                  disabled={actionLoading}
                  className={`btn btn-md ${confirmAction.type === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                >
                  {actionLoading
                    ? 'Đang xử lý...'
                    : confirmAction.type === 'delete'
                      ? 'Xóa'
                      : confirmAction.type === 'accept'
                        ? 'Nhận'
                        : 'Hoàn thành'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
