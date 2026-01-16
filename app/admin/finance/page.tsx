'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Zap, 
  Droplet, 
  Save, 
  Download, 
  Upload, 
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface RoomReading {
  id: number
  name: string
  floor: number
  contract: {
    user: {
      fullName: string
    }
  } | null
  elecOld: number
  waterOld: number
  elecNew: number | null
  waterNew: number | null
  elecConsumption: number | null
  waterConsumption: number | null
  hasReading: boolean
}

export default function FinancePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [rooms, setRooms] = useState<RoomReading[]>([])
  const [readings, setReadings] = useState<Record<number, { elecNew: string; waterNew: string; error?: string }>>({})

  useEffect(() => {
    if (pathname === '/admin/finance') {
      fetchRoomsForReading()
      // Reset readings khi chuyển tháng
      setReadings({})
    }
  }, [pathname, selectedMonth, selectedYear])

  const fetchRoomsForReading = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/meter-readings/rooms?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
        
        // Initialize readings state - lấy từ database (số mới đã lưu)
        const initialReadings: Record<number, { elecNew: string; waterNew: string; error?: string }> = {}
        data.forEach((room: RoomReading) => {
          initialReadings[room.id] = {
            elecNew: room.elecNew?.toString() || '',
            waterNew: room.waterNew?.toString() || '',
            error: undefined
          }
        })
        setReadings(initialReadings)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReadingChange = (roomId: number, field: 'elecNew' | 'waterNew', value: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return

    const numValue = parseFloat(value)
    let error: string | undefined = undefined

    // Validate real-time
    if (value && !isNaN(numValue)) {
      if (field === 'elecNew' && numValue < room.elecOld) {
        error = `Chỉ số điện mới (${value}) không được nhỏ hơn số cũ (${room.elecOld})`
      } else if (field === 'waterNew' && numValue < room.waterOld) {
        error = `Chỉ số nước mới (${value}) không được nhỏ hơn số cũ (${room.waterOld})`
      }
    }

    setReadings(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value,
        error
      }
    }))
  }

  const validateReading = (room: RoomReading, elecNew: string, waterNew: string): string | null => {
    // Validate điện
    if (elecNew && elecNew.trim() !== '') {
      const elecNewNum = parseFloat(elecNew)
      if (isNaN(elecNewNum)) {
        return 'Chỉ số điện phải là số hợp lệ'
      }
      if (elecNewNum < room.elecOld) {
        return `Chỉ số điện mới (${elecNew}) không được nhỏ hơn số cũ (${room.elecOld})`
      }
    }

    // Validate nước
    if (waterNew && waterNew.trim() !== '') {
      const waterNewNum = parseFloat(waterNew)
      if (isNaN(waterNewNum)) {
        return 'Chỉ số nước phải là số hợp lệ'
      }
      if (waterNewNum < room.waterOld) {
        return `Chỉ số nước mới (${waterNew}) không được nhỏ hơn số cũ (${room.waterOld})`
      }
    }

    return null
  }

  const handleSaveReadings = async () => {
    setSaving(true)
    try {
      // Validate tất cả readings trước khi gửi
      let hasValidationError = false
      const validatedReadings: Array<{ roomId: number; elecNew: number; waterNew: number }> = []

      for (const room of rooms) {
        const reading = readings[room.id]
        if (!reading || (!reading.elecNew && !reading.waterNew)) {
          continue
        }

        const error = validateReading(room, reading.elecNew || '', reading.waterNew || '')
        
        if (error) {
          setReadings(prev => ({
            ...prev,
            [room.id]: { ...prev[room.id], error }
          }))
          hasValidationError = true
          continue
        }

        // Phải có cả điện và nước
        if (!reading.elecNew || !reading.waterNew) {
          setReadings(prev => ({
            ...prev,
            [room.id]: { ...prev[room.id], error: 'Vui lòng nhập đầy đủ chỉ số điện và nước' }
          }))
          hasValidationError = true
          continue
        }

        validatedReadings.push({
          roomId: room.id,
          elecNew: parseFloat(reading.elecNew),
          waterNew: parseFloat(reading.waterNew)
        })
      }

      if (hasValidationError) {
        alert('Vui lòng sửa các lỗi validation trước khi lưu')
        setSaving(false)
        return
      }

      if (validatedReadings.length === 0) {
        alert('Vui lòng nhập ít nhất một chỉ số')
        setSaving(false)
        return
      }

      const readingsToSave = validatedReadings

      if (readingsToSave.length === 0) {
        alert('Vui lòng nhập ít nhất một chỉ số')
        setSaving(false)
        return
      }

      const response = await fetch('/api/meter-readings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          readings: readingsToSave,
          month: selectedMonth,
          year: selectedYear
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.errors && data.errors.length > 0) {
          const invoiceMsg = data.invoicesCreated > 0 ? ` Đã tạo ${data.invoicesCreated} hóa đơn.` : ''
          alert(`Đã lưu ${data.saved} phòng.${invoiceMsg} Có ${data.errors.length} phòng có lỗi.`)
          // Update errors in state
          data.errors.forEach((err: any) => {
            setReadings(prev => ({
              ...prev,
              [err.roomId]: { ...prev[err.roomId], error: err.error }
            }))
          })
        } else {
          const invoiceMsg = data.invoicesCreated > 0 ? ` Đã tự động tạo ${data.invoicesCreated} hóa đơn.` : ''
          alert(`Đã lưu thành công ${data.saved} phòng!${invoiceMsg}`)
          // Refresh lại dữ liệu để hiển thị số cũ đã được cập nhật
          await fetchRoomsForReading()
          // Clear readings để reset form
          setReadings({})
        }
      } else {
        alert(data.error || 'Có lỗi xảy ra khi lưu chỉ số')
      }
    } catch (error) {
      console.error('Error saving readings:', error)
      alert('Có lỗi xảy ra khi lưu chỉ số')
    } finally {
      setSaving(false)
    }
  }

  const generateMonthYearOptions = () => {
    const options = []
    const currentDate = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      options.push({ value: `${month}/${year}`, label: `Tháng ${month}/${year}`, month, year })
    }
    return options
  }

  const filteredRooms = rooms.filter(room => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      room.name.toLowerCase().includes(searchLower) ||
      room.contract?.user.fullName.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tài chính</h1>
        <p className="text-gray-600 mt-1">Quản lý hóa đơn và chốt điện nước</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/invoices"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              pathname === '/admin/invoices'
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText size={18} className="inline mr-2" />
            Danh sách hóa đơn
          </Link>
          <Link
            href="/admin/finance"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              pathname === '/admin/finance'
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap size={18} className="inline mr-2" />
            Chốt điện nước
          </Link>
        </div>
      </div>

      {/* Meter Reading Content */}
      {pathname === '/admin/finance' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Kỳ chốt số:</label>
                <select
                  value={`${selectedMonth}/${selectedYear}`}
                  onChange={(e) => {
                    const [month, year] = e.target.value.split('/')
                    setSelectedMonth(parseInt(month))
                    setSelectedYear(parseInt(year))
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {generateMonthYearOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSaveReadings}
                disabled={saving}
                className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Download size={18} />
                <span>Xuất Excel</span>
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Upload size={18} />
                <span>Upload Excel</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PHÒNG</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ĐIỆN CŨ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ĐIỆN MỚI</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TIÊU THỤ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NƯỚC CŨ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NƯỚC MỚI</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TIÊU THỤ</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          Không có phòng nào
                        </td>
                      </tr>
                    ) : (
                      filteredRooms.map((room) => {
                        const reading = readings[room.id] || { elecNew: '', waterNew: '' }
                        const elecNewNum = reading.elecNew ? parseFloat(reading.elecNew) : null
                        const waterNewNum = reading.waterNew ? parseFloat(reading.waterNew) : null
                        const elecConsumption = elecNewNum !== null ? elecNewNum - room.elecOld : null
                        const waterConsumption = waterNewNum !== null ? waterNewNum - room.waterOld : null
                        const hasError = reading.error || 
                          (elecNewNum !== null && elecNewNum < room.elecOld) ||
                          (waterNewNum !== null && waterNewNum < room.waterOld)
                        const isComplete = elecNewNum !== null && waterNewNum !== null && !hasError

                        return (
                          <tr 
                            key={room.id} 
                            className={`hover:bg-gray-50 transition-colors ${hasError ? 'bg-red-50' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{room.name}</p>
                                {room.contract && (
                                  <p className="text-xs text-gray-500">{room.contract.user.fullName}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600">{room.elecOld.toLocaleString('vi-VN')}</span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={room.elecOld}
                                step="1"
                                value={reading.elecNew}
                                onChange={(e) => handleReadingChange(room.id, 'elecNew', e.target.value)}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (val < room.elecOld) {
                                    handleReadingChange(room.id, 'elecNew', e.target.value)
                                  }
                                }}
                                placeholder="Nhập số mới"
                                className={`w-24 px-2 py-1 text-sm border rounded ${
                                  hasError && elecNewNum !== null && elecNewNum < room.elecOld
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                                }`}
                              />
                              {hasError && elecNewNum !== null && elecNewNum < room.elecOld && (
                                <p className="text-xs text-red-600 mt-1">Tối thiểu: {room.elecOld}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {elecConsumption !== null ? (
                                <span className={`text-sm font-medium ${
                                  elecConsumption < 0 ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {elecConsumption.toLocaleString('vi-VN')}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600">{room.waterOld.toLocaleString('vi-VN')}</span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={room.waterOld}
                                step="1"
                                value={reading.waterNew}
                                onChange={(e) => handleReadingChange(room.id, 'waterNew', e.target.value)}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (val < room.waterOld) {
                                    handleReadingChange(room.id, 'waterNew', e.target.value)
                                  }
                                }}
                                placeholder="Nhập số mới"
                                className={`w-24 px-2 py-1 text-sm border rounded ${
                                  hasError && waterNewNum !== null && waterNewNum < room.waterOld
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                                }`}
                              />
                              {hasError && waterNewNum !== null && waterNewNum < room.waterOld && (
                                <p className="text-xs text-red-600 mt-1">Tối thiểu: {room.waterOld}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {waterConsumption !== null ? (
                                <span className={`text-sm font-medium ${
                                  waterConsumption < 0 ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {waterConsumption.toLocaleString('vi-VN')}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {hasError ? (
                                <div className="flex flex-col items-center gap-1">
                                  <XCircle size={20} className="text-red-600" />
                                  <span className="text-xs text-red-600">{reading.error || 'Lỗi'}</span>
                                </div>
                              ) : isComplete ? (
                                <CheckCircle size={20} className="text-green-600 mx-auto" />
                              ) : (
                                <AlertCircle size={20} className="text-gray-400 mx-auto" />
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
