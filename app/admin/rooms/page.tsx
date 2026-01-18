'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Download, Search, Edit, Trash2, Building2, Users, DollarSign } from 'lucide-react'

interface Room {
  id: number
  name: string
  floor: number
  price: number
  area: number | null
  maxPeople: number
  status: string
  contracts: Array<{
    id: number
    status: string
    user: {
      fullName: string
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RENTED':
        return 'bg-red-500'
      case 'AVAILABLE':
        return 'bg-green-500'
      case 'MAINTENANCE':
        return 'bg-yellow-500'
      default:
        return 'bg-tertiary0'
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

  const totalPages = Math.ceil(rooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRooms = rooms.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Danh sách phòng</h1>
          <p className="text-secondary mt-1">Quản lý trạng thái và thông tin cư dân</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="btn btn-secondary btn-md"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <Link
            href="/admin/rooms/new"
            className="btn btn-primary btn-md"
          >
            <Plus size={19} strokeWidth={3} />
            <span>Thêm phòng mới</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={20} />
            <input
              type="text"
              placeholder="Tìm theo số phòng, tên khách thuê..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn-filter ${statusFilter === 'all' ? 'active' : ''}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`btn-filter flex items-center gap-1 ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80"></span>
              Trống
            </button>
            <button
              onClick={() => setStatusFilter('RENTED')}
              className={`btn-filter flex items-center gap-1 ${statusFilter === 'RENTED' ? 'active' : ''}`}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80"></span>
              Có khách
            </button>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="px-4 py-2 border border-primary rounded-lg text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary mb-1 font-medium">TỔNG SỐ PHÒNG</p>
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="card stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary mb-1 font-medium">ĐANG THUÊ</p>
              <p className="text-2xl font-bold text-primary">{stats.rented}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <Users className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="card stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary mb-1 font-medium">PHÒNG TRỐNG</p>
              <p className="text-2xl font-bold text-primary">{stats.vacant}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="card stat-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary mb-1 font-medium">DOANH THU THÁNG</p>
              <p className="text-2xl font-bold text-primary">
                {formatLargeCurrency(stats.revenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <DollarSign className="text-white" size={24} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedRooms.map((room) => {
              const activeContract = room.contracts.find(c => c.status === 'ACTIVE') || room.contracts[0]
              // Calculate total occupants: 1 (main tenant) + number of occupants
              const currentOccupants = activeContract 
                ? 1 + (activeContract.occupants?.length || 0)
                : 0

              return (
                <div
                  key={room.id}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-primary">{room.name}</h3>
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusColor(room.status)}`}
                    ></span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary">Trạng thái:</span>
                      <span
                        className={`text-sm font-medium ${
                          room.status === 'RENTED' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {getStatusLabel(room.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary">Giá thuê:</span>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(Number(room.price))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary">Người ở:</span>
                      <span className="text-sm font-medium text-primary">
                        {currentOccupants}/{room.maxPeople}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-primary">
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      className="btn btn-secondary btn-sm flex-1"
                      title="Chỉnh sửa thông tin phòng"
                    >
                      <Edit size={14} />
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {rooms.length > 0 && (
            <div className="card flex items-center justify-between">
              <p className="text-sm text-secondary">
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, rooms.length)} của {rooms.length} phòng
              </p>
              <div className="flex items-center gap-2">
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
    </div>
  )
}
