'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'

export default function NewRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    floor: '',
    area: '',
    maxPeople: '2',
    price: '',
    status: 'AVAILABLE',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/rooms')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Có lỗi xảy ra khi tạo phòng')
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm phòng mới</h1>
          <p className="text-gray-600 mt-1">Nhập thông tin chi tiết để tạo phòng mới trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/rooms"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={18} />
            <span>Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{loading ? 'Đang lưu...' : 'Lưu phòng'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: P.101"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tầng <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn tầng</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(floor => (
                      <option key={floor} value={floor}>Tầng {floor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">m²</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số người tối đa
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustMaxPeople(-1)}
                      className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      name="maxPeople"
                      value={formData.maxPeople}
                      onChange={handleChange}
                      min="1"
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => adjustMaxPeople(1)}
                      className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost & Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi phí & Mô tả</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">₫</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Giá này chưa bao gồm điện, nước và dịch vụ khác.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả phòng
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Nhập mô tả chi tiết về tiện nghi phòng, hướng cửa số, nội thất có sẵn..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Classification */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">PHÂN LOẠI</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại phòng <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="STANDARD"
                  >
                    <option value="STANDARD">Phòng Tiêu chuẩn</option>
                    <option value="DELUXE">Phòng Deluxe</option>
                    <option value="SUITE">Phòng Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiện ích đi kèm
                  </label>
                  <div className="space-y-2">
                    {['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường tủ', 'Máy giặt chung'].map(amenity => (
                      <label key={amenity} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">TRẠNG THÁI BAN ĐẦU</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="AVAILABLE"
                    checked={formData.status === 'AVAILABLE'}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Trống (Sẵn sàng)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="MAINTENANCE"
                    checked={formData.status === 'MAINTENANCE'}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Đang bảo trì</span>
                </label>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">HÌNH ẢNH</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">☁️</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Tải ảnh lên</p>
                  <p className="text-xs text-gray-500">PNG, JPG tối đa 5MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
