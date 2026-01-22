'use client'

import { useEffect, useState } from 'react'
import { Building2, Ruler, Users, DollarSign, Home, MapPin, FileText, Calendar, Phone, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Room {
  id: number
  name: string
  floor: number
  price: number
  area: number | null
  maxPeople: number
  status: string
  roomType?: string | null
  description?: string | null
  amenities?: string[]
  contracts: Array<{
    id: number
    status: string
    startDate?: Date | string
    endDate?: Date | string
    deposit?: number
    rentPrice?: number
    user: {
      id: number
      fullName: string
      phone?: string
      email?: string
    }
    occupants?: Array<{
      id: number
      fullName: string
    }>
  }>
}

export default function TenantRoomsPage() {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyRoom()
  }, [])

  const fetchMyRoom = async () => {
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
      
      if (user.contracts && user.contracts.length > 0) {
        const contract = user.contracts[0]
        const roomId = contract.roomId
        
        // Fetch room details
        const response = await fetch(`/api/rooms/${roomId}`)
        const data = await response.json()
        if (response.ok) {
          setRoom(data)
        }
      }
    } catch (error) {
      console.error('Error fetching room:', error)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RENTED':
        return 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded'
      case 'AVAILABLE':
        return 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded'
      case 'MAINTENANCE':
        return 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded'
      default:
        return 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'RENTED':
        return 'Đang thuê'
      case 'AVAILABLE':
        return 'Trống'
      case 'MAINTENANCE':
        return 'Đang bảo trì'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Phòng của tôi</h1>
          <p className="text-secondary mt-1">Thông tin phòng bạn đang thuê</p>
        </div>
        <div className="card text-center py-12">
          <Building2 size={48} className="text-tertiary mx-auto mb-4" />
          <p className="text-lg font-semibold text-primary mb-2">Bạn chưa có phòng thuê</p>
          <p className="text-secondary">Vui lòng liên hệ quản lý để được hỗ trợ</p>
        </div>
      </div>
    )
  }

  const activeContract = room.contracts.find(c => c.status === 'ACTIVE') || room.contracts[0]
  const currentOccupants = activeContract 
    ? 1 + (activeContract.occupants?.length || 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Phòng của tôi</h1>
        <p className="text-secondary mt-1">Thông tin chi tiết về phòng bạn đang thuê</p>
      </div>

      {/* Room Overview Card */}
      <div className="card bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">{room.name}</h2>
              <p className="text-secondary flex items-center gap-2 mt-1">
                <MapPin size={16} />
                Tầng {room.floor}
                {room.roomType && (
                  <>
                    <span className="mx-1">•</span>
                    {room.roomType}
                  </>
                )}
              </p>
            </div>
          </div>
          <span className={getStatusBadge(room.status)}>
            {getStatusLabel(room.status)}
          </span>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group">
          <p className="text-xs text-tertiary mb-2 font-medium uppercase tracking-wide">Diện tích</p>
          <p className="text-xl font-bold text-primary flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <Ruler size={22} className="text-blue-500" />
            {room.area ? `${room.area} m²` : 'Chưa cập nhật'}
          </p>
        </div>

        <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all group">
          <p className="text-xs text-tertiary mb-2 font-medium uppercase tracking-wide">Số người ở</p>
          <p className="text-xl font-bold text-primary flex items-center gap-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            <Users size={22} className="text-purple-500" />
            {currentOccupants}/{room.maxPeople} người
          </p>
        </div>

        <div className="p-5 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all group">
          <p className="text-xs text-tertiary mb-2 font-medium uppercase tracking-wide">Giá thuê/tháng</p>
          <p className="text-xl font-bold text-primary flex items-center gap-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            <DollarSign size={22} className="text-green-500" />
            {formatCurrency(Number(room.price))}
          </p>
        </div>

        {room.roomType && (
          <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all group">
            <p className="text-xs text-tertiary mb-2 font-medium uppercase tracking-wide">Loại phòng</p>
            <p className="text-xl font-bold text-primary flex items-center gap-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              <Home size={22} className="text-orange-500" />
              {room.roomType}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Room Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {room.description && (
            <div className="card hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <FileText size={20} className="text-white" />
                </div>
                Mô tả phòng
              </h3>
              <div className="bg-gradient-to-br from-tertiary to-secondary/30 p-5 rounded-xl border border-primary">
                <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                  {room.description}
                </p>
              </div>
            </div>
          )}

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="card hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <CheckCircle size={20} className="text-white" />
                </div>
                Tiện ích phòng
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {room.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="px-4 py-2.5 text-primary dark:text-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-tertiary transition-colors"
                  >
                    <CheckCircle size={16} className="text-primary dark:text-primary flex-shrink-0" />
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Contract Info */}
        <div className="space-y-6">
          {activeContract ? (
            <div className="card bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-teal-900/20 border-2 border-green-300 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-primary mb-5 flex items-center gap-3 pb-3 border-b border-green-200 dark:border-green-800">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <FileText size={20} className="text-white" />
                </div>
                Thông tin hợp đồng
              </h3>
              <div className="space-y-4">
                {activeContract.startDate && (
                  <div>
                    <p className="text-xs text-tertiary mb-2">Thời gian hợp đồng</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-tertiary" />
                        <span className="text-secondary">
                          Bắt đầu: {formatDate(activeContract.startDate)}
                        </span>
                      </div>
                      {activeContract.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-tertiary" />
                          <span className="text-secondary">
                            Kết thúc: {formatDate(activeContract.endDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(activeContract.deposit || activeContract.rentPrice) && (
                  <div className="pt-3 border-t border-primary">
                    <p className="text-xs text-tertiary mb-2">Thông tin tài chính</p>
                    <div className="space-y-1">
                      {activeContract.deposit && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary">Tiền cọc:</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(Number(activeContract.deposit))}
                          </span>
                        </div>
                      )}
                      {activeContract.rentPrice && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary">Giá thuê:</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(Number(activeContract.rentPrice))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeContract.occupants && activeContract.occupants.length > 0 && (
                  <div className="pt-3 border-t border-primary">
                    <p className="text-xs text-tertiary mb-2">Người ở cùng</p>
                    <div className="space-y-1">
                      {activeContract.occupants.map((occupant) => (
                        <div key={occupant.id} className="text-sm text-secondary flex items-center gap-2">
                          <Users size={14} />
                          {occupant.fullName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t border-primary mt-3">
                  <Link
                    href="/tenant/contracts"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 flex items-center gap-2 font-medium"
                  >
                    <FileText size={14} />
                    Xem chi tiết hợp đồng
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-tertiary border-dashed border-2 border-primary">
              <div className="text-center py-8">
                <FileText size={48} className="text-tertiary mx-auto mb-3" />
                <p className="text-sm text-tertiary">Chưa có hợp đồng</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
