'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, X, Building2, Users, DollarSign, Ruler } from 'lucide-react'
import Link from 'next/link'

interface Room {
  id: number
  name: string
  floor: number
  price: number
  area: number | null
  maxPeople: number
  status: string
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
    description: ''
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
          description: ''
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
        return 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 font-semibold'
      case 'AVAILABLE':
        return 'badge badge-success'
      case 'MAINTENANCE':
        return 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 font-semibold'
      default:
        return 'bg-tertiary text-primary border-primary'
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
        <p className="text-tertiary">Đang tải...</p>
      </div>
    )
  }

  if (!room) {
    return null
  }

  const activeContract = room.contracts?.find(c => c.user) || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Chỉnh sửa phòng</h1>
          <p className="text-secondary mt-1">Cập nhật thông tin chi tiết của phòng {room.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/rooms"
            className="btn btn-secondary btn-md"
          >
            <X size={18} />
            <span>Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary btn-md"
          >
            <Save size={18} />
            <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status Card */}
            {activeContract && (
              <div className="card stat-card-blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">Phòng đang được thuê</p>
                    <p className="text-sm text-secondary mt-1">
                      Khách thuê: {activeContract.user.fullName} | SĐT: {activeContract.user.phone}
                    </p>
                    <p className="text-xs text-tertiary mt-1">
                      Hợp đồng: {formatDate(activeContract.startDate)} - {formatDate(activeContract.endDate)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                    {getStatusLabel(room.status)}
                  </span>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Số phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: P.101"
                    required
                    className="w-full px-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Tầng <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="floor"
                      value={formData.floor}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn tầng</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(floor => (
                        <option key={floor} value={floor}>Tầng {floor}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
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
                        className="w-full px-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary">m²</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Số người tối đa
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustMaxPeople(-1)}
                      className="w-10 h-10 border border-primary rounded-lg hover:bg-tertiary flex items-center justify-center transition-colors text-primary"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      name="maxPeople"
                      value={formData.maxPeople}
                      onChange={handleChange}
                      min="1"
                      className="w-20 px-4 py-2 border border-primary rounded-lg text-center bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => adjustMaxPeople(1)}
                      className="w-10 h-10 border border-primary rounded-lg hover:bg-tertiary flex items-center justify-center transition-colors text-primary"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost & Description */}
            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">Chi phí & Mô tả</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
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
                      className="w-full px-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary">₫</span>
                  </div>
                  <p className="text-xs text-tertiary mt-1">
                    Giá này chưa bao gồm điện, nước và dịch vụ khác.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Mô tả phòng
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Nhập mô tả chi tiết về tiện nghi phòng, hướng cửa số, nội thất có sẵn..."
                    className="w-full px-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Room Status Summary */}
            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">TÓM TẮT</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                    <Building2 className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Số phòng</p>
                    <p className="text-sm font-semibold text-primary">{room.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                    <Ruler className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Diện tích</p>
                    <p className="text-sm font-semibold text-primary">
                      {room.area ? `${room.area} m²` : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <Users className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Số người tối đa</p>
                    <p className="text-sm font-semibold text-primary">{room.maxPeople} người</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-tertiary rounded-lg border border-primary">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                    <DollarSign className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Giá thuê</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(Number(room.price))}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">TRẠNG THÁI</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border border-primary rounded-lg hover:bg-tertiary cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="AVAILABLE"
                    checked={formData.status === 'AVAILABLE'}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary">Trống (Sẵn sàng)</span>
                    <p className="text-xs text-tertiary">Phòng có thể cho thuê ngay</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 border border-primary rounded-lg hover:bg-tertiary cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="RENTED"
                    checked={formData.status === 'RENTED'}
                    onChange={handleChange}
                    disabled={!activeContract}
                    className="text-blue-600 dark:text-blue-400 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary">Đang thuê</span>
                    <p className="text-xs text-tertiary">Phòng đang có khách thuê</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 border border-primary rounded-lg hover:bg-tertiary cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="MAINTENANCE"
                    checked={formData.status === 'MAINTENANCE'}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary">Đang bảo trì</span>
                    <p className="text-xs text-tertiary">Phòng đang được sửa chữa/bảo trì</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">THAO TÁC NHANH</h2>
              <div className="space-y-2">
                {activeContract && (
                  <Link
                    href={`/admin/residents/${activeContract.user.id}`}
                    className="block w-full px-4 py-2 text-sm border border-primary rounded-lg hover:bg-tertiary text-center transition-colors text-primary"
                  >
                    Xem thông tin khách thuê
                  </Link>
                )}
                <Link
                  href={`/admin/rooms/${roomId}/contracts`}
                  className="block w-full px-4 py-2 text-sm border border-primary rounded-lg hover:bg-tertiary text-center transition-colors text-primary"
                >
                  Xem lịch sử hợp đồng
                </Link>
                <Link
                  href={`/admin/maintenance?room=${roomId}`}
                  className="block w-full px-4 py-2 text-sm border border-primary rounded-lg hover:bg-tertiary text-center transition-colors text-primary"
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
