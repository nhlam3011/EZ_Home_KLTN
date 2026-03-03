'use client'

import { useEffect, useState } from 'react'
import { Search, ShoppingCart, Clock, CheckCircle, XCircle, AlertCircle, Plus, Minus, X, Loader2 } from 'lucide-react'

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

      // Lọc bỏ các dịch vụ không được phép đặt (điện, nước, dịch vụ chung)
      const excludedServices = ['Điện', 'Nước', 'Dịch vụ chung', 'Phí quản lý', 'Phí dịch vụ']
      const filteredData = data.filter((service: Service) => {
        const serviceName = service.name.toLowerCase()
        return !excludedServices.some(excluded =>
          serviceName.includes(excluded.toLowerCase()) ||
          serviceName === excluded.toLowerCase()
        )
      })

      setServices(filteredData)
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
        className: 'badge badge-warning',
        icon: Clock
      },
      PROCESSING: {
        label: 'Đang xử lý',
        className: 'badge badge-info',
        icon: AlertCircle
      },
      DONE: {
        label: 'Hoàn thành',
        className: 'badge badge-success',
        icon: CheckCircle
      },
      CANCELLED: {
        label: 'Đã hủy',
        className: 'badge badge-error',
        icon: XCircle
      }
    }
    return statusMap[status] || {
      label: status,
      className: 'badge badge-info',
      icon: AlertCircle
    }
  }

  const filteredServices = services.filter(service => {
    if (categoryFilter === 'all') return true
    return getServiceCategory(service.name) === categoryFilter
  })

  const totalPrice = selectedService ? Number(selectedService.unitPrice) * quantity : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Dịch vụ</h1>
        <p className="text-sm sm:text-base text-secondary mt-1">Đặt các dịch vụ tiện ích cho căn hộ của bạn</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary">
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'services'
              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            Dịch vụ
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 relative whitespace-nowrap ${activeTab === 'orders'
              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            Đơn hàng của tôi
            {orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">
                {orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <>
          {/* Search and Filters */}
          <div className="card p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-secondary whitespace-nowrap font-medium w-auto">DANH MỤC:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="select flex-1"
                >
                  <option value="all">Tất cả</option>
                  <option value="Vệ sinh">Vệ sinh</option>
                  <option value="Giặt ủi">Giặt ủi</option>
                  <option value="Sửa chữa">Sửa chữa</option>
                  <option value="Tiện ích">Tiện ích</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm dịch vụ (Vệ sinh, sửa chữa, giặt ủi...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-with-icon w-full pl-9 sm:pl-12 pr-4 py-2 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="card">
              <div className="text-center py-12">
                <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
                <p className="text-tertiary">Đang tải dịch vụ...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredServices.map((service) => {
                const category = getServiceCategory(service.name)
                const isFree = Number(service.unitPrice) === 0

                return (
                  <div
                    key={service.id}
                    className="card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
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
                        <h3 className="text-lg font-bold text-primary mb-1">{service.name}</h3>
                        <p className="text-sm text-secondary line-clamp-2">
                          {service.description || `Dịch vụ ${service.name.toLowerCase()} chất lượng cao`}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xl font-bold text-primary">
                            {isFree ? 'Miễn phí' : formatCurrency(Number(service.unitPrice))}
                          </p>
                          {!isFree && (
                            <p className="text-xs text-tertiary mt-0.5">/{service.unit}</p>
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
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Không tìm thấy dịch vụ</h3>
              <p className="text-tertiary">Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
            </div>
          )}
        </>
      )
      }

      {/* Orders Tab */}
      {
        activeTab === 'orders' && (
          ordersLoading ? (
            <div className="card">
              <div className="text-center py-12">
                <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
                <p className="text-tertiary">Đang tải đơn hàng...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="card p-12 text-center">
              <ShoppingCart className="mx-auto text-tertiary mb-4" size={48} />
              <h3 className="text-lg font-semibold text-primary mb-2">Chưa có đơn hàng</h3>
              <p className="text-tertiary">Bạn chưa đặt dịch vụ nào. Hãy xem các dịch vụ có sẵn!</p>
              <button
                onClick={() => setActiveTab('services')}
                className="btn btn-primary btn-md mt-4"
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
                    className="card rounded-xl p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-2xl">
                            {getServiceIcon(order.service.name)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-primary">{order.service.name}</h3>
                            <p className="text-sm text-tertiary">
                              Đặt ngày: {formatDate(order.orderDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1.5 whitespace-nowrap ${statusBadge.className}`}>
                        <StatusIcon size={12} className="sm:w-[14px] sm:h-[14px]" />
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-tertiary rounded-lg p-3">
                        <p className="text-xs text-tertiary mb-1">Số lượng</p>
                        <p className="text-sm font-semibold text-primary">
                          {order.quantity} {order.service.unit}
                        </p>
                      </div>
                      <div className="bg-tertiary rounded-lg p-3">
                        <p className="text-xs text-tertiary mb-1">Tổng tiền</p>
                        <p className="text-sm font-semibold text-primary">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>

                    {order.note && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 mb-4">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Ghi chú:</p>
                        <p className="text-sm text-blue-900 dark:text-blue-200">{order.note}</p>
                      </div>
                    )}

                    {order.status === 'DONE' && (
                      <div className="pt-4 border-t border-primary">
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
        )
      }

      {/* Order Modal */}
      {
        showOrderModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="card rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-primary">Đặt dịch vụ</h2>
                  <button
                    onClick={() => {
                      setShowOrderModal(false)
                      setSelectedService(null)
                      setQuantity(1)
                      setOrderNote('')
                    }}
                    className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                  >
                    <X size={20} className="text-tertiary" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-3xl">
                      {getServiceIcon(selectedService.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-primary">{selectedService.name}</h3>
                      <p className="text-sm text-tertiary">{selectedService.description || `Dịch vụ ${selectedService.name.toLowerCase()}`}</p>
                    </div>
                  </div>

                  <div className="bg-tertiary rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-secondary">Đơn giá:</span>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(Number(selectedService.unitPrice))} / {selectedService.unit}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Số lượng
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-lg border border-primary flex items-center justify-center hover:bg-tertiary transition-colors"
                      >
                        <Minus size={18} className="text-secondary" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="input w-20 text-center text-lg font-semibold py-2"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-lg border border-primary flex items-center justify-center hover:bg-tertiary transition-colors"
                      >
                        <Plus size={18} className="text-secondary" />
                      </button>
                      <span className="text-sm text-secondary ml-2">{selectedService.unit}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                      rows={3}
                      className="input w-full px-4 py-2 resize-none"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">Tổng cộng:</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
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
                    className="flex-1 px-4 py-2.5 border-2 border-primary text-primary rounded-lg hover:bg-tertiary transition-colors font-medium"
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
        )
      }
    </div >
  )
}
