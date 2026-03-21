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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  ChevronDown,
  RotateCcw
} from 'lucide-react'
import { useBuilding } from '@/components/BuildingContext'

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
  const [selectedRooms, setSelectedRooms] = useState<number[]>([])
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const { selectedBuildingId } = useBuilding()

  useEffect(() => {
    if (pathname === '/admin/finance') {
      fetchRoomsForReading()
      // Reset readings khi chuyển tháng
      setReadings({})
    }
  }, [pathname, selectedMonth, selectedYear, selectedBuildingId])

  const fetchRoomsForReading = async () => {
    setLoading(true)
    try {
      const url = selectedBuildingId
        ? `/api/meter-readings/rooms?month=${selectedMonth}&year=${selectedYear}&buildingId=${selectedBuildingId}`
        : `/api/meter-readings/rooms?month=${selectedMonth}&year=${selectedYear}`
      const response = await fetch(url)
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

      // Nếu có phòng được chọn, chỉ lưu các phòng đó
      const roomsToSave = selectedRooms.length > 0
        ? rooms.filter(room => selectedRooms.includes(room.id))
        : rooms

      for (const room of roomsToSave) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-tight">CHỈ SỐ ĐIỆN NƯỚC</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Ghi nhận chỉ số điện nước hàng tháng</p>
        </div>

        {/* Actions - Visible only on Finance tab */}
        {pathname === '/admin/finance' && (
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto lg:flex lg:flex-row lg:items-center lg:gap-3 justify-center sm:justify-end">
            <button
              onClick={handleSaveReadings}
              disabled={saving}
              className="btn btn-primary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 order-1 lg:order-none shadow-lg shadow-blue-500/20"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="font-bold">Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span className="font-bold">Lưu chỉ số</span>
                </>
              )}
            </button>
            <button
              onClick={() => setReadings({})}
              disabled={Object.keys(readings).length === 0}
              className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 order-2 lg:order-none"
            >
              <RotateCcw size={18} />
              <span className="font-bold">Hủy bỏ</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-primary relative z-30">
        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
          <Link
            href="/admin/invoices"
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${pathname === '/admin/invoices'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <FileText size={18} className="inline mr-1 sm:mr-2" />
            Hoá đơn
          </Link>
          <Link
            href="/admin/finance"
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${pathname === '/admin/finance'
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
        <div className="space-y-6 mt-6">
          {/* Main Content Area */}
          <div className="card overflow-hidden p-0 relative z-20 bg-transparent border-none shadow-none">

            {/* Period Selector & Tools Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20 !overflow-visible mb-6 bg-white dark:bg-primary p-4 sm:p-6 rounded-2xl border border-primary shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Modern Inline Period Picker */}
                <div className="relative w-full sm:w-auto">
                  <button
                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all h-11 w-full sm:w-auto ${showMonthPicker
                      ? 'bg-tertiary border-blue-500 ring-2 ring-blue-500/10 shadow-lg'
                      : 'bg-primary border-primary hover:border-blue-500 shadow-sm'
                      }`}
                  >
                    <Calendar size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider flex-1 text-left">
                      THÁNG {selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth} / {selectedYear}
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-300 text-tertiary ${showMonthPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showMonthPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-40 transition-opacity"
                        onClick={() => setShowMonthPicker(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-3 z-50 animate-scaleIn origin-top-left ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <div className="flex items-center justify-between mb-3 bg-tertiary/30 p-1.5 rounded-xl">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedYear(y => y - 1)
                              setSelectedRooms([])
                            }}
                            className="p-1.5 hover:bg-primary dark:hover:bg-gray-700 rounded-lg transition-all active:scale-90 text-secondary"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-sm font-bold text-primary">Năm {selectedYear}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedYear(y => y + 1)
                              setSelectedRooms([])
                            }}
                            className="p-1.5 hover:bg-primary dark:hover:bg-gray-700 rounded-lg transition-all active:scale-90 text-secondary"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <button
                              key={m}
                              onClick={() => {
                                setSelectedMonth(m)
                                setSelectedRooms([])
                                setShowMonthPicker(false)
                              }}
                              className={`py-2 rounded-xl text-xs font-bold transition-all ${selectedMonth === m
                                ? 'bg-[var(--accent-blue)] text-white shadow-inner scale-95'
                                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-secondary border border-transparent hover:border-blue-100 dark:hover:border-blue-800'
                                }`}
                            >
                              T{m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {selectedRooms.length > 0 && (
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800 animate-fadeIn h-11 w-full sm:w-auto">
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-bold whitespace-nowrap">
                      Đã chọn: {selectedRooms.length} phòng
                    </span>
                    <button
                      onClick={() => setSelectedRooms([])}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors text-blue-500"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={18} />
                <input
                  type="text"
                  placeholder="Tìm phòng hoặc khách thuê..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-with-icon w-full pl-12 h-11"
                />
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
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left align-middle">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-2 border-gray-400 dark:border-gray-500 text-blue-600 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 cursor-pointer transition-all duration-200 hover:border-blue-500"
                                checked={selectedRooms.length > 0 && filteredRooms.every(room => selectedRooms.includes(room.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allIds = filteredRooms.map(room => room.id)
                                    setSelectedRooms([...new Set([...selectedRooms, ...allIds])])
                                  } else {
                                    const unselectedIds = filteredRooms.map(room => room.id)
                                    setSelectedRooms(selectedRooms.filter(id => !unselectedIds.includes(id)))
                                  }
                                }}
                              />
                            </label>
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase sticky left-0 bg-tertiary z-10">PHÒNG</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Zap size={14} className="text-yellow-500 dark:text-yellow-400" />
                              <span>ĐIỆN CŨ</span>
                            </div>
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Zap size={14} className="text-yellow-500 dark:text-yellow-400" />
                              <span>ĐIỆN MỚI</span>
                            </div>
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">TIÊU THỤ</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Droplet size={14} className="text-blue-500 dark:text-blue-400" />
                              <span>NƯỚC CŨ</span>
                            </div>
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Droplet size={14} className="text-blue-500 dark:text-blue-400" />
                              <span>NƯỚC MỚI</span>
                            </div>
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">TIÊU THỤ</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary">
                        {filteredRooms.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-xs sm:text-sm text-tertiary">
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
                                className={`hover:bg-tertiary transition-colors ${hasError ? 'bg-red-50 dark:bg-red-900/20' : ''
                                  }`}
                              >
                                <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle">
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded border-2 border-gray-400 dark:border-gray-500 text-blue-600 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 cursor-pointer transition-all duration-200 hover:border-blue-500"
                                      checked={selectedRooms.includes(room.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedRooms([...selectedRooms, room.id])
                                        } else {
                                          setSelectedRooms(selectedRooms.filter(id => id !== room.id))
                                        }
                                      }}
                                    />
                                  </label>
                                </td>
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
                                      placeholder="Số mới"
                                      className={`w-13 sm:w-20 px-1.5 sm:px-2 py-1 text-xs sm:text-sm border rounded bg-primary text-primary placeholder:text-tertiary placeholder:opacity-50 ${hasError && elecNewNum !== null && elecNewNum < room.elecOld
                                        ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                                        : 'border-primary focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400'
                                        }`}
                                    />
                                  </div>
                                  {hasError && elecNewNum !== null && elecNewNum < room.elecOld && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Tối thiểu: {room.elecOld}</p>
                                  )}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  {elecConsumption !== null ? (
                                    <span className={`text-xs sm:text-sm font-medium ${elecConsumption < 0
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
                                      placeholder="Số mới"
                                      className={`w-13 sm:w-20 px-1.5 sm:px-2 py-1 text-xs sm:text-sm border rounded bg-primary text-primary placeholder:text-tertiary placeholder:opacity-50 ${hasError && waterNewNum !== null && waterNewNum < room.waterOld
                                        ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                                        : 'border-primary focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
                                        }`}
                                    />
                                  </div>
                                  {hasError && waterNewNum !== null && waterNewNum < room.waterOld && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Tối thiểu: {room.waterOld}</p>
                                  )}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  {waterConsumption !== null ? (
                                    <span className={`text-xs sm:text-sm font-medium ${waterConsumption < 0
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
                                      <XCircle size={16} className="text-red-600 dark:text-red-400" />
                                      <span className="text-xs text-red-600 dark:text-red-400">{reading.error || 'Lỗi'}</span>
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
        </div>
      )
      }
    </div>
  )
}
