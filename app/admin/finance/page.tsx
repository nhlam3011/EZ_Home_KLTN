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
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Tài chính</h1>
        <p className="text-sm sm:text-base text-secondary mt-1">Quản lý hóa đơn và chốt điện nước</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
          <Link
            href="/admin/invoices"
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              pathname === '/admin/invoices'
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <FileText size={18} className="inline mr-1 sm:mr-2" />
            Danh sách hóa đơn
          </Link>
          <Link
            href="/admin/finance"
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              pathname === '/admin/finance'
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Zap size={18} className="inline mr-1 sm:mr-2" />
            Chốt điện nước
          </Link>
        </div>
      </div>

      {/* Meter Reading Content */}
      {pathname === '/admin/finance' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="card">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">Kỳ chốt số:</label>
                <select
                  value={`${selectedMonth}/${selectedYear}`}
                  onChange={(e) => {
                    const [month, year] = e.target.value.split('/')
                    setSelectedMonth(parseInt(month))
                    setSelectedYear(parseInt(year))
                  }}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border border-primary rounded-lg text-xs sm:text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
                >
                  {generateMonthYearOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-primary rounded-lg text-xs sm:text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSaveReadings}
                  disabled={saving}
                  className="btn btn-primary btn-sm sm:btn-md flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-xs sm:text-sm">Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span className="text-xs sm:text-sm">Lưu thay đổi</span>
                    </>
                  )}
                </button>
                <button className="btn btn-secondary btn-sm sm:btn-md flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]">
                  <Download size={18} />
                  <span className="hidden sm:inline">Xuất Excel</span>
                  <span className="sm:hidden">Xuất</span>
                </button>
                <button className="btn btn-secondary btn-sm sm:btn-md flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]">
                  <Upload size={18} />
                  <span className="hidden sm:inline">Upload Excel</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
              <p className="text-tertiary">Đang tải...</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full">
                    <thead className="bg-tertiary border-b border-primary">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase sticky left-0 bg-tertiary z-10">PHÒNG</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Zap size={12} className="sm:w-[14px] sm:h-[14px] text-yellow-500 dark:text-yellow-400" />
                            <span className="hidden sm:inline">ĐIỆN CŨ</span>
                            <span className="sm:hidden">Đ.CŨ</span>
                          </div>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Zap size={12} className="sm:w-[14px] sm:h-[14px] text-yellow-500 dark:text-yellow-400" />
                            <span className="hidden sm:inline">ĐIỆN MỚI</span>
                            <span className="sm:hidden">Đ.MỚI</span>
                          </div>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase hidden md:table-cell">TIÊU THỤ</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Droplet size={12} className="sm:w-[14px] sm:h-[14px] text-blue-500 dark:text-blue-400" />
                            <span className="hidden sm:inline">NƯỚC CŨ</span>
                            <span className="sm:hidden">N.CŨ</span>
                          </div>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Droplet size={12} className="sm:w-[14px] sm:h-[14px] text-blue-500 dark:text-blue-400" />
                            <span className="hidden sm:inline">NƯỚC MỚI</span>
                            <span className="sm:hidden">N.MỚI</span>
                          </div>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase hidden md:table-cell">TIÊU THỤ</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">TRẠNG THÁI</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-primary">
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-xs sm:text-sm text-tertiary">
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
                            className={`hover:bg-tertiary transition-colors ${
                              hasError ? 'bg-red-50 dark:bg-red-900/20' : ''
                            }`}
                          >
                            <td className="px-3 sm:px-4 py-2 sm:py-3 sticky left-0 bg-primary dark:bg-secondary z-10">
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-primary">{room.name}</p>
                                {room.contract && (
                                  <p className="text-xs text-tertiary">{room.contract.user.fullName}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Zap size={12} className="sm:w-[14px] sm:h-[14px] text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-secondary font-medium">{room.elecOld.toLocaleString('vi-VN')}</span>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Zap size={12} className="sm:w-[14px] sm:h-[14px] text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
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
                                  className={`w-16 sm:w-24 px-1.5 sm:px-2 py-1 text-xs sm:text-sm border rounded bg-primary text-primary ${
                                    hasError && elecNewNum !== null && elecNewNum < room.elecOld
                                      ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                                      : 'border-primary focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400'
                                  }`}
                                />
                              </div>
                              {hasError && elecNewNum !== null && elecNewNum < room.elecOld && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Tối thiểu: {room.elecOld}</p>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                              {elecConsumption !== null ? (
                                <span className={`text-xs sm:text-sm font-medium ${
                                  elecConsumption < 0 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                  {elecConsumption.toLocaleString('vi-VN')}
                                </span>
                              ) : (
                                <span className="text-xs sm:text-sm text-tertiary">-</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Droplet size={12} className="sm:w-[14px] sm:h-[14px] text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-secondary font-medium">{room.waterOld.toLocaleString('vi-VN')}</span>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Droplet size={12} className="sm:w-[14px] sm:h-[14px] text-blue-500 dark:text-blue-400 flex-shrink-0" />
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
                                  className={`w-16 sm:w-24 px-1.5 sm:px-2 py-1 text-xs sm:text-sm border rounded bg-primary text-primary ${
                                    hasError && waterNewNum !== null && waterNewNum < room.waterOld
                                      ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                                      : 'border-primary focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
                                  }`}
                                />
                              </div>
                              {hasError && waterNewNum !== null && waterNewNum < room.waterOld && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Tối thiểu: {room.waterOld}</p>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                              {waterConsumption !== null ? (
                                <span className={`text-xs sm:text-sm font-medium ${
                                  waterConsumption < 0 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                  {waterConsumption.toLocaleString('vi-VN')}
                                </span>
                              ) : (
                                <span className="text-xs sm:text-sm text-tertiary">-</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              {hasError ? (
                                <div className="flex flex-col items-center gap-1">
                                  <XCircle size={16} className="sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                                  <span className="text-xs text-red-600 dark:text-red-400 hidden sm:inline">{reading.error || 'Lỗi'}</span>
                                </div>
                              ) : isComplete ? (
                                <CheckCircle size={16} className="sm:w-5 sm:h-5 text-green-600 dark:text-green-400 mx-auto" />
                              ) : (
                                <AlertCircle size={16} className="sm:w-5 sm:h-5 text-tertiary mx-auto" />
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
