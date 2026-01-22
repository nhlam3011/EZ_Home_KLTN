'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Download, Search, Edit, Trash2, Building2, Users, DollarSign, X, Home, Ruler, FileText, Calendar, Phone, Mail, MapPin, CheckCircle } from 'lucide-react'

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

  useEffect(() => {
    fetchRooms()
  }, [search, statusFilter, floorFilter])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (floorFilter !== 'all') params.append('floor', floorFilter)

      const response = await fetch(`/api/rooms?${params.toString()}`)
      const data = await response.json()
      setRooms(data)

      // Calculate stats
      const total = data.length
      const rented = data.filter((r: Room) => r.status === 'RENTED').length
      const vacant = data.filter((r: Room) => r.status === 'AVAILABLE').length

      // Fetch revenue
      const revenueRes = await fetch('/api/invoices?status=PAID')
      const invoices = await revenueRes.json()
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const monthlyInvoices = invoices.filter(
        (inv: any) => inv.month === currentMonth && inv.year === currentYear
      )
      const revenue = monthlyInvoices.reduce(
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

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác.')) return

    try {
      const response = await fetch(`/api/rooms/${id}`, {
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
    }
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
        return 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded'
      case 'AVAILABLE':
        return 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded'
      case 'MAINTENANCE':
        return 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded'
      default:
        return 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded'
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Danh sách phòng</h1>
          <p className="text-secondary mt-1 text-sm sm:text-base">Quản lý trạng thái và thông tin cư dân</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button 
            onClick={handleExport}
            className="btn btn-secondary btn-sm sm:btn-md flex-1 sm:flex-initial"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link
            href="/admin/rooms/new"
            className="btn btn-primary btn-sm sm:btn-md flex-1 sm:flex-initial"
          >
            <Plus size={19} strokeWidth={3} />
            <span className="hidden sm:inline">Thêm phòng mới</span>
            <span className="sm:hidden">Thêm mới</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={20} />
            <input
              type="text"
              placeholder="Tìm theo số phòng, tên khách thuê..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn-filter text-xs sm:text-sm ${statusFilter === 'all' ? 'active' : ''}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`btn-filter flex items-center gap-1 text-xs sm:text-sm ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80"></span>
              <span className="hidden sm:inline">Trống</span>
              <span className="sm:hidden">Trống</span>
            </button>
            <button
              onClick={() => setStatusFilter('RENTED')}
              className={`btn-filter flex items-center gap-1 text-xs sm:text-sm ${statusFilter === 'RENTED' ? 'active' : ''}`}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80"></span>
              <span className="hidden sm:inline">Có khách</span>
              <span className="sm:hidden">Có khách</span>
            </button>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-primary rounded-lg text-xs sm:text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-initial min-w-[120px]"
            >
              <option value="all">Tất cả tầng</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(floor => (
                <option key={floor} value={floor}>Tầng {floor}</option>
              ))}
            </select>
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
        <div className="text-center py-12">
          <p className="text-tertiary">Đang tải...</p>
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
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(room.status)}`}>
                        {getStatusLabel(room.status)}
                      </span>
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
                      className="btn btn-secondary btn-sm flex-1 text-xs sm:text-sm"
                      title="Chỉnh sửa thông tin phòng"
                    >
                      <Edit size={14} />
                      <span>Sửa</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(room.id)
                      }}
                      className="btn btn-outline-danger btn-sm text-xs sm:text-sm"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Xóa</span>
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
                      className={`btn btn-sm ${
                        currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false)
              setSelectedRoom(null)
            }
          }}
        >
          <div className="bg-primary rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col animate-scale-in">
            {loadingDetail ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-tertiary text-sm sm:text-base">Đang tải thông tin phòng...</p>
              </div>
            ) : selectedRoom ? (
              <>
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 text-white relative overflow-visible">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                  <div className="relative flex items-center justify-between gap-2 sm:gap-3 min-h-[60px] sm:min-h-[70px] md:min-h-[80px]">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg border border-white/30 flex-shrink-0">
                        <Building2 size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <h2 className="text-base sm:text-xl md:text-2xl font-bold mb-1.5 sm:mb-2 leading-tight truncate">{selectedRoom.name}</h2>
                        <p className="text-blue-100 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-wrap leading-normal min-h-[18px] sm:min-h-[20px]">
                          <MapPin size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">Tầng {selectedRoom.floor}</span>
                          {selectedRoom.roomType && (
                            <>
                              <span className="mx-0.5 sm:mx-1 hidden sm:inline">•</span>
                              <span className="truncate max-w-[120px] sm:max-w-none">{selectedRoom.roomType}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedRoom(null)
                      }}
                      className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-all hover:scale-110 flex-shrink-0 active:scale-95"
                      aria-label="Đóng"
                    >
                      <X size={18} className="sm:w-5 sm:h-5 md:w-5.5 md:h-5.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-gradient-to-b from-primary to-secondary/50">

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                      {/* Status & Quick Info */}
                      <div className="card hover:shadow-lg transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-primary">
                          <h3 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                              <Building2 size={18} className="sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span>Thông tin phòng</span>
                          </h3>
                          <span className={getStatusBadge(selectedRoom.status)}>
                            {getStatusLabel(selectedRoom.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group">
                            <p className="text-xs text-tertiary mb-1.5 sm:mb-2 font-medium uppercase tracking-wide">Diện tích</p>
                            <p className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              <Ruler size={18} className="sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{selectedRoom.area ? `${selectedRoom.area} m²` : 'Chưa cập nhật'}</span>
                            </p>
                          </div>
                          <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg sm:rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all group">
                            <p className="text-xs text-tertiary mb-1.5 sm:mb-2 font-medium uppercase tracking-wide">Số người tối đa</p>
                            <p className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              <Users size={18} className="sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                              <span>{selectedRoom.maxPeople} người</span>
                            </p>
                          </div>
                          <div className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all group">
                            <p className="text-xs text-tertiary mb-1.5 sm:mb-2 font-medium uppercase tracking-wide">Giá thuê/tháng</p>
                            <p className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              <DollarSign size={18} className="sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                              <span className="truncate">{formatCurrency(Number(selectedRoom.price))}</span>
                            </p>
                          </div>
                          {selectedRoom.roomType && (
                            <div className="p-4 sm:p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg sm:rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all group">
                              <p className="text-xs text-tertiary mb-1.5 sm:mb-2 font-medium uppercase tracking-wide">Loại phòng</p>
                              <p className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                <Home size={18} className="sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                                <span className="truncate">{selectedRoom.roomType}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {selectedRoom.description && (
                        <div className="card hover:shadow-lg transition-shadow">
                          <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                              <FileText size={16} className="sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span>Mô tả phòng</span>
                          </h3>
                          <div className="bg-gradient-to-br from-tertiary to-secondary/30 p-4 sm:p-5 rounded-lg sm:rounded-xl border border-primary">
                            <p className="text-xs sm:text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                              {selectedRoom.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                        <div className="card hover:shadow-lg transition-shadow">
                          <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                              <CheckCircle size={16} className="sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span>Tiện ích phòng</span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {selectedRoom.amenities.map((amenity, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 sm:px-4 sm:py-2.5 text-primary dark:text-primary rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 hover:bg-tertiary transition-colors"
                              >
                                <CheckCircle size={14} className="sm:w-4 sm:h-4 text-primary dark:text-primary flex-shrink-0" />
                                <span className="truncate">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Contract Info */}
                    <div className="space-y-4 sm:space-y-6">
                      {/* Current Tenant */}
                      {selectedRoom.contracts && selectedRoom.contracts.length > 0 ? (
                        selectedRoom.contracts.map((contract) => (
                          <div key={contract.id} className="card bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-teal-900/20 border-2 border-green-300 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
                            <h3 className="text-base sm:text-lg font-semibold text-primary mb-4 sm:mb-5 flex items-center gap-2 sm:gap-3 pb-3 border-b border-green-200 dark:border-green-800">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                <Users size={16} className="sm:w-5 sm:h-5 text-white" />
                              </div>
                              <span>Khách thuê</span>
                            </h3>
                            <div className="space-y-3 sm:space-y-4">
                              <div>
                                <p className="text-xs sm:text-sm text-tertiary mb-1">Tên khách thuê</p>
                                <p className="text-sm sm:text-base font-bold text-primary break-words">{contract.user.fullName}</p>
                              </div>
                              {contract.user.phone && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Phone size={14} className="sm:w-4 sm:h-4 text-tertiary flex-shrink-0" />
                                  <span className="text-secondary break-all">{contract.user.phone}</span>
                                </div>
                              )}
                              {contract.user.email && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Mail size={14} className="sm:w-4 sm:h-4 text-tertiary flex-shrink-0" />
                                  <span className="text-secondary break-all">{contract.user.email}</span>
                                </div>
                              )}
                              {contract.startDate && (
                                <div className="pt-2 sm:pt-3 border-t border-primary">
                                  <p className="text-xs text-tertiary mb-1.5 sm:mb-2">Thời gian hợp đồng</p>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                      <Calendar size={12} className="sm:w-3.5 sm:h-3.5 text-tertiary flex-shrink-0" />
                                      <span className="text-secondary break-words">
                                        Bắt đầu: {formatDate(contract.startDate)}
                                      </span>
                                    </div>
                                    {contract.endDate && (
                                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <Calendar size={12} className="sm:w-3.5 sm:h-3.5 text-tertiary flex-shrink-0" />
                                        <span className="text-secondary break-words">
                                          Kết thúc: {formatDate(contract.endDate)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {(contract.deposit || contract.rentPrice) && (
                                <div className="pt-2 sm:pt-3 border-t border-primary">
                                  <p className="text-xs text-tertiary mb-1.5 sm:mb-2">Thông tin tài chính</p>
                                  <div className="space-y-1">
                                    {contract.deposit && (
                                      <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                        <span className="text-secondary">Tiền cọc:</span>
                                        <span className="font-semibold text-primary text-right break-words">
                                          {formatCurrency(Number(contract.deposit))}
                                        </span>
                                      </div>
                                    )}
                                    {contract.rentPrice && (
                                      <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                        <span className="text-secondary">Giá thuê:</span>
                                        <span className="font-semibold text-primary text-right break-words">
                                          {formatCurrency(Number(contract.rentPrice))}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {contract.occupants && contract.occupants.length > 0 && (
                                <div className="pt-2 sm:pt-3 border-t border-primary">
                                  <p className="text-xs text-tertiary mb-1.5 sm:mb-2">Người ở cùng</p>
                                  <div className="space-y-1">
                                    {contract.occupants.map((occupant) => (
                                      <div key={occupant.id} className="text-xs sm:text-sm text-secondary flex items-center gap-2">
                                        <Users size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                        <span className="break-words">{occupant.fullName}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="pt-2 sm:pt-3 border-t border-primary mt-2 sm:mt-3">
                                <Link
                                  href={`/admin/rooms/${selectedRoom.id}/contracts`}
                                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 flex items-center gap-2 font-medium"
                                  onClick={() => {
                                    setShowDetailModal(false)
                                    setSelectedRoom(null)
                                  }}
                                >
                                  <FileText size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="break-words">Xem chi tiết hợp đồng</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="card bg-tertiary border-dashed border-2 border-primary">
                          <div className="text-center py-8">
                            <Users size={48} className="text-tertiary mx-auto mb-3" />
                            <p className="text-sm text-tertiary">Phòng chưa có khách thuê</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </>
            ) : null}
            
            {/* Footer Actions */}
            {selectedRoom && (
              <div className="border-t-2 border-primary bg-gradient-to-r from-tertiary to-secondary/50 p-3 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href={`/admin/rooms/${selectedRoom.id}`}
                  className="btn btn-primary btn-md sm:btn-lg flex-1 justify-center"
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedRoom(null)
                  }}
                >
                  <Edit size={18} className="sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">Chỉnh sửa phòng</span>
                </Link>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedRoom(null)
                  }}
                  className="btn btn-secondary btn-md sm:btn-lg flex-shrink-0 w-full sm:w-auto sm:min-w-[120px] justify-center"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                  <span>Đóng</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
