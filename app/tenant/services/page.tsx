'use client'

import { useEffect, useState } from 'react'
import { Search, ShoppingCart, Clock, CheckCircle, XCircle, AlertCircle, Plus, Minus, X } from 'lucide-react'

interface Service {
  id: number
  name: string
  unitPrice: number
  unit: string
  isActive: boolean
  description?: string
  category?: string
}

interface ServiceOrder {
  id: number
  quantity: number
  total: number
  orderDate: Date | string
  status: string
  note?: string
  service: {
    id: number
    name: string
    unit: string
    unitPrice: number
  }
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'services' | 'orders'>('services')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [orderNote, setOrderNote] = useState('')

  useEffect(() => {
    fetchServices()
    fetchOrders()
  }, [search, categoryFilter])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('isActive', 'true')
      params.append('forTenant', 'true')
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

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const response = await fetch('/api/tenant/service-orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleOpenOrderModal = (service: Service) => {
    setSelectedService(service)
    setQuantity(1)
    setOrderNote('')
    setShowOrderModal(true)
  }

  const handleOrder = async () => {
    if (!selectedService) return

    try {
      const response = await fetch('/api/tenant/service-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          quantity,
          note: orderNote.trim() || undefined
        })
      })

      if (response.ok) {
        alert('Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.')
        setShowOrderModal(false)
        setSelectedService(null)
        setQuantity(1)
        setOrderNote('')
        fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error ordering service:', error)
      alert('Có lỗi xảy ra khi đặt dịch vụ')
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
    const d = new Date(date)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getServiceIcon = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('dọn') || nameLower.includes('vệ sinh')) return '🧹'
    if (nameLower.includes('giặt')) return '👕'
    if (nameLower.includes('máy lạnh') || nameLower.includes('điều hòa')) return '❄️'
    if (nameLower.includes('nước')) return '💧'
    if (nameLower.includes('bbq') || nameLower.includes('tiệc')) return '🍖'
    if (nameLower.includes('côn trùng') || nameLower.includes('diệt')) return '🐛'
    if (nameLower.includes('internet') || nameLower.includes('wifi')) return '📶'
    return '📋'
  }

  const getServiceCategory = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('dọn') || nameLower.includes('vệ sinh')) return 'Vệ sinh'
    if (nameLower.includes('giặt')) return 'Giặt ủi'
    if (nameLower.includes('máy lạnh') || nameLower.includes('điều hòa') || nameLower.includes('sửa')) return 'Sửa chữa'
    if (nameLower.includes('nước')) return 'Tiện ích'
    if (nameLower.includes('bbq') || nameLower.includes('tiệc')) return 'Tiện ích'
    if (nameLower.includes('côn trùng') || nameLower.includes('diệt')) return 'Sửa chữa'
    return 'Tiện ích'
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      PENDING: { 
        label: 'Chờ xử lý', 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock
      },
      PROCESSING: { 
        label: 'Đang xử lý', 
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: AlertCircle
      },
      DONE: { 
        label: 'Hoàn thành', 
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle
      },
      CANCELLED: { 
        label: 'Đã hủy', 
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: XCircle
      }
    }
    return statusMap[status] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: AlertCircle
    }
  }

  const filteredServices = services.filter(service => {
    if (categoryFilter === 'all') return true
    return getServiceCategory(service.name) === categoryFilter
  })

  const totalPrice = selectedService ? Number(selectedService.unitPrice) * quantity : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dịch vụ</h1>
        <p className="text-gray-600 mt-1">Đặt các dịch vụ tiện ích cho căn hộ của bạn</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Dịch vụ
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 relative ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Đơn hàng của tôi
            {orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <>
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm dịch vụ (Vệ sinh, sửa chữa, giặt ủi...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tất cả
            </button>
            {['Vệ sinh', 'Giặt ủi', 'Sửa chữa', 'Tiện ích'].map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoryFilter === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải dịch vụ...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const category = getServiceCategory(service.name)
                const isFree = Number(service.unitPrice) === 0

                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    <div className="aspect-video bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative">
                      <span className="text-6xl">{getServiceIcon(service.name)}</span>
                      {category === 'Vệ sinh' && (
                        <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-md">
                          Hot
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {service.description || `Dịch vụ ${service.name.toLowerCase()} chất lượng cao`}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xl font-bold text-gray-900">
                            {isFree ? 'Miễn phí' : formatCurrency(Number(service.unitPrice))}
                          </p>
                          {!isFree && (
                            <p className="text-xs text-gray-500 mt-0.5">/{service.unit}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                          {category}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenOrderModal(service)}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        <ShoppingCart size={18} />
                        <span>{isFree ? 'Đặt chỗ' : 'Đặt ngay'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredServices.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy dịch vụ</h3>
              <p className="text-gray-500">Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        ordersLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingCart className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
            <p className="text-gray-500">Bạn chưa đặt dịch vụ nào. Hãy xem các dịch vụ có sẵn!</p>
            <button
              onClick={() => setActiveTab('services')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem dịch vụ
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusBadge = getStatusBadge(order.status)
              const StatusIcon = statusBadge.icon

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-2xl">
                          {getServiceIcon(order.service.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{order.service.name}</h3>
                          <p className="text-sm text-gray-500">
                            Đặt ngày: {formatDate(order.orderDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${statusBadge.className}`}>
                      <StatusIcon size={14} />
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Số lượng</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {order.quantity} {order.service.unit}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>

                  {order.note && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-700 font-medium mb-1">Ghi chú:</p>
                      <p className="text-sm text-blue-900">{order.note}</p>
                    </div>
                  )}

                  {order.status === 'DONE' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle size={16} />
                        <span>Dịch vụ đã được hoàn thành</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Order Modal */}
      {showOrderModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Đặt dịch vụ</h2>
                <button
                  onClick={() => {
                    setShowOrderModal(false)
                    setSelectedService(null)
                    setQuantity(1)
                    setOrderNote('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-3xl">
                    {getServiceIcon(selectedService.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{selectedService.name}</h3>
                    <p className="text-sm text-gray-500">{selectedService.description || `Dịch vụ ${selectedService.name.toLowerCase()}`}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Đơn giá:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(Number(selectedService.unitPrice))} / {selectedService.unit}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={18} className="text-gray-600" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-lg font-semibold border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={18} className="text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-600 ml-2">{selectedService.unit}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tổng cộng:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowOrderModal(false)
                    setSelectedService(null)
                    setQuantity(1)
                    setOrderNote('')
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleOrder}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Xác nhận đặt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
