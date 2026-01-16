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
  if (!contract) return { label: 'N/A', color: 'gray', className: 'bg-gray-100 text-gray-700' }
  
  // Check if deposit is paid (assuming deposit equals rentPrice * 2 as standard)
  const expectedDeposit = Number(contract.rentPrice) * 2
  const paidDeposit = Number(contract.deposit) || 0
  
  if (paidDeposit >= expectedDeposit) {
    return { label: 'Đã đồng đủ', color: 'green', className: 'bg-green-100 text-green-700' }
  } else if (paidDeposit > 0) {
    return { label: 'Thiếu cọc', color: 'orange', className: 'bg-orange-100 text-orange-700' }
  } else {
    return { label: 'Chưa đóng', color: 'red', className: 'bg-red-100 text-red-700' }
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Cư dân & Hợp đồng</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin cư dân và hợp đồng thuê phòng</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
          <Link
            href="/admin/residents/new"
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            <span>Check-in Mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">TỔNG SỐ CƯ DÂN</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ĐANG THUÊ</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ĐÃ CHUYỂN ĐI</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">TỔNG TIỀN CỌC</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(stats.totalDeposit)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Wallet className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT, email, hoặc phòng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select 
            value={buildingFilter}
            onChange={(e) => {
              setBuildingFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : residents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto text-gray-400" size={48} />
          <p className="text-gray-500 mt-4">Không tìm thấy cư dân nào</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    CƯ DÂN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    PHÒNG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    NGÀY VÀO Ở
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    HẠN HỢP ĐỒNG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    TRẠNG THÁI CỌC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedResidents.map((resident) => {
                  const contract = resident.contracts?.[0]
                  const depositStatus = getDepositStatus(contract)
                  const initials = getInitials(resident.fullName)
                  const daysRemaining = contract ? getDaysRemaining(contract.endDate) : null
                  const isContractExpiring = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30

                  return (
                    <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-semibold text-sm">{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{resident.fullName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone size={12} className="text-gray-400" />
                              <p className="text-xs text-gray-500">{resident.phone}</p>
                            </div>
                            {resident.email && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <Mail size={12} className="text-gray-400" />
                                <p className="text-xs text-gray-500">{resident.email}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contract?.room ? (
                          <div>
                            <span className="text-sm font-medium text-gray-900">{contract.room.name}</span>
                            <p className="text-xs text-gray-500">Tầng {contract.room.floor}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Chưa có phòng</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{formatDate(contract?.startDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contract ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{formatDate(contract.endDate)}</span>
                              {isContractExpiring && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                  Còn {daysRemaining} ngày
                                </span>
                              )}
                            </div>
                            {daysRemaining !== null && daysRemaining < 0 && (
                              <span className="text-xs text-red-600 mt-1 block">Đã hết hạn</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {contract ? (
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${depositStatus.className}`}>
                              {depositStatus.label}
                            </span>
                            {contract.deposit > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatCurrency(Number(contract.deposit))}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/residents/${resident.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </Link>
                          <Link
                            href={`/admin/residents/${resident.id}/edit`}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} className="text-blue-600" />
                          </Link>
                          {contract?.status === 'ACTIVE' && (
                            <button 
                              onClick={() => handleCheckout(resident.id, resident.fullName)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
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
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, residents.length)} trong tổng số {residents.length} cư dân
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className={`px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors ${
                        currentPage === pageNum ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : ''
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
