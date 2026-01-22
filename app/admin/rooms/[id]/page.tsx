'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, X, Building2, Users, DollarSign, Ruler, Home, Wrench, FileText, AlertCircle } from 'lucide-react'
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
    startDate: Date | string
    endDate: Date | string
    user: {
      id: number
      fullName: string
      phone: string
    }
  }>
}

export default function EditRoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    floor: '',
    area: '',
    maxPeople: '2',
    price: '',
    status: 'AVAILABLE',
    roomType: 'Studio',
    description: '',
    amenities: [] as string[]
  })

  useEffect(() => {
    if (roomId) {
      fetchRoom()
    }
  }, [roomId])

  const fetchRoom = async () => {
    if (!roomId) {
      alert('ID phòng không hợp lệ')
      router.push('/admin/rooms')
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const data = await response.json()

      if (response.ok) {
        setRoom(data)
        setFormData({
          name: data.name || '',
          floor: data.floor?.toString() || '',
          area: data.area?.toString() || '',
          maxPeople: data.maxPeople?.toString() || '2',
          price: data.price?.toString() || '',
          status: data.status || 'AVAILABLE',
          roomType: data.roomType || 'Studio',
          description: data.description || '',
          amenities: data.amenities || []
        })
      } else {
        alert(data.error || 'Không tìm thấy phòng')
        router.push('/admin/rooms')
      }
    } catch (error) {
      console.error('Error fetching room:', error)
      alert('Có lỗi xảy ra khi tải thông tin phòng. Vui lòng thử lại sau.')
      router.push('/admin/rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!roomId) {
      alert('ID phòng không hợp lệ')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Cập nhật phòng thành công!')
        router.push('/admin/rooms')
        router.refresh()
      } else {
        alert(data.error || 'Có lỗi xảy ra khi cập nhật phòng')
      }
    } catch (error) {
      console.error('Error updating room:', error)
      alert('Có lỗi xảy ra khi cập nhật phòng. Vui lòng thử lại sau.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return { ...prev, amenities: [...prev.amenities, amenity] }
      } else {
        return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) }
      }
    })
  }

  const adjustMaxPeople = (delta: number) => {
    const current = parseInt(formData.maxPeople) || 1
    const newValue = Math.max(1, current + delta)
    setFormData(prev => ({ ...prev, maxPeople: newValue.toString() }))
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

  const getStatusColor = (status: string) => {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-tertiary">Đang tải thông tin phòng...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  const activeContract = room.contracts?.find(c => c.user) || null

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/rooms"
            className="btn btn-ghost btn-icon"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Chỉnh sửa phòng</h1>
            <p className="text-secondary mt-1 text-sm sm:text-base">Cập nhật thông tin chi tiết của phòng {room.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/admin/rooms"
            className="btn btn-secondary btn-sm sm:btn-md"
          >
            <X size={18} />
            <span>Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary btn-sm sm:btn-md"
          >
            <Save size={18} />
            <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Current Status Alert */}
            {activeContract && (
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary mb-1">Phòng đang được thuê</p>
                    <p className="text-sm text-secondary mb-2">
                      <span className="font-medium">Khách thuê:</span> {activeContract.user.fullName}
                    </p>
                    <p className="text-sm text-secondary mb-2">
                      <span className="font-medium">SĐT:</span> {activeContract.user.phone}
                    </p>
                    <p className="text-xs text-tertiary">
                      <span className="font-medium">Hợp đồng:</span> {formatDate(activeContract.startDate)} - {formatDate(activeContract.endDate)}
                    </p>
                  </div>
                  <span className={getStatusColor(room.status)}>
                    {getStatusLabel(room.status)}
                  </span>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Home className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-primary">Thông tin cơ bản</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Số phòng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="VD: P.101"
                      required
                      className="w-full px-4 py-2.5 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Tầng <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="floor"
                      value={formData.floor}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Chọn tầng</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(floor => (
                        <option key={floor} value={floor}>Tầng {floor}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Diện tích (m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        placeholder="VD: 25.5"
                        className="w-full px-4 py-2.5 pr-12 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary text-sm">m²</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Số người tối đa
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustMaxPeople(-1)}
                        className="w-11 h-11 border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 flex items-center justify-center text-primary transition-all"
                      >
                        <span className="text-lg font-semibold">−</span>
                      </button>
                      <input
                        type="number"
                        name="maxPeople"
                        value={formData.maxPeople}
                        onChange={handleChange}
                        min="1"
                        className="w-24 px-4 py-2.5 border border-primary rounded-lg text-center bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => adjustMaxPeople(1)}
                        className="w-11 h-11 border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 flex items-center justify-center text-primary transition-all"
                      >
                        <span className="text-lg font-semibold">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost & Description */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-primary">Chi phí & Mô tả</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Giá thuê cơ bản (VND/tháng) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      placeholder="VD: 3000000"
                      className="w-full px-4 py-2.5 pr-12 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary text-sm font-medium">₫</span>
                  </div>
                  <p className="text-xs text-tertiary mt-2 flex items-center gap-1">
                    <span>ℹ️</span>
                    <span>Giá này chưa bao gồm điện, nước và dịch vụ khác.</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Mô tả phòng
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Nhập mô tả chi tiết về tiện nghi phòng, hướng cửa số, nội thất có sẵn..."
                    className="w-full px-4 py-2.5 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Room Summary */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Building2 className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-primary">Tóm tắt</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary hover:border-blue-500 transition-colors">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <Building2 className="text-white" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-tertiary mb-0.5">Số phòng</p>
                    <p className="text-sm font-semibold text-primary truncate">{room.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary hover:border-blue-500 transition-colors">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <Ruler className="text-white" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-tertiary mb-0.5">Diện tích</p>
                    <p className="text-sm font-semibold text-primary">
                      {room.area ? `${room.area} m²` : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary hover:border-blue-500 transition-colors">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <Users className="text-white" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-tertiary mb-0.5">Số người tối đa</p>
                    <p className="text-sm font-semibold text-primary">{room.maxPeople} người</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary hover:border-blue-500 transition-colors">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <DollarSign className="text-white" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-tertiary mb-0.5">Giá thuê</p>
                    <p className="text-sm font-semibold text-primary truncate">{formatCurrency(Number(room.price))}</p>
                  </div>
                </div>
                {room.roomType && (
                  <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary hover:border-blue-500 transition-colors">
                    <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <Home className="text-white" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-tertiary mb-0.5">Loại phòng</p>
                      <p className="text-sm font-semibold text-primary">{room.roomType}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description & Amenities Display */}
            {(room.description || (room.amenities && room.amenities.length > 0)) && (
              <div className="card">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                    <FileText className="text-white" size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-primary">Thông tin chi tiết</h2>
                </div>
                <div className="space-y-4">
                  {room.description && (
                    <div>
                      <p className="text-sm font-medium text-primary mb-2">Mô tả phòng</p>
                      <p className="text-sm text-secondary whitespace-pre-wrap bg-tertiary p-3 rounded-lg border border-primary">
                        {room.description}
                      </p>
                    </div>
                  )}
                  {room.amenities && room.amenities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-primary mb-2">Tiện ích</p>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 text-primary dark:text-primary rounded-lg text-xs font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Classification */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Home className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-primary">Phân loại</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Loại phòng <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="Studio">Studio</option>
                    <option value="1N1K">1N1K (1 phòng ngủ, 1 phòng khách)</option>
                    <option value="2N1K">2N1K (2 phòng ngủ, 1 phòng khách)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-3">
                    Tiện ích đi kèm
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[' Điều hòa', ' Nóng lạnh', ' Tủ lạnh', ' Giường tủ', ' Máy giặt chung'].map(amenity => (
                      <label 
                        key={amenity} 
                        className={`flex items-center gap-2 p-2 border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 cursor-pointer transition-all group ${formData.amenities.includes(amenity) ? 'bg-tertiary border-blue-500' : ''}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={formData.amenities.includes(amenity)}
                          onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                          className="w-4 h-4 flex-shrink-0" 
                        />
                        <span className="text-xs font-medium text-primary group-hover:text-blue-600 transition-colors select-none">
                          {amenity}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Wrench className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-primary">Trạng thái</h2>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 cursor-pointer transition-all group">
                  <input
                    type="radio"
                    name="status"
                    value="AVAILABLE"
                    checked={formData.status === 'AVAILABLE'}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary group-hover:text-blue-600 transition-colors">Trống (Sẵn sàng)</span>
                    <p className="text-xs text-tertiary mt-0.5">Phòng có thể cho thuê ngay</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 cursor-pointer transition-all group ${!activeContract ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value="RENTED"
                    checked={formData.status === 'RENTED'}
                    onChange={handleChange}
                    disabled={!activeContract}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary group-hover:text-blue-600 transition-colors">Đang thuê</span>
                    <p className="text-xs text-tertiary mt-0.5">Phòng đang có khách thuê</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 cursor-pointer transition-all group">
                  <input
                    type="radio"
                    name="status"
                    value="MAINTENANCE"
                    checked={formData.status === 'MAINTENANCE'}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary group-hover:text-blue-600 transition-colors">Đang bảo trì</span>
                    <p className="text-xs text-tertiary mt-0.5">Phòng đang được sửa chữa/bảo trì</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-primary">Thao tác nhanh</h2>
              </div>
              <div className="space-y-2">
                {activeContract && (
                  <Link
                    href={`/admin/residents/${activeContract.user.id}`}
                    className="block w-full px-4 py-2.5 text-sm border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 text-center transition-all text-primary font-medium"
                  >
                    Xem thông tin khách thuê
                  </Link>
                )}
                <Link
                  href={`/admin/rooms/${roomId}/contracts`}
                  className="block w-full px-4 py-2.5 text-sm border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 text-center transition-all text-primary font-medium"
                >
                  Xem lịch sử hợp đồng
                </Link>
                <Link
                  href={`/admin/maintenance?room=${roomId}`}
                  className="block w-full px-4 py-2.5 text-sm border border-primary rounded-lg hover:bg-tertiary hover:border-blue-500 text-center transition-all text-primary font-medium"
                >
                  Xem sự cố phòng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
