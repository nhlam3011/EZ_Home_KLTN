'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, Loader2, User, Plus, Users, Upload, RefreshCw, FileText } from 'lucide-react'

interface Occupant {
  fullName: string
  cccdNumber: string
  phone: string
  dob: string
  relationship: string
}

export default function NewResidentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [loadingOldData, setLoadingOldData] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [occupants, setOccupants] = useState<Occupant[]>([])
  const [existingUserId, setExistingUserId] = useState<string | null>(null)
  const [oldUserData, setOldUserData] = useState<any>(null)
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

    // Check if there's a userId in the URL (renewing contract for existing user)
    const userId = searchParams.get('userId')
    if (userId) {
      setExistingUserId(userId)
      fetchOldUserData(userId)
    }
  }, [])

  const fetchOldUserData = async (userId: string) => {
    setLoadingOldData(true)
    try {
      const response = await fetch(`/api/residents/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setOldUserData(data)

        // Auto-fill form with old user data
        setFormData(prev => ({
          ...prev,
          phone: data.phone || '',
          fullName: data.fullName || '',
          email: data.email || '',
          cccdNumber: data.cccdNumber || '',
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          address: data.address || ''
        }))

        // Also fill occupants from the last contract if available
        if (data.contracts && data.contracts.length > 0) {
          const lastContract = data.contracts[0]
          if (lastContract.occupants && lastContract.occupants.length > 0) {
            setOccupants(lastContract.occupants.map((occ: any) => ({
              fullName: occ.fullName || '',
              cccdNumber: occ.cccdNumber || '',
              phone: occ.phone || '',
              dob: occ.dob ? new Date(occ.dob).toISOString().split('T')[0] : '',
              relationship: occ.relationship || ''
            })))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching old user data:', error)
    } finally {
      setLoadingOldData(false)
    }
  }

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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/residents"
            className="btn btn-ghost btn-icon"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary uppercase tracking-tight">CHECK-IN CƯ DÂN MỚI</h1>
            <p className="text-xs sm:text-sm text-secondary mt-1 tracking-wide uppercase font-medium opacity-70">
              {existingUserId
                ? `Tạo hợp đồng mới cho cư dân: ${oldUserData?.fullName || 'Đang tải...'}`
                : 'Nhập thông tin để tạo hợp đồng và tài khoản cho cư dân mới'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <Link
            href="/admin/residents"
            className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2"
          >
            <X size={18} />
            <span className="font-bold">Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary h-11 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="font-bold">Đang tạo...</span>
              </>
            ) : (
              <>
                <Save size={18} strokeWidth={2.5} />
                <span className="font-bold uppercase tracking-tight">Lưu và tạo hợp đồng</span>
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

      {/* Info banner for existing user */}
      {existingUserId && oldUserData && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <RefreshCw size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Thông tin cư dân đã được điền tự động từ hợp đồng cũ
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Hợp đồng cũ: Phòng {oldUserData.contracts?.[0]?.room?.name || 'N/A'} |
                Thời gian: {oldUserData.contracts?.[0]?.startDate ? new Date(oldUserData.contracts[0].startDate).toLocaleDateString('vi-VN') : 'N/A'} -
                {oldUserData.contracts?.[0]?.endDate ? new Date(oldUserData.contracts[0].endDate).toLocaleDateString('vi-VN') : 'N/A'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Vui lòng kiểm tra và cập nhật thông tin nếu có thay đổi.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <User className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <h2 className="text-lg font-bold text-primary uppercase tracking-tight">Thông tin cá nhân</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
                <p className="text-xs text-tertiary mt-1">
                  Mật khẩu ban đầu sẽ là số CCCD này
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <FileText className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <h2 className="text-lg font-bold text-primary uppercase tracking-tight">Thông tin hợp đồng</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
                <label className="block text-sm font-medium text-primary mb-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Users className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <h2 className="text-lg font-bold text-primary uppercase tracking-tight">Người ở cùng (nếu có)</h2>
              </div>
              <button
                type="button"
                onClick={addOccupant}
                className="btn btn-primary h-10 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span className="font-bold text-xs uppercase">Thêm người ở</span>
              </button>
            </div>
            {occupants.length === 0 ? (
              <p className="text-sm text-tertiary text-center py-4">
                Chưa có người ở nào. Nhấn "Thêm người ở" để thêm.
              </p>
            ) : (
              <div className="space-y-4">
                {occupants.map((occupant, index) => (
                  <div key={index} className="p-4 border border-primary rounded-lg background: #5d6e8517 ">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-primary">Người ở #{index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeOccupant(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={occupant.fullName}
                          onChange={(e) => updateOccupant(index, 'fullName', e.target.value)}
                          className="input"
                          placeholder="Nhập họ tên"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1">
                          Quan hệ
                        </label>
                        <select
                          value={occupant.relationship}
                          onChange={(e) => updateOccupant(index, 'relationship', e.target.value)}
                          className="input"
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
                        <label className="block text-xs font-medium text-secondary mb-1">
                          Số CCCD/CMND
                        </label>
                        <input
                          type="text"
                          value={occupant.cccdNumber}
                          onChange={(e) => updateOccupant(index, 'cccdNumber', e.target.value)}
                          className="input"
                          placeholder="Nhập số CCCD"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={occupant.phone}
                          onChange={(e) => updateOccupant(index, 'phone', e.target.value)}
                          className="input"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-secondary mb-1">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          value={occupant.dob}
                          onChange={(e) => updateOccupant(index, 'dob', e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {occupants.length > 0 && (
                  <div className="p-3 bg-tertiary border border-primary rounded-lg">
                    <p className="text-xs text-secondary">
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
          <div className="card stat-card-blue">
            <h3 className="text-xs sm:text-sm font-semibold text-primary mb-3">Lưu ý quan trọng</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                <span>Mật khẩu ban đầu sẽ là số CCCD của cư dân</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                <span>Cư dân sẽ phải đổi mật khẩu khi đăng nhập lần đầu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                <span>Phòng sẽ tự động chuyển sang trạng thái "Đang thuê"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                <span>Hợp đồng sẽ được tạo với trạng thái "Đang hiệu lực"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                <span>Số lượng người trong phòng sẽ tự động cập nhật dựa trên hợp đồng</span>
              </li>
            </ul>
          </div>
          {occupants.length > 0 && (
            <div className="card bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
              <h3 className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-200 mb-2">Tổng số người ở</h3>
              <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{1 + occupants.length} người</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                (1 người chủ hợp đồng + {occupants.length} người ở)
              </p>
            </div>
          )}
        </div>
      </form >
    </div >
  )
}
