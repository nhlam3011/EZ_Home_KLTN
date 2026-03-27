'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from 'flowbite-react'
import Loading from '@/components/Loading'
import {
  Plus,
  Download,
  Search,
  Edit,
  Trash2,
  Building2,
  Users,
  DollarSign,
  AlertCircle,
  Home, Ruler, FileText, Calendar, Phone, Mail, MapPin, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, Wrench,
  MoreHorizontal
} from 'lucide-react'
import { useBuilding } from '@/components/BuildingContext'

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
  building?: {
    id: number
    name: string
  }
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
  const { selectedBuildingId, buildings } = useBuilding()
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
    setCurrentPage(1)
    setShowDetailModal(false)
    setShowConfirmModal(false)
    setSelectedRoom(null)
    fetchRooms()
  }, [search, statusFilter, floorFilter, selectedBuildingId])


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

      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const revenueParams = new URLSearchParams({
        status: 'PAID',
        month: currentMonth.toString(),
        year: currentYear.toString()
      })
      if (selectedBuildingId) revenueParams.append('buildingId', selectedBuildingId.toString())

      const [response, revenueRes] = await Promise.all([
        fetch(`/api/rooms?${params.toString()}`),
        fetch(`/api/invoices?${revenueParams.toString()}`)
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
        return 'bg-rose-500'
      case 'AVAILABLE':
        return 'bg-emerald-500'
      case 'MAINTENANCE':
        return 'bg-amber-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider">Phòng trống</span>
      case 'RENTED': return <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/30 dark:border-rose-800 text-[10px] font-bold uppercase tracking-wider">Đang thuê</span>
      case 'MAINTENANCE': return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:border-amber-800 text-[10px] font-bold uppercase tracking-wider">Bảo trì</span>
      default: return <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-900/30 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider">{status}</span>
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
    <div className="space-y-6 pb-28 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">QUẢN LÝ PHÒNG</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Quản lý trạng thái và thông tin cư dân</p>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full lg:flex lg:flex-row lg:w-auto lg:items-center lg:gap-3">
          <button
            onClick={handleExport}
            className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 group hover:bg-white dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Download size={18} className="text-[var(--accent-blue)]" />
            </div>
            <span className="font-bold text-xs uppercase tracking-tight text-secondary group-hover:text-[var(--accent-blue)] transition-colors whitespace-nowrap">Export</span>
          </button>
          <Link
            href="/admin/rooms/new"
            className="btn btn-primary h-11 px-6 rounded-2xl !hidden sm:!flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
            <span className="font-bold">Thêm phòng mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">TỔNG PHÒNG</p>
              <p className="text-lg sm:text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Home className="text-white" size={20} />
            </div>
          </div>
        </div>
        <div className="card stat-card-orange">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">ĐANG THUÊ</p>
              <p className="text-lg sm:text-xl font-bold text-primary">{stats.rented}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <Users className="text-white" size={20} />
            </div>
          </div>
        </div>
        <div className="card stat-card-green">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">CÒN TRỐNG</p>
              <p className="text-lg sm:text-xl font-bold text-primary">{stats.vacant}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <CheckCircle className="text-white" size={20} />
            </div>
          </div>
        </div>
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">DOANH THU THÁNG</p>
              <p className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">{formatCurrency(stats.revenue)}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col lg:flex-row items-center gap-4 !overflow-visible relative z-20">
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <div className="relative w-full sm:w-64">
              <button
                onClick={() => {
                  setShowFloorDropdown(!showFloorDropdown)
                  setShowStatusDropdown(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showFloorDropdown ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg' : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'}`}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex-shrink-0">
                  <Building2 size={14} />
                </div>
                <div className="text-left pr-1 min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight truncate text-primary uppercase tracking-wider">
                    {floorFilter === 'all' ? 'TẤT CẢ CÁC TẦNG' : `TẦNG ${floorFilter}`}
                  </p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ml-auto ${showFloorDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showFloorDropdown && (
                <>
                  <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowFloorDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left max-h-[300px] overflow-y-auto no-scrollbar">
                    <button onClick={() => { setFloorFilter('all'); setShowFloorDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${floorFilter === 'all' ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}>TẤT CẢ CÁC TẦNG</button>
                    {Array.from({ length: buildings.find((b: any) => b.id === selectedBuildingId)?.floorCount || maxFloors }, (_, i) => i + 1).map(floor => (
                      <button key={floor} onClick={() => { setFloorFilter(floor.toString()); setShowFloorDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 whitespace-nowrap ${floorFilter === floor.toString() ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}>TẦNG {floor}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative w-full sm:w-64">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown)
                  setShowFloorDropdown(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg' : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'}`}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex-shrink-0">
                  {statusFilter === 'all' && <Home size={14} />}
                  {statusFilter === 'AVAILABLE' && <CheckCircle size={14} />}
                  {statusFilter === 'RENTED' && <Users size={14} />}
                  {statusFilter === 'MAINTENANCE' && <Building2 size={14} />}
                </div>
                <div className="text-left pr-1 min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight truncate text-primary uppercase tracking-wider">
                    {statusFilter === 'all' ? 'TẤT CẢ TRẠNG THÁI' : statusFilter === 'AVAILABLE' ? 'PHÒNG TRỐNG' : statusFilter === 'RENTED' ? 'ĐANG CHO THUÊ' : 'BẢO TRÌ'}
                  </p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ml-auto ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowStatusDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left overflow-y-auto no-scrollbar">
                    <button onClick={() => { setStatusFilter('all'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}>TẤT CẢ TRẠNG THÁI</button>
                    <button onClick={() => { setStatusFilter('AVAILABLE'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 whitespace-nowrap ${statusFilter === 'AVAILABLE' ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}>PHÒNG TRỐNG</button>
                    <button onClick={() => { setStatusFilter('RENTED'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 whitespace-nowrap ${statusFilter === 'RENTED' ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}>ĐANG CHO THUÊ</button>
                    <button onClick={() => { setStatusFilter('MAINTENANCE'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 whitespace-nowrap ${statusFilter === 'MAINTENANCE' ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}>BẢO TRÌ</button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm phòng..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="input input-with-icon w-full h-11 pl-11 pr-4 rounded-xl bg-white dark:bg-primary border-primary focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center bg-primary rounded-2xl border border-primary">
          <Loading size="lg" text="Đang tải danh sách phòng..." />
        </div>
      ) : rooms.length === 0 ? (
        <div className="card py-20 border-2 border-dashed border-primary flex flex-col items-center justify-center bg-primary">
          <div className="w-16 h-16 rounded-2xl bg-tertiary flex items-center justify-center text-tertiary mb-4 opacity-50">
            <Home size={32} />
          </div>
          <h3 className="text-lg font-bold text-primary">Chưa có phòng nào</h3>
          <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">Vui lòng thay đổi bộ lọc hoặc thêm phòng mới</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedRooms.map((room) => {
            const activeContract = room.contracts.find(c => c.status === 'ACTIVE')
            const currentOccupants = activeContract ? 1 + (activeContract.occupants?.length || 0) : 0

            return (
              <div
                key={room.id}
                className="card group bg-primary border-primary overflow-hidden hover:border-blue-500/30 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer"
                onClick={() => handleViewDetail(room.id)}
              >
                <div className="p-3 flex flex-col h-full gap-2 bg-white dark:bg-slate-800/60 transition-colors">
                  {/* Top Section */}
                  <div className="flex items-center justify-between h-6">
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">{room.name}</h3>
                      <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-[0.1em]">Tầng {room.floor} • {room.roomType || 'Phòng trọ'}</p>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${room.status === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`}></div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-700/50"></div>

                  {/* Info Rows */}
                  <div className="space-y-1.5 flex-1 py-0.5">
                    <div className="flex items-center justify-between text-left h-5">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">GIÁ THUÊ</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(Number(room.price))}</span>
                    </div>
                    <div className="h-px bg-slate-50 dark:bg-slate-800/30"></div>
                    <div className="flex items-center justify-between text-left h-5">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">SỐ NGƯỜI</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-widest">{currentOccupants} / {room.maxPeople}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="h-px bg-slate-100 dark:bg-slate-700/50 mt-1"></div>

                  <div className="flex flex-row items-center gap-2 mt-auto pt-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 w-full xs:w-auto">
                      <Link
                        href={`/admin/rooms/${room.id}`}
                        title="Chỉnh sửa phòng"
                        className="flex-1 xs:w-9 h-9 shrink-0 rounded-xl bg-amber-100 text-amber-600 border border-amber-100 flex items-center justify-center hover:bg-amber-100 transition-all shadow-sm"
                      >
                        <Edit size={16} className="text-amber-600" />
                      </Link>
                      <button
                        onClick={() => handleViewDetail(room.id)}
                        title="Xem chi tiết phòng"
                        className="flex-1 xs:w-9 h-9 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                      >
                        <ArrowUpRight size={16} className="text-white" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(room.id)}
                      title="Xóa phòng"
                      className="w-9 h-9 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-10">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary disabled:opacity-30 hover:bg-tertiary transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="bg-primary px-6 h-10 rounded-xl border border-primary flex items-center justify-center gap-3">
            <span className="text-xs font-bold text-blue-600">{currentPage}</span>
            <span className="text-[10px] text-tertiary font-black">/ {totalPages}</span>
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary disabled:opacity-30 hover:bg-tertiary transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Room Detail Modal - Oversaturated Indigo/Purple Fixed */}
      {showDetailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-primary rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            {loadingDetail ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <Loading size="lg" />
              </div>
            ) : selectedRoom ? (
              <>
                <div className="p-6 border-b border-primary flex items-center justify-between flex-shrink-0 bg-blue-50/20 dark:bg-blue-900/10">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Home size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary uppercase tracking-tight">{selectedRoom.name}</h2>
                      <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mt-1">Chi tiết phòng • Tầng {selectedRoom.floor}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center hover:bg-tertiary transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  {/* Status Badge Large */}
                  <div className="flex justify-center flex-shrink-0">
                    <div className="scale-110">{getStatusBadge(selectedRoom.status)}</div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                    <div className="p-4 rounded-xl bg-tertiary/10 border border-primary">
                      <p className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1">Diện tích</p>
                      <p className="text-sm font-bold text-primary">{selectedRoom.area || '-'} m²</p>
                    </div>
                    <div className="p-4 rounded-xl bg-tertiary/10 border border-primary">
                      <p className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1">Giá thuê</p>
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(Number(selectedRoom.price))}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-tertiary/10 border border-primary">
                      <p className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1">Số người</p>
                      <p className="text-sm font-bold text-primary">{selectedRoom.maxPeople || 0} tối đa</p>
                    </div>
                    <div className="p-4 rounded-xl bg-tertiary/10 border border-primary">
                      <p className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1">Loại phòng</p>
                      <p className="text-sm font-bold text-primary uppercase">{selectedRoom.roomType || '-'}</p>
                    </div>
                  </div>

                  {/* Tenant Info */}
                  {selectedRoom.contracts?.some(c => c.status === 'ACTIVE') ? (
                    <div className="p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-900/5 text-left">
                      <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users size={14} /> Khách đang thuê
                      </h3>
                      {selectedRoom.contracts.filter(c => c.status === 'ACTIVE').map(contract => (
                        <div key={contract.id} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <p className="text-[9px] font-black text-tertiary uppercase tracking-widest">Người thuê chính</p>
                              <p className="text-base font-bold text-primary uppercase">{contract.user.fullName}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-tertiary">
                                <Phone size={12} className="text-blue-500" />
                                <span className="text-[10px] font-bold tracking-widest">{contract.user.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-tertiary">
                                <Mail size={12} className="text-blue-500" />
                                <span className="text-[10px] font-bold truncate">{contract.user.email || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[9px] font-black text-tertiary uppercase tracking-widest">Thời hạn hợp đồng</p>
                              <p className="text-[10px] font-bold text-primary">
                                {formatDate(contract.startDate || '')} → {contract.endDate ? formatDate(contract.endDate) : 'Vô thời hạn'}
                              </p>
                            </div>
                            <Link href={`/admin/rooms/${selectedRoom.id}/contracts`} onClick={() => setShowDetailModal(false)} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                              Xem chi tiết hợp đồng <ArrowUpRight size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 rounded-2xl border-2 border-dashed border-primary flex flex-col items-center justify-center opacity-50">
                      <Users size={24} className="text-tertiary mb-2" />
                      <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Phòng hiện tại đang trống</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                    <div className="text-left">
                      <p className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-3 ml-1">Tiện ích phòng</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenities.map((item, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-lg bg-tertiary/20 text-[10px] font-bold text-secondary border border-primary">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-primary border-t border-primary flex items-center justify-end gap-3 flex-shrink-0">
                  <button onClick={() => setShowDetailModal(false)} className="px-6 h-11 rounded-xl font-bold text-secondary hover:bg-tertiary transition-all uppercase tracking-wider text-[10px]">Đóng</button>
                  <Link href={`/admin/rooms/${selectedRoom.id}`} onClick={() => setShowDetailModal(false)} className="btn btn-primary h-11 px-8 shadow-lg shadow-blue-600/20 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <Edit size={16} /> Chỉnh sửa phòng
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-primary rounded-2xl w-full max-w-sm shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-primary text-center">Xóa phòng này?</h2>
            <p className="text-sm text-tertiary text-center mt-2 leading-relaxed">
              Dữ liệu về phòng này và lịch sử liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={cancelDelete} className="h-12 rounded-xl border border-primary font-bold text-secondary hover:bg-tertiary transition-all uppercase tracking-wider text-[10px]" disabled={deleteLoading}>Hủy bỏ</button>
              <button onClick={confirmDelete} className="h-12 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all uppercase tracking-wider text-[10px] shadow-lg shadow-rose-600/20" disabled={deleteLoading}>
                {deleteLoading ? <Loading size="sm" /> : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sticky Footer */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-primary px-3 py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 pb-safe">
        <Link
          href="/admin/rooms/new"
          className="btn btn-primary btn-md w-full py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span className="font-bold uppercase text-[13px] tracking-tight">Thêm phòng mới</span>
        </Link>
      </div>
    </div>
  )
}
