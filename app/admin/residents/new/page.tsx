'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, X, Loader2, User, Plus, Users } from 'lucide-react'

interface Occupant {
  fullName: string
  cccdNumber: string
  phone: string
  dob: string
  relationship: string
}

export default function NewResidentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [occupants, setOccupants] = useState<Occupant[]>([])
  const [formData, setFormData] = useState({
    phone: '',
    fullName: '',
    email: '',
    cccdNumber: '',
    dob: '',
    address: '',
    roomId: '',
    startDate: '',
    endDate: '',
    deposit: '',
    rentPrice: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAvailableRooms()
  }, [])

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch('/api/rooms?status=AVAILABLE')
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          occupants: occupants
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Tạo cư dân và hợp đồng thành công! Mật khẩu ban đầu là số CCCD.')
        router.push('/admin/residents')
        router.refresh()
      } else {
        setErrors({ submit: data.error || 'Có lỗi xảy ra' })
      }
    } catch (error) {
      console.error('Error creating resident:', error)
      setErrors({ submit: 'Có lỗi xảy ra khi tạo cư dân' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-fill password with CCCD when CCCD is entered
    if (name === 'cccdNumber') {
      // This will be handled server-side
    }
  }

  const addOccupant = () => {
    setOccupants([...occupants, {
      fullName: '',
      cccdNumber: '',
      phone: '',
      dob: '',
      relationship: ''
    }])
  }

  const removeOccupant = (index: number) => {
    setOccupants(occupants.filter((_, i) => i !== index))
  }

  const updateOccupant = (index: number, field: keyof Occupant, value: string) => {
    const updated = [...occupants]
    updated[index] = { ...updated[index], [field]: value }
    setOccupants(updated)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Check-in Cư dân mới</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Nhập thông tin để tạo hợp đồng và tài khoản cho cư dân mới</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Link
            href="/admin/residents"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <X size={18} />
            <span>Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span className="hidden sm:inline">Lưu và tạo hợp đồng</span>
                <span className="sm:hidden">Lưu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              <span>Thông tin cá nhân</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="0901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số CCCD/CMND <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cccdNumber"
                  value={formData.cccdNumber}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="012345678901"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mật khẩu ban đầu sẽ là số CCCD này
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input"
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="card">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Thông tin hợp đồng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn phòng <span className="text-red-500">*</span>
                </label>
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Chọn phòng</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} - Tầng {room.floor} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(Number(room.price))}/tháng
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá thuê/tháng (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="rentPrice"
                  value={formData.rentPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  className="input"
                  placeholder="4500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày vào ở <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày hết hạn
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền cọc (VND)
                </label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  min="0"
                  className="input"
                  placeholder="5000000"
                />
              </div>
            </div>
          </div>

          {/* Occupants Section */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} className="flex-shrink-0" />
                <span>Người ở cùng (nếu có)</span>
              </h2>
              <button
                type="button"
                onClick={addOccupant}
                className="px-3 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={16} className="flex-shrink-0" />
                <span>Thêm người ở</span>
              </button>
            </div>
            {occupants.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Chưa có người ở nào. Nhấn "Thêm người ở" để thêm.
              </p>
            ) : (
              <div className="space-y-4">
                {occupants.map((occupant, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Người ở #{index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeOccupant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={occupant.fullName}
                          onChange={(e) => updateOccupant(index, 'fullName', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập họ tên"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quan hệ
                        </label>
                        <select
                          value={occupant.relationship}
                          onChange={(e) => updateOccupant(index, 'relationship', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Chọn quan hệ</option>
                          <option value="Vợ/Chồng">Vợ/Chồng</option>
                          <option value="Con">Con</option>
                          <option value="Bạn">Bạn</option>
                          <option value="Người thân">Người thân</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Số CCCD/CMND
                        </label>
                        <input
                          type="text"
                          value={occupant.cccdNumber}
                          onChange={(e) => updateOccupant(index, 'cccdNumber', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập số CCCD"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={occupant.phone}
                          onChange={(e) => updateOccupant(index, 'phone', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          value={occupant.dob}
                          onChange={(e) => updateOccupant(index, 'dob', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {occupants.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Lưu ý:</strong> Tổng số người ở = 1 (người chủ hợp đồng) + {occupants.length} (người ở) = <strong>{1 + occupants.length} người</strong>. 
                      Hệ thống sẽ tự động cập nhật số lượng người tối đa của phòng nếu cần.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-4 sm:space-y-6">
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-3">Lưu ý quan trọng</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Mật khẩu ban đầu sẽ là số CCCD của cư dân</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Cư dân sẽ phải đổi mật khẩu khi đăng nhập lần đầu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Phòng sẽ tự động chuyển sang trạng thái "Đang thuê"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Hợp đồng sẽ được tạo với trạng thái "Đang hiệu lực"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Số lượng người trong phòng sẽ tự động cập nhật dựa trên hợp đồng</span>
              </li>
            </ul>
          </div>
          {occupants.length > 0 && (
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-xs sm:text-sm font-semibold text-green-900 mb-2">Tổng số người ở</h3>
              <p className="text-xl sm:text-2xl font-bold text-green-700">{1 + occupants.length} người</p>
              <p className="text-xs text-green-600 mt-1">
                (1 người chủ hợp đồng + {occupants.length} người ở)
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
