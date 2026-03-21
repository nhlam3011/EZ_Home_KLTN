'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from 'flowbite-react'
import { Plus, Download, Search, Eye, Edit, Users, Building2, Calendar, Wallet, Phone, Mail, MapPin, LogOut, X, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Home } from 'lucide-react'
import Loading from '@/components/Loading'
import { useBuilding } from '@/components/BuildingContext'

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
  if (!contract) return { label: 'N/A', color: 'gray' }

  // Check if deposit is paid (deposit >= rentPrice means deposit is sufficient)
  const expectedDeposit = Number(contract.rentPrice)
  const paidDeposit = Number(contract.deposit) || 0

  if (paidDeposit >= expectedDeposit) {
    return { label: 'Đã đủ cọc', color: 'success' }
  } else if (paidDeposit > 0) {
    return { label: 'Thiếu cọc', color: 'warning' }
  } else {
    return { label: 'Chưa đóng', color: 'failure' }
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
  const [floorFilter, setFloorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [maxFloors, setMaxFloors] = useState(15)
  const itemsPerPage = 10
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutData, setCheckoutData] = useState<{ id: number; name: string } | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showFloorDropdown, setShowFloorDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  const { selectedBuildingId } = useBuilding()

  useEffect(() => {
    setCurrentPage(1)
    fetchResidents()
  }, [search, floorFilter, statusFilter, selectedBuildingId])

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

  const fetchResidents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (floorFilter !== 'all') params.append('floor', floorFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

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
      const url = selectedBuildingId 
        ? `/api/residents?action=export&buildingId=${selectedBuildingId}`
        : '/api/residents?action=export'
      const response = await fetch(url)
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

  const handleCheckout = (residentId: number, residentName: string) => {
    setCheckoutData({ id: residentId, name: residentName })
    setShowCheckoutModal(true)
  }

  const confirmCheckout = async () => {
    if (!checkoutData) return

    setCheckoutLoading(true)
    try {
      const response = await fetch(`/api/residents/${checkoutData.id}/checkout`, {
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
    } finally {
      setCheckoutLoading(false)
      setShowCheckoutModal(false)
      setCheckoutData(null)
    }
  }

  const cancelCheckout = () => {
    setShowCheckoutModal(false)
    setCheckoutData(null)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">QUẢN LÝ CƯ DÂN</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Quản lý thông tin cư dân và hợp đồng thuê phòng</p>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full lg:flex lg:flex-row lg:w-auto lg:items-center lg:gap-3">
          <Link
            href="/admin/residents/new"
            className="btn btn-primary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 order-1 lg:order-none shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
            <span className="font-bold">Check-in Mới</span>
          </Link>
          <button
            onClick={handleExport}
            className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 group hover:bg-white dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Download size={18} className="text-[var(--accent-blue)]" />
            </div>
            <span className="font-bold text-xs uppercase tracking-tight text-secondary group-hover:text-[var(--accent-blue)] transition-colors">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-bold uppercase tracking-wider opacity-70">TỔNG CƯ DÂN</p>
              <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-sm">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>
        <div className="card stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-bold uppercase tracking-wider opacity-70">ĐANG THUÊ</p>
              <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center shadow-sm">
              <Home className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>
        <div className="card stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-bold uppercase tracking-wider opacity-70">ĐÃ CHUYỂN ĐI</p>
              <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center shadow-sm">
              <LogOut className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>
        <div className="card stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1 font-bold uppercase tracking-wider opacity-70">TỔNG TIỀN CỌC</p>
              <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{formatCurrency(stats.totalDeposit)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-sm">
              <Wallet className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-3 sm:p-4 mb-6 !overflow-visible relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative w-full">
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

          <div className="relative w-full">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown
                ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                statusFilter === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-500' :
                  'bg-gray-50 dark:bg-gray-900/20 text-gray-500'
                }`}>
                {statusFilter === 'all' && <Users size={14} />}
                {statusFilter === 'active' && <CheckCircle size={14} />}
                {statusFilter === 'inactive' && <LogOut size={14} />}
              </div>
              <div className="text-left pr-1 flex-1">
                <p className="text-sm font-medium leading-tight whitespace-nowrap text-primary uppercase tracking-wider">
                  {statusFilter === 'all' ? 'TẤT CẢ CƯ DÂN' : statusFilter === 'active' ? 'ĐANG Ở' : 'ĐÃ RỜI ĐI'}
                </p>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                  {[
                    { id: 'all', label: 'TẤT CẢ CƯ DÂN', icon: <Users size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                    { id: 'active', label: 'ĐANG Ở', icon: <CheckCircle size={16} />, color: 'text-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10' },
                    { id: 'inactive', label: 'ĐÃ DỜI ĐI', icon: <LogOut size={16} />, color: 'text-red-500', bg: 'bg-red-50/50 dark:bg-red-900/10' }
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

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Tìm tên, số điện thoại, phòng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="input input-with-icon w-full pl-12 h-11"
            />
          </div>
        </div>
      </div>

      {/* Residents Table */}
      {loading ? (
        <div className="card">
          <Loading size="lg" text="Đang tải danh sách cư dân..." />
        </div>
      ) : residents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto text-tertiary" size={48} />
          <p className="text-tertiary mt-4">Không tìm thấy cư dân nào</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-tertiary border-b border-primary">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                      CƯ DÂN
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                      PHÒNG
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                      NGÀY VÀO Ở
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">
                      HẠN HỢP ĐỒNG
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center text-xs font-semibold text-secondary uppercase">
                      TRẠNG THÁI CỌC
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">
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
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
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
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          {contract?.room ? (
                            <div>
                              <span className="text-sm font-medium text-primary">{contract.room.name}</span>
                              <p className="text-xs text-tertiary">Tầng {contract.room.floor}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-tertiary">Chưa có phòng</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-tertiary" />
                            <span className="text-sm text-secondary">{formatDate(contract?.startDate)}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          {contract ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-center text-sm text-secondary">{formatDate(contract.endDate)}</span>

                              </div>
                              {isContractExpiring && (
                                <span className="text-left text-xs text-yellow-800 dark:text-yellow-300 mt-1 block">
                                  Còn {daysRemaining} ngày
                                </span>
                              )}
                              {daysRemaining !== null && daysRemaining < 0 && (
                                <span className="text-left text-xs text-red-600 dark:text-red-400 mt-1 block">Đã hết hạn</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-tertiary">N/A</span>
                          )}
                        </td>
                        <td className="flex justify-center px-3 sm:px-4 py-3 sm:py-4 mt-[6px]">
                          {contract ? (
                            <div>
                              <Badge color={depositStatus.color} className="rounded font-semibold inline-flex items-center justify-center py-1 min-h-[24px]">
                                {depositStatus.label}
                              </Badge>
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
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/residents/${resident.id}`}
                              className="btn btn-ghost btn-icon text-primary"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} strokeWidth={2} />
                            </Link>
                            <Link
                              href={`/admin/residents/${resident.id}/edit`}
                              className="btn btn-ghost btn-icon text-primary"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} strokeWidth={2} />
                            </Link>
                            {contract?.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleCheckout(resident.id, resident.fullName)}
                                className="btn btn-ghost btn-icon text-danger"
                                title="Check-out cư dân"
                              >
                                <LogOut size={18} strokeWidth={2} />
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
          </div>

          {/* Pagination */}
          {residents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-0 card p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-secondary text-center sm:text-left">
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
                      className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
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

      {/* Checkout Confirmation Modal */}
      {
        showCheckoutModal && checkoutData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={cancelCheckout}>
            <div className="bg-primary rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary">Xác nhận Check-out</h2>
                  <button
                    onClick={cancelCheckout}
                    className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                  >
                    <X size={20} className="text-secondary" />
                  </button>
                </div>
                <div className="mb-6">
                  <p className="text-primary mb-4">
                    Bạn có chắc chắn muốn check-out cư dân <span className="font-semibold">{checkoutData.name}</span>?
                  </p>
                  <div className="bg-tertiary rounded-lg p-4 space-y-2">
                    <p className="text-sm text-secondary flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      Chấm dứt hợp đồng hiện tại
                    </p>
                    <p className="text-sm text-secondary flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      Chuyển trạng thái phòng về "Trống"
                    </p>
                    <p className="text-sm text-secondary flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      Lưu lịch sử hợp đồng
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={cancelCheckout}
                    className="btn btn-secondary btn-md"
                    disabled={checkoutLoading}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmCheckout}
                    className="btn btn-danger btn-md"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận Check-out'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
