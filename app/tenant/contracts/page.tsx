'use client'

import { useEffect, useState } from 'react'
import { FileText, Calendar, DollarSign, Users, Building2, Download, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Contract {
  id: number
  status: string
  startDate: Date | string
  endDate?: Date | string | null
  deposit?: number | null
  rentPrice?: number | null
  createdAt: Date | string
  room: {
    id: number
    name: string
    floor: number
    price: number
    area?: number | null
    roomType?: string | null
  }
  occupants?: Array<{
    id: number
    fullName: string
    phone?: string | null
    email?: string | null
  }>
}

export default function TenantContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      // Get user ID from localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        console.error('User not found in localStorage')
        return
      }
      const parsedUser = JSON.parse(userData)
      
      // Get user info with userId
      const userRes = await fetch(`/api/tenant/me?userId=${parsedUser.id}`)
      const user = await userRes.json()
      
      if (user.id) {
        const response = await fetch(`/api/contracts?userId=${user.id}`)
        const data = await response.json()
        if (response.ok) {
          setContracts(data)
          if (data.length > 0) {
            setSelectedContract(data[0])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Chưa cập nhật'
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'Chưa cập nhật'
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj)
    } catch {
      return 'Chưa cập nhật'
    }
  }

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return 'Chưa cập nhật'
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'Chưa cập nhật'
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch {
      return 'Chưa cập nhật'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      ACTIVE: {
        label: 'Đang hiệu lực',
        className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded',
        icon: CheckCircle
      },
      EXPIRED: {
        label: 'Đã hết hạn',
        className: 'bg-red-200 dark:bg-red-900/10 text-red-900 dark:text-red-300 border border-red-400 dark:border-red-700 font-semibold',
        icon: XCircle
      },
      PENDING: {
        label: 'Chờ xử lý',
        className: 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-300 border border-yellow-400 dark:border-yellow-700 font-semibold',
        icon: Clock
      },
      CANCELLED: {
        label: 'Đã hủy',
        className: 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-300 border border-gray-400 dark:border-gray-700 font-semibold',
        icon: XCircle
      }
    }
    return statusMap[status] || {
      label: status,
      className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
      icon: FileText
    }
  }

  const getDaysRemaining = (endDate: Date | string | null | undefined) => {
    if (!endDate) return null
    try {
      const end = new Date(endDate)
      if (isNaN(end.getTime())) return null
      const now = new Date()
      const diff = end.getTime() - now.getTime()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Hợp đồng của tôi</h1>
        <p className="text-secondary mt-1">Quản lý và xem chi tiết các hợp đồng thuê phòng</p>
      </div>

      {contracts.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={48} className="text-tertiary mx-auto mb-4" />
          <p className="text-lg font-semibold text-primary mb-2">Bạn chưa có hợp đồng nào</p>
          <p className="text-secondary">Vui lòng liên hệ quản lý để được hỗ trợ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contracts List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-primary">Danh sách hợp đồng</h2>
            <div className="space-y-3">
              {contracts.map((contract) => {
                const statusInfo = getStatusBadge(contract.status)
                const StatusIcon = statusInfo.icon
                const isSelected = selectedContract?.id === contract.id
                
                return (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className={`card cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary mb-1">{contract.room.name}</h3>
                        <p className="text-sm text-secondary">Tầng {contract.room.floor}</p>
                      </div>
                      <StatusIcon 
                        size={20} 
                        className={`${
                          contract.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' :
                          contract.status === 'EXPIRED' ? 'text-red-600 dark:text-red-400' :
                          contract.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                      {contract.endDate && contract.status === 'ACTIVE' && (
                        <span className="text-xs text-secondary">
                          Còn {getDaysRemaining(contract.endDate)} ngày
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contract Details */}
          <div className="lg:col-span-2">
            {selectedContract ? (
              <div className="card">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary">
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-1">
                      Hợp đồng {selectedContract.room.name}
                    </h2>
                    <p className="text-sm text-secondary">Tầng {selectedContract.room.floor}</p>
                  </div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStatusBadge(selectedContract.status).className}`}>
                    {getStatusBadge(selectedContract.status).label}
                  </span>
                </div>

                {/* Contract Info */}
                <div className="space-y-6">
                  {/* Room Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                      </div>
                      Thông tin phòng
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Tên phòng</p>
                        <p className="text-base font-bold text-primary">{selectedContract.room.name}</p>
                      </div>
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Tầng</p>
                        <p className="text-base font-bold text-primary">Tầng {selectedContract.room.floor}</p>
                      </div>
                      {selectedContract.room.area && (
                        <div className="p-4 bg-tertiary rounded-lg border border-primary">
                          <p className="text-xs text-tertiary mb-1">Diện tích</p>
                          <p className="text-base font-bold text-primary">{selectedContract.room.area} m²</p>
                        </div>
                      )}
                      {selectedContract.room.roomType && (
                        <div className="p-4 bg-tertiary rounded-lg border border-primary">
                          <p className="text-xs text-tertiary mb-1">Loại phòng</p>
                          <p className="text-base font-bold text-primary">{selectedContract.room.roomType}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contract Period */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Calendar size={18} className="text-white" />
                      </div>
                      Thời gian hợp đồng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Ngày bắt đầu</p>
                        <p className="text-base font-bold text-primary">
                          {formatDate(selectedContract.startDate)}
                        </p>
                      </div>
                      {selectedContract.endDate && (
                        <div className="p-4 bg-tertiary rounded-lg border border-primary">
                          <p className="text-xs text-tertiary mb-1">Ngày kết thúc</p>
                          <p className="text-base font-bold text-primary">
                            {formatDate(selectedContract.endDate)}
                          </p>
                          {selectedContract.status === 'ACTIVE' && (
                            <p className="text-xs text-secondary mt-1">
                              Còn {getDaysRemaining(selectedContract.endDate)} ngày
                            </p>
                          )}
                        </div>
                      )}
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Ngày tạo hợp đồng</p>
                        <p className="text-base font-bold text-primary">
                          {formatDateTime(selectedContract.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  {(selectedContract.deposit || selectedContract.rentPrice) && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <DollarSign size={18} className="text-white" />
                        </div>
                        Thông tin tài chính
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedContract.rentPrice && (
                          <div className="p-4 bg-tertiary rounded-lg border border-primary">
                            <p className="text-xs text-tertiary mb-1">Giá thuê/tháng</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(Number(selectedContract.rentPrice))}
                            </p>
                          </div>
                        )}
                        {selectedContract.deposit && (
                          <div className="p-4 bg-tertiary rounded-lg border border-primary">
                            <p className="text-xs text-tertiary mb-1">Tiền cọc</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(Number(selectedContract.deposit))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Occupants */}
                  {selectedContract.occupants && selectedContract.occupants.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Users size={18} className="text-white" />
                        </div>
                        Người ở cùng
                      </h3>
                      <div className="space-y-2">
                        {selectedContract.occupants.map((occupant) => (
                          <div
                            key={occupant.id}
                            className="p-4 bg-tertiary rounded-lg border border-primary"
                          >
                            <p className="font-semibold text-primary">{occupant.fullName}</p>
                            {occupant.phone && (
                              <p className="text-sm text-secondary mt-1">Điện thoại: {occupant.phone}</p>
                            )}
                            {occupant.email && (
                              <p className="text-sm text-secondary">Email: {occupant.email}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <FileText size={48} className="text-tertiary mx-auto mb-4" />
                <p className="text-secondary">Chọn một hợp đồng để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
