'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from 'flowbite-react'
import { Plus, Download, Search, Edit, Trash2, Building2, Users, DollarSign, X, Home, Ruler, FileText, Calendar, Phone, Mail, MapPin, CheckCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Loading from '@/components/Loading'

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
    status: string
    startDate?: Date | string
    endDate?: Date | string
    deposit?: number
    rentPrice?: number
    user: {
      id: number
      fullName: string
      phone?: string
      email?: string
    }
    occupants?: Array<{
      id: number
      fullName: string
    }>
  }>
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [maxFloors, setMaxFloors] = useState(10)
  const itemsPerPage = 8
  const [stats, setStats] = useState({
    total: 0,
    rented: 0,
    vacant: 0,
    revenue: 0
  })
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showFloorDropdown, setShowFloorDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [search, statusFilter, floorFilter])

  useEffect(() => {
    // Fetch settings for max floors
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.maxFloors) {
          setMaxFloors(parseInt(data.maxFloors))
        }
      })
      .catch(console.error)
  }, [])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (floorFilter !== 'all') params.append('floor', floorFilter)

      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const [response, revenueRes] = await Promise.all([
        fetch(`/api/rooms?${params.toString()}`),
        fetch(`/api/invoices?status=PAID&month=${currentMonth}&year=${currentYear}`)
      ])

      const data = await response.json()
      setRooms(data)

      // Calculate stats
      const total = data.length
      const rented = data.filter((r: Room) => r.status === 'RENTED').length
      const vacant = data.filter((r: Room) => r.status === 'AVAILABLE').length

      // Fetch revenue
      const invoices = await revenueRes.json()
      const revenue = invoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.totalAmount),
        0
      )

      setStats({ total, rented, vacant, revenue })
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: number) => {
    setDeleteRoomId(id)
    setShowConfirmModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteRoomId) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/rooms/${deleteRoomId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        alert('Xóa phòng thành công!')
        fetchRooms()
      } else {
        alert(data.error || 'Có lỗi xảy ra khi xóa phòng')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Có lỗi xảy ra khi xóa phòng. Vui lòng thử lại sau.')
    } finally {
      setDeleteLoading(false)
      setShowConfirmModal(false)
      setDeleteRoomId(null)
    }
  }

  const cancelDelete = () => {
    setShowConfirmModal(false)
    setDeleteRoomId(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const formatLargeCurrency = (amount: number) => {
    const millions = amount / 1000000
    return `${millions.toFixed(0)}tr`
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
        return 'bg-red-500 dark:bg-red-400'
      case 'AVAILABLE':
        return 'bg-green-500 dark:bg-green-400'
      case 'MAINTENANCE':
        return 'bg-yellow-500 dark:bg-yellow-400'
      default:
        return 'bg-gray-500 dark:bg-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RENTED':
        return 'failure'
      case 'AVAILABLE':
        return 'success'
      case 'MAINTENANCE':
        return 'warning'
      default:
        return 'gray'
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

  const handleExport = async () => {
    try {
      const response = await fetch('/api/rooms/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Danh-sach-phong-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Không thể xuất file. Vui lòng thử lại sau.')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Có lỗi xảy ra khi xuất file')
    }
  }

  const handleViewDetail = async (roomId: number) => {
    setLoadingDetail(true)
    setShowDetailModal(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const data = await response.json()
      if (response.ok) {
        setSelectedRoom(data)
      } else {
        alert('Không thể tải thông tin phòng')
        setShowDetailModal(false)
      }
    } catch (error) {
      console.error('Error fetching room detail:', error)
      alert('Có lỗi xảy ra khi tải thông tin phòng')
      setShowDetailModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const totalPages = Math.ceil(rooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRooms = rooms.slice(startIndex, endIndex)

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">Danh sách phòng</h1>
          <p className="text-secondary mt-1 text-sm sm:text-base">Quản lý trạng thái và thông tin cư dân</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full lg:flex lg:flex-row lg:w-auto lg:items-center lg:gap-3 justify-center sm:justify-end">
          <Link
            href="/admin/rooms/new"
            className="btn btn-primary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 order-1 lg:order-none"
          >
            <Plus size={18} />
            <span className="font-bold">Thêm phòng mới</span>
          </Link>
          <button
            onClick={handleExport}
            className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 order-2 lg:order-none"
          >
            <Download size={18} strokeWidth={2} />
            <span className="font-bold">Export</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-3 sm:p-4 !overflow-visible relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowFloorDropdown(!showFloorDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showFloorDropdown
                ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                }`}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                <Building2 size={14} />
              </div>
              <div className="text-left pr-1 flex-1">
                <p className="text-md font-medium leading-tight whitespace-nowrap text-primary uppercase">
                  TẦNG: {floorFilter === 'all' ? 'TẤT CẢ' : `TẦNG ${floorFilter}`}
                </p>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showFloorDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showFloorDropdown && (
              <>
                <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowFloorDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left max-h-[300px] overflow-y-auto no-scrollbar">
                  <button
                    onClick={() => { setFloorFilter('all'); setShowFloorDropdown(false); setCurrentPage(1); }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${floorFilter === 'all' ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                  >
                    TẤT CẢ CÁC TẦNG
                  </button>
                  {Array.from({ length: maxFloors }, (_, i) => i + 1).map(floor => (
                    <button
                      key={floor}
                      onClick={() => { setFloorFilter(floor.toString()); setShowFloorDropdown(false); setCurrentPage(1); }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 whitespace-nowrap ${floorFilter === floor.toString() ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                    >
                      TẦNG {floor}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown
                ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                statusFilter === 'AVAILABLE' ? 'bg-green-50 dark:bg-green-900/20 text-green-500' :
                  'bg-red-50 dark:bg-red-900/20 text-red-500'
                }`}>
                {statusFilter === 'all' && <Home size={14} />}
                {statusFilter === 'AVAILABLE' && <CheckCircle size={14} />}
                {statusFilter === 'RENTED' && <Users size={14} />}
              </div>
              <div className="text-left pr-1 flex-1">
                <p className="text-md font-medium leading-tight whitespace-nowrap text-primary uppercase">
                  Trạng thái: {statusFilter === 'all' ? 'TẤT CẢ' : statusFilter === 'AVAILABLE' ? 'TRỐNG' : 'ĐÃ THUÊ'}
                </p>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                  {[
                    { id: 'all', label: 'TẤT CẢ TRẠNG THÁI', icon: <Home size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                    { id: 'AVAILABLE', label: 'TRỐNG', icon: <CheckCircle size={16} />, color: 'text-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10' },
                    { id: 'RENTED', label: 'ĐANG THUÊ', icon: <Users size={16} />, color: 'text-red-500', bg: 'bg-red-50/50 dark:bg-red-900/10' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setStatusFilter(item.id); setShowStatusDropdown(false); setCurrentPage(1); }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === item.id ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                    >
                      <div className={`p-1.5 rounded-lg ${statusFilter === item.id ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`}`}>
                        {item.icon}
                      </div>
                      <span className="uppercase">{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo số phòng, tên khách thuê..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-with-icon w-full pr-4 py-2 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">TỔNG SỐ PHÒNG</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="text-white" size={20} />
            </div>
          </div>
        </div>
        <div className="card stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">ĐANG THUÊ</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{stats.rented}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <Users className="text-white" size={20} />
            </div>
          </div>
        </div>
        <div className="card stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">PHÒNG TRỐNG</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{stats.vacant}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="text-white" size={20} />
            </div>
          </div>
        </div>
        <div className="card stat-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">DOANH THU THÁNG</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {formatLargeCurrency(stats.revenue)}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="card">
          <Loading size="lg" text="Đang tải danh sách phòng..." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedRooms.map((room) => {
              const activeContract = room.contracts.find(c => c.status === 'ACTIVE') || room.contracts[0]
              // Calculate total occupants: 1 (main tenant) + number of occupants
              const currentOccupants = activeContract
                ? 1 + (activeContract.occupants?.length || 0)
                : 0

              return (
                <div
                  key={room.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewDetail(room.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-primary">{room.name}</h3>
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(room.status)}`}
                    ></span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-secondary">Trạng thái:</span>
                      <Badge color={getStatusBadge(room.status)} className="rounded font-semibold justify-center py-1 min-h-[24px]">
                        {getStatusLabel(room.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-secondary">Giá thuê:</span>
                      <span className="text-xs sm:text-sm font-semibold text-primary">
                        {formatCurrency(Number(room.price))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-secondary">Người ở:</span>
                      <span className="text-xs sm:text-sm font-medium text-primary">
                        {currentOccupants}/{room.maxPeople}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 mt-4 pt-4 border-t border-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      className="btn btn-ghost btn-icon text-primary flex-1"
                      title="Chỉnh sửa thông tin phòng"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(room.id)
                      }}
                      className="btn btn-ghost btn-icon text-danger flex-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {rooms.length > 0 && (
            <div className="card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
              <p className="text-xs sm:text-sm text-secondary text-center sm:text-left">
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, rooms.length)} của {rooms.length} phòng
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 3) {
                    pageNum = i + 1
                  } else if (currentPage === 1) {
                    pageNum = i + 1
                  } else if (currentPage === totalPages) {
                    pageNum = totalPages - 2 + i
                  } else {
                    pageNum = currentPage - 1 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Room Detail Modal */}
      {showDetailModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false)
              setSelectedRoom(null)
            }
          }}
        >
          <div className="bg-primary rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn border border-white/10">
            {loadingDetail ? (
              <div className="p-12 text-center">
                <Loading size="lg" text="Đang tải thông tin phòng..." />
              </div>
            ) : selectedRoom ? (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-[#4F46E5] to-[#4338CA] p-5 sm:p-6 text-white relative overflow-hidden flex-shrink-0">
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 flex-shrink-0">
                        <Building2 size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black mb-0.5 sm:mb-1">{selectedRoom.name}</h2>
                        <div className="flex items-center gap-1.5 text-blue-100 text-[10px] sm:text-xs font-bold">
                          <span className="bg-black/10 px-2 py-0.5 rounded-full">Tầng {selectedRoom.floor}</span>
                          {selectedRoom.roomType && (
                            <span className="bg-black/10 px-2 py-0.5 rounded-full">{selectedRoom.roomType}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedRoom(null)
                      }}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition-all"
                    >
                      <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-tertiary/20">
                  <div className="space-y-5 sm:space-y-6">
                    {/* Status & Quick Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                      <Badge color={getStatusBadge(selectedRoom.status)} className="rounded-xl px-4 py-1.5 font-bold uppercase text-xs">
                        {getStatusLabel(selectedRoom.status)}
                      </Badge>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-primary p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-primary">
                        <p className="text-[10px] sm:text-xs font-bold text-tertiary uppercase mb-1">Diện tích</p>
                        <p className="text-lg sm:text-xl font-black text-primary">{selectedRoom.area ? `${selectedRoom.area} m²` : '-'}</p>
                      </div>
                      <div className="bg-primary p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-primary">
                        <p className="text-[10px] sm:text-xs font-bold text-tertiary uppercase mb-1">Giá thuê</p>
                        <p className="text-lg sm:text-xl font-black text-primary">{formatCurrency(Number(selectedRoom.price))}</p>
                      </div>
                      <div className="bg-primary p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-primary">
                        <p className="text-[10px] sm:text-xs font-bold text-tertiary uppercase mb-1">Số người</p>
                        <p className="text-lg sm:text-xl font-black text-primary">{selectedRoom.maxPeople || 0} người</p>
                      </div>
                      <div className="bg-primary p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-primary">
                        <p className="text-[10px] sm:text-xs font-bold text-tertiary uppercase mb-1">Loại phòng</p>
                        <p className="text-lg sm:text-xl font-black text-primary">{selectedRoom.roomType || '-'}</p>
                      </div>
                    </div>

                    {/* Tenant & Contract Info */}
                    {selectedRoom.contracts && selectedRoom.contracts.length > 0 && selectedRoom.contracts.some(c => c.status === 'ACTIVE') ? (
                      <div className="bg-primary p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-primary">
                        <h3 className="text-sm sm:text-base font-black text-primary mb-4 flex items-center gap-2">
                          <Users size={18} />
                          Thông tin khách thuê
                        </h3>
                        {selectedRoom.contracts.filter(c => c.status === 'ACTIVE').map((contract) => (
                          <div key={contract.id} className="space-y-4">
                            {/* Main Tenant */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div>
                                <p className="text-[10px] sm:text-xs font-bold text-tertiary uppercase mb-1.5">Người thuê chính</p>
                                <p className="font-bold text-primary">{contract.user.fullName}</p>
                                {contract.user.phone && <p className="text-sm text-secondary mt-1">{contract.user.phone}</p>}
                                {contract.user.email && <p className="text-sm text-secondary truncate mt-0.5">{contract.user.email}</p>}
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs font-bold text-tertiary uppercase mb-1.5">Hợp đồng</p>
                                {contract.startDate && (
                                  <p className="text-sm text-secondary">
                                    {formatDate(contract.startDate)} - {contract.endDate ? formatDate(contract.endDate) : '...'}
                                  </p>
                                )}
                                <p className="text-sm text-secondary mt-1.5">
                                  Giá thuê: <span className="font-bold text-primary">{formatCurrency(Number(contract.rentPrice || 0))}</span>
                                </p>
                                <p className="text-sm text-secondary mt-0.5">
                                  Đặt cọc: <span className="font-bold text-primary">{formatCurrency(Number(contract.deposit || 0))}</span>
                                </p>
                              </div>
                            </div>

                            {/* Occupants */}
                            {contract.occupants && contract.occupants.length > 0 && (
                              <div className="pt-3 sm:pt-4 border-t border-primary">
                                <p className="text-[10px] sm:text-xs font-bold text-tertiary uppercase mb-2">Người ở cùng ({contract.occupants.length})</p>
                                <div className="flex flex-wrap gap-2">
                                  {contract.occupants.map((occupant) => (
                                    <span key={occupant.id} className="bg-tertiary px-3 py-1.5 rounded-xl text-sm font-medium text-secondary">
                                      {occupant.fullName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Contract Link */}
                            <div className="pt-3 sm:pt-4">
                              <Link
                                href={`/admin/rooms/${selectedRoom.id}/contracts`}
                                className="text-sm font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                onClick={() => {
                                  setShowDetailModal(false)
                                  setSelectedRoom(null)
                                }}
                              >
                                Xem chi tiết hợp đồng
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-primary p-5 rounded-2xl border border-dashed border-primary text-center">
                        <Users size={32} className="text-tertiary mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-medium text-tertiary">Phòng trống</p>
                      </div>
                    )}

                    {/* Description */}
                    {selectedRoom.description && (
                      <div className="bg-primary p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-primary">
                        <h3 className="text-sm sm:text-base font-black text-primary mb-2.5">Mô tả</h3>
                        <p className="text-sm text-secondary leading-relaxed">{selectedRoom.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 bg-primary border-t border-primary flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/admin/rooms/${selectedRoom.id}`}
                    className="btn btn-primary h-11 px-6 rounded-2xl flex-1"
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedRoom(null)
                    }}
                  >
                    <Edit size={16} />
                    Chỉnh sửa
                  </Link>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedRoom(null)
                    }}
                    className="btn btn-secondary h-11 px-6 rounded-2xl"
                  >
                    Đóng
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-secondary">Không tìm thấy thông tin phòng</div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={cancelDelete}>
          <div className="bg-primary rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary">Xóa phòng</h2>
                <button onClick={cancelDelete} className="p-2 hover:bg-tertiary rounded-lg">
                  <X size={20} className="text-secondary" />
                </button>
              </div>
              <p className="text-secondary mb-6">
                Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={cancelDelete} className="btn btn-secondary btn-md" disabled={deleteLoading}>
                  Hủy
                </button>
                <button onClick={confirmDelete} className="btn btn-danger btn-md" disabled={deleteLoading}>
                  {deleteLoading ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
