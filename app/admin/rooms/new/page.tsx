'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Building2, DollarSign, Users, Ruler, Home, Wrench, Image as ImageIcon } from 'lucide-react'
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
    roomType: 'Studio',
    description: '',
    amenities: [] as string[]
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
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Thêm phòng mới</h1>
            <p className="text-secondary mt-1 text-sm sm:text-base">Nhập thông tin chi tiết để tạo phòng mới trong hệ thống</p>
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
            disabled={loading}
            className="btn btn-primary btn-sm sm:btn-md"
          >
            <Save size={18} />
            <span>{loading ? 'Đang lưu...' : 'Lưu phòng'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(floor => (
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
            {/* Classification */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Building2 className="text-white" size={20} />
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

            {/* Initial Status */}
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
                    <p className="text-xs text-tertiary mt-0.5">Phòng đang được sửa chữa</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Images */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                  <ImageIcon className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-primary">Hình ảnh</h2>
              </div>
              <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center hover:border-blue-500 hover:bg-tertiary transition-all cursor-pointer group">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-tertiary rounded-lg flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <ImageIcon className="text-tertiary group-hover:text-blue-500 transition-colors" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Tải ảnh lên</p>
                    <p className="text-xs text-tertiary">PNG, JPG tối đa 5MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
