'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Download, Search, Eye, Edit, Users, Building2, Calendar, Wallet, Phone, Mail, MapPin } from 'lucide-react'

interface Resident {
  id: number
  fullName: string
  phone: string
  email: string | null
  cccdNumber: string | null
  address: string | null
  contracts: Array<{
    id: number
    startDate: Date | string | null
    endDate: Date | string | null
    deposit: number
    rentPrice: number
    status: string
    room: {
      id: number
      name: string
      floor: number
    } | null
  }>
}

interface Stats {
  total: number
  active: number
  inactive: number
  totalDeposit: number
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getDepositStatus(contract: any) {
  if (!contract) return { label: 'N/A', color: 'gray', className: 'bg-tertiary text-primary' }
  
  // Check if deposit is paid (deposit >= rentPrice means deposit is sufficient)
  const expectedDeposit = Number(contract.rentPrice)
  const paidDeposit = Number(contract.deposit) || 0
  
  if (paidDeposit >= expectedDeposit) {
    return { label: 'Đã đủ cọc', color: 'green', className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded' }
  } else if (paidDeposit > 0) {
    return { label: 'Thiếu cọc', color: 'orange', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' }
  } else {
    return { label: 'Chưa đóng', color: 'red', className: 'bg-red-200 dark:bg-red-900/10 text-red-900 dark:text-red-300 border border-red-400 dark:border-red-700 font-semibold' }
  }
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalDeposit: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchResidents()
  }, [search, buildingFilter, floorFilter, statusFilter])

  const fetchResidents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (buildingFilter !== 'all') params.append('building', buildingFilter)
      if (floorFilter !== 'all') params.append('floor', floorFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/residents?${params.toString()}`)
      const data = await response.json()
      
      const residentsList = data.residents || data || []
      setResidents(residentsList)
      
      // Calculate stats
      const active = residentsList.filter((r: Resident) => 
        r.contracts && r.contracts.length > 0 && r.contracts[0]?.status === 'ACTIVE'
      ).length
      
      const totalDeposit = residentsList.reduce((sum: number, r: Resident) => {
        const contract = r.contracts?.[0]
        return sum + (Number(contract?.deposit) || 0)
      }, 0)

      setStats({
        total: residentsList.length,
        active,
        inactive: residentsList.length - active,
        totalDeposit
      })
    } catch (error) {
      console.error('Error fetching residents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/residents/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Danh-sach-cu-dan-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('Xuất file thành công!')
      } else {
        alert('Không thể xuất file. Vui lòng thử lại sau.')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Có lỗi xảy ra khi xuất file')
    }
  }

  const handleCheckout = async (residentId: number, residentName: string) => {
    const confirmed = confirm(`Bạn có chắc chắn muốn check-out cư dân ${residentName}?\n\nHành động này sẽ:\n- Chấm dứt hợp đồng hiện tại\n- Chuyển trạng thái phòng về "Trống"\n- Lưu lịch sử hợp đồng`)
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/residents/${residentId}/checkout`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('Check-out thành công!')
        fetchResidents()
      } else {
        alert(data.error || 'Có lỗi xảy ra khi check-out')
      }
    } catch (error) {
      console.error('Error checking out:', error)
      alert('Có lỗi xảy ra khi check-out. Vui lòng thử lại sau.')
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getDaysRemaining = (endDate: Date | string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const totalPages = Math.ceil(residents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedResidents = residents.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý Cư dân & Hợp đồng</h1>
          <p className="text-secondary mt-1">Quản lý thông tin cư dân và hợp đồng thuê phòng</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="btn btn-secondary btn-md"
          >
            <Download size={18} strokeWidth={2} />
            <span>Xuất Excel</span>
          </button>
          <Link
            href="/admin/residents/new"
            className="btn btn-primary btn-md"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Check-in Mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">TỔNG SỐ CƯ DÂN</p>
            <p className="text-2xl font-bold text-primary mb-1">{stats.total}</p>
          </div>
        </div>
        <div className="card stat-card-green">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">ĐANG THUÊ</p>
            <p className="text-2xl font-bold text-primary mb-1">{stats.active}</p>
            <p className="text-xs text-secondary font-medium">
              {stats.inactive} đã chuyển đi
            </p>
          </div>
        </div>
        <div className="card stat-card-purple">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">ĐÃ CHUYỂN ĐI</p>
            <p className="text-2xl font-bold text-primary mb-1">{stats.inactive}</p>
          </div>
        </div>
        <div className="card stat-card-orange">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <Wallet className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-primary mb-1 font-medium">TỔNG TIỀN CỌC</p>
            <p className="text-2xl font-bold text-primary mb-1">{formatCurrency(stats.totalDeposit)}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-primary rounded-lg shadow-sm border border-primary p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT, email, hoặc phòng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select 
            value={buildingFilter}
            onChange={(e) => {
              setBuildingFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-primary rounded-lg text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tòa nhà: Tất cả</option>
            <option value="A">Tòa A</option>
            <option value="B">Tòa B</option>
            <option value="C">Tòa C</option>
          </select>
          <select 
            value={floorFilter}
            onChange={(e) => {
              setFloorFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-primary rounded-lg text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tầng: Tất cả</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(floor => (
              <option key={floor} value={floor}>Tầng {floor}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-primary rounded-lg text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="ACTIVE">Đang thuê</option>
            <option value="INACTIVE">Đã chuyển đi</option>
          </select>
        </div>
      </div>

      {/* Residents Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-tertiary">Đang tải...</p>
        </div>
      ) : residents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto text-tertiary" size={48} />
          <p className="text-tertiary mt-4">Không tìm thấy cư dân nào</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-tertiary border-b border-primary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    CƯ DÂN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    PHÒNG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    NGÀY VÀO Ở
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    HẠN HỢP ĐỒNG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                    TRẠNG THÁI CỌC
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-secondary uppercase">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary">
                {paginatedResidents.map((resident) => {
                  const contract = resident.contracts?.[0]
                  const depositStatus = getDepositStatus(contract)
                  const initials = getInitials(resident.fullName)
                  const daysRemaining = contract ? getDaysRemaining(contract.endDate) : null
                  const isContractExpiring = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30

                  return (
                    <tr key={resident.id} className="hover:bg-secondary transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-semibold text-sm">{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">{resident.fullName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone size={12} className="text-tertiary" />
                              <p className="text-xs text-tertiary">{resident.phone}</p>
                            </div>
                            {resident.email && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <Mail size={12} className="text-tertiary" />
                                <p className="text-xs text-tertiary">{resident.email}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contract?.room ? (
                          <div>
                            <span className="text-sm font-medium text-primary">{contract.room.name}</span>
                            <p className="text-xs text-tertiary">Tầng {contract.room.floor}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-tertiary">Chưa có phòng</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-tertiary" />
                          <span className="text-sm text-secondary">{formatDate(contract?.startDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contract ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-secondary">{formatDate(contract.endDate)}</span>
                              {isContractExpiring && (
                                <span className="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 rounded text-xs font-semibold">
                                  Còn {daysRemaining} ngày
                                </span>
                              )}
                            </div>
                            {daysRemaining !== null && daysRemaining < 0 && (
                              <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">Đã hết hạn</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-tertiary">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {contract ? (
                          <div>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${depositStatus.className}`}>
                              {depositStatus.label}
                            </span>
                            {contract.deposit > 0 && (
                              <p className="text-xs text-tertiary mt-1">
                                {formatCurrency(Number(contract.deposit))}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-tertiary">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/residents/${resident.id}`}
                            className="btn btn-ghost btn-icon"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} strokeWidth={2} />
                          </Link>
                          <Link
                            href={`/admin/residents/${resident.id}/edit`}
                            className="btn btn-ghost btn-icon"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} strokeWidth={2} />
                          </Link>
                          {contract?.status === 'ACTIVE' && (
                            <button 
                              onClick={() => handleCheckout(resident.id, resident.fullName)}
                              className="btn btn-danger btn-sm"
                              title="Check-out cư dân"
                            >
                              Check-out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {residents.length > 0 && (
            <div className="flex items-center justify-between card p-4">
              <p className="text-sm text-secondary">
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, residents.length)} trong tổng số {residents.length} cư dân
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  if (pageNum > totalPages) return null
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
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-2 text-tertiary">...</span>
                )}
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
