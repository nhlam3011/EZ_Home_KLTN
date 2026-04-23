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
  RotateCcw,
  RefreshCw
} from 'lucide-react'
import { useBuilding } from '@/components/BuildingContext'
import Loading from '@/components/Loading'

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
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all')
  const [rooms, setRooms] = useState<RoomReading[]>([])
  const [readings, setReadings] = useState<Record<number, { elecNew: string; waterNew: string; error?: string }>>({})
  const [selectedRooms, setSelectedRooms] = useState<number[]>([])
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showFloorPicker, setShowFloorPicker] = useState(false)
  const { selectedBuildingId } = useBuilding()

  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b)

  useEffect(() => {
    if (pathname === '/admin/finance') {
      fetchRoomsForReading()
      // Reset readings và selected rooms khi chuyển tháng hoặc đổi tòa nhà
      setReadings({})
      setSelectedRooms([])
    }
  }, [pathname, selectedMonth, selectedYear, selectedBuildingId])
// ... (omitting unchanged fetchRoomsForReading, handleReadingChange, validateReading, handleSaveReadings, generateMonthYearOptions)
// ... I will actually replace from the state down to the end of return to be safe.


  const fetchRoomsForReading = async () => {
    setLoading(true)
    try {
      const url = selectedBuildingId
        ? `/api/meter-readings/rooms?month=${selectedMonth}&year=${selectedYear}&buildingId=${selectedBuildingId}&t=${Date.now()}`
        : `/api/meter-readings/rooms?month=${selectedMonth}&year=${selectedYear}&t=${Date.now()}`
      const response = await fetch(url, { cache: 'no-store' })
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
    // Floor Filter
    if (selectedFloor !== 'all' && room.floor !== selectedFloor) return false

    // Search Filter
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
                  <Loader2 className="animate-spin" size={18} />
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
        <div className="relative z-20 mt-6 space-y-6">
          {/* Filters */}
          <div className="card p-3 sm:p-4 mb-6 !overflow-visible relative z-20">
            <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Period Picker */}
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => fetchRoomsForReading()}
                  disabled={loading}
                  className="flex items-center justify-center p-2.5 h-11 w-11 rounded-xl border border-primary bg-white dark:bg-primary text-secondary hover:text-[var(--accent-blue)] hover:border-[var(--accent-blue)] transition-all duration-300 shadow-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Tải lại dữ liệu"
                >
                  <RefreshCw size={18} className={`transition-transform duration-500 group-hover:rotate-180 ${loading ? "animate-spin text-[var(--accent-blue)]" : ""}`} />
                </button>
                <div className="relative flex-1 min-w-0">
                  <button
                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showMonthPicker
                      ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                      : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                      }`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex-shrink-0">
                      <Calendar size={14} />
                    </div>
                    <div className="text-left pr-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight whitespace-nowrap text-primary uppercase tracking-wider truncate">
                        THÁNG {selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth}/{selectedYear}
                      </p>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showMonthPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showMonthPicker && (
                    <>
                      <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowMonthPicker(false)} />
                      <div className="absolute top-full md:left-0 right-0 max-md:-left-[52px] mt-2 md:w-[280px] w-[275px] bg-white/95 dark:bg-[#1a1c22]/95 backdrop-blur-xl rounded-[20px] xs:rounded-[24px] shadow-2xl border border-white/20 dark:border-gray-800/50 p-4 xs:p-6 z-50 animate-scaleIn origin-top-right md:origin-top-left overflow-hidden">
                        <div className="flex items-center justify-between mb-4 xs:mb-8 px-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedYear(y => y - 1)
                              setSelectedRooms([])
                            }}
                            className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-400 hover:text-blue-500 active:scale-90"
                          >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] xs:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">Năm</span>
                            <span className="text-14px xs:text-16px font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                              {selectedYear}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedYear(y => y + 1)
                              setSelectedRooms([])
                            }}
                            className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-400 hover:text-blue-500 active:scale-90"
                          >
                            <ChevronRight size={18} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 xs:gap-3">
                          {Array.from({ length: 12 }, (_, i) => {
                            const m = i + 1;
                            const monthStr = m < 10 ? `0${m}` : `${m}`;
                            const isSelected = selectedMonth === m;
                            return (
                              <button
                                key={m}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMonth(m);
                                  setSelectedRooms([]);
                                  setShowMonthPicker(false);
                                }}
                                className={`group relative h-10 xs:h-12 w-full rounded-xl xs:rounded-2xl text-[12px] xs:text-[14px] font-black transition-all duration-300 flex items-center justify-center overflow-hidden ${isSelected
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.05]'
                                  : 'text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                                  }`}
                              >
                                <span className="relative z-10">{monthStr}</span>
                                {isSelected && (
                                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Floor Picker */}
              <div className="relative w-full">
                <button
                  onClick={() => setShowFloorPicker(!showFloorPicker)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showFloorPicker
                    ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                    : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                    }`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex-shrink-0">
                    <Zap size={14} className="rotate-12" />
                  </div>
                  <div className="text-left pr-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight whitespace-nowrap text-primary uppercase tracking-wider truncate">
                      {selectedFloor === 'all' ? 'TẤT CẢ TẦNG' : `TẦNG ${selectedFloor}`}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showFloorPicker ? 'rotate-180' : ''}`} />
                </button>

                {showFloorPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFloorPicker(false)} />
                    <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white/95 dark:bg-[#1a1c22]/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/20 dark:border-gray-800/50 p-4 z-50 animate-scaleIn origin-top-left">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedFloor('all')
                            setShowFloorPicker(false)
                          }}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedFloor === 'all'
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-secondary hover:bg-tertiary'
                            }`}

                        >
                          TẤT CẢ
                        </button>
                        {floors.map(floor => (
                          <button
                            key={floor}
                            onClick={() => {
                              setSelectedFloor(floor)
                              setShowFloorPicker(false)
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedFloor === floor
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'text-secondary hover:bg-tertiary'
                              }`}

                          >
                            TẦNG {floor}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full xl:col-span-2">
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

            {selectedRooms.length > 0 && (
              <div className="relative mt-4 animate-fadeIn">
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800 h-11">
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
                    Đã chọn: {selectedRooms.length} phòng
                  </span>
                  <button
                    onClick={() => setSelectedRooms([])}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors text-blue-500"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <Loading size="lg" text="Đang tải dữ liệu..." />
            </div>
          ) : (
            <div className="card overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-tertiary border-b border-primary">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left">
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider sticky left-0 bg-tertiary z-10 w-[140px] sm:w-auto">PHÒNG</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">ĐIỆN CŨ/MỚI</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">TIÊU THỤ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">NƯỚC CŨ/MỚI</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">TIÊU THỤ</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">TRẠNG THÁI</th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary">
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-tertiary">
                          Không có phòng nào phù hợp
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
                            className={`hover:bg-tertiary/50 transition-colors ${hasError ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                          >
                            <td className="px-4 py-3 align-middle">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-2 border-gray-400 dark:border-gray-500 text-blue-600 bg-gray-100 dark:bg-gray-700 cursor-pointer"
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
                            <td className="px-4 py-3 sticky left-0 bg-white dark:bg-secondary z-10">
                              <div className="min-w-[100px]">
                                <p className="text-sm font-bold text-primary">{room.name}</p>
                                {room.contract && (
                                  <p className="text-[10px] text-tertiary truncate max-w-[120px] font-medium">{room.contract.user.fullName}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-tertiary">
                                  <span>Cũ: {room.elecOld.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Zap size={14} className="text-yellow-500" />
                                  <input
                                    type="number"
                                    value={reading.elecNew}
                                    onChange={(e) => handleReadingChange(room.id, 'elecNew', e.target.value)}
                                    placeholder="Mới"
                                    className={`w-20 px-2 py-1 text-xs sm:text-sm border rounded bg-primary text-primary ${hasError && elecNewNum !== null && elecNewNum < room.elecOld ? 'border-red-500 text-red-500' : 'border-primary focus:ring-2 focus:ring-yellow-500'}`}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs sm:text-sm font-bold ${elecConsumption !== null && elecConsumption < 0 ? 'text-red-500' : 'text-primary'}`}>
                                {elecConsumption !== null ? elecConsumption.toLocaleString() : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-tertiary">
                                  <span>Cũ: {room.waterOld.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Droplet size={14} className="text-blue-500" />
                                  <input
                                    type="number"
                                    value={reading.waterNew}
                                    onChange={(e) => handleReadingChange(room.id, 'waterNew', e.target.value)}
                                    placeholder="Mới"
                                    className={`w-20 px-2 py-1 text-xs sm:text-sm border rounded bg-primary text-primary ${hasError && waterNewNum !== null && waterNewNum < room.waterOld ? 'border-red-500 text-red-500' : 'border-primary focus:ring-2 focus:ring-blue-500'}`}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs sm:text-sm font-bold ${waterConsumption !== null && waterConsumption < 0 ? 'text-red-500' : 'text-primary'}`}>
                                {waterConsumption !== null ? waterConsumption.toLocaleString() : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {hasError ? (
                                <div className="flex justify-center">
                                  <XCircle size={18} className="text-red-500" />
                                </div>
                              ) : isComplete ? (
                                <div className="flex justify-center">
                                  <CheckCircle size={18} className="text-green-500" />
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <AlertCircle size={18} className="text-tertiary/50" />
                                </div>
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

