'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  RefreshCw, 
  FileText, 
  Plus, 
  Eye,
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  Loader2,
  Trash2,
  Users,
  Briefcase,
  Car,
  AlertTriangle
} from 'lucide-react'

interface Resident {
  id: number
  fullName: string
  phone: string
  email: string | null
  avatarUrl: string | null
  cccdNumber: string | null
  cccdDate: Date | string | null
  cccdPlace: string | null
  dob: Date | string | null
  address: string | null
  gender: string | null
  job: string | null
  licensePlate: string | null
  contracts: Array<{
    id: number
    startDate: Date | string
    endDate: Date | string | null
    deposit: number
    rentPrice: number
    status: string
    room: {
      id: number
      name: string
      floor: number
      area: number | null
      maxPeople: number
    } | null
    occupants?: Array<{
      id: number
      fullName: string
      cccdNumber: string | null
      phone: string | null
      dob: Date | string | null
      relationship: string | null
    }>
  }>
  invoices: Array<{
    id: number
    month: number
    year: number
    totalAmount: number
    status: string
    createdAt: Date | string
  }>
  serviceOrders: Array<{
    id: number
    service: {
      name: string
    }
    quantity: number
    total: number
    status: string
    orderDate: Date | string
  }>
  currentDebt: number
  unpaidInvoicesCount: number
}

export default function ResidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const residentId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [resident, setResident] = useState<Resident | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (residentId) {
      fetchResident()
    }
  }, [residentId])

  const fetchResident = async () => {
    try {
      const response = await fetch(`/api/residents/${residentId}`)
      const data = await response.json()

      if (response.ok) {
        setResident(data)
      } else {
        alert(data.error || 'Không tìm thấy cư dân')
        router.push('/admin/residents')
      }
    } catch (error) {
      console.error('Error fetching resident:', error)
      alert('Có lỗi xảy ra khi tải thông tin cư dân')
      router.push('/admin/residents')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !resident) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`/api/residents/${resident.id}/upload-avatar`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResident(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null)
        alert('Cập nhật ảnh đại diện thành công!')
      } else {
        alert(data.error || 'Có lỗi xảy ra khi upload ảnh')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Có lỗi xảy ra khi upload ảnh')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleResetPassword = async () => {
    if (!resident) return
    if (!confirm(`Bạn có chắc chắn muốn reset mật khẩu cho ${resident.fullName}?`)) return

    try {
      const response = await fetch(`/api/residents/${resident.id}/reset-password`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Mật khẩu mới: ${data.newPassword}\n\nVui lòng lưu lại thông tin này.`)
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Có lỗi xảy ra khi reset mật khẩu')
    }
  }

  const handleDeleteUser = async () => {
    if (!resident) return
    if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN cư dân ${resident.fullName}?\n\nHành động này không thể hoàn tác!`)) return

    try {
      const response = await fetch(`/api/residents/${residentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        alert('Xóa cư dân thành công!')
        router.push('/admin/residents')
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Có lỗi xảy ra khi xóa cư dân')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const formatDateTime = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'ACTIVE': { label: 'Đang hoạt động', className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      'EXPIRED': { label: 'Đã hết hạn', className: 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      'PENDING': { label: 'Chờ xử lý', className: 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded' },
      'CANCELLED': { label: 'Đã hủy', className: 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded' }
    }
    const statusInfo = statusMap[status] || { label: status, className: 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded' }
    return (
      <span className={statusInfo.className}>
        {statusInfo.label}
      </span>
    )
  }

  const getInvoiceStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'PAID': { label: 'Đã thanh toán', className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      'UNPAID': { label: 'Chưa thanh toán', className: 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded' },
      'OVERDUE': { label: 'Quá hạn', className: 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded' }
    }
    const statusInfo = statusMap[status] || { label: status, className: 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded' }
    return (
      <span className={statusInfo.className}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={40} />
          <p className="text-sm text-secondary">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!resident) {
    return null
  }

  const activeContract = resident.contracts.find(c => c.status === 'ACTIVE')
  const initials = getInitials(resident.fullName)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-secondary">
        <Link href="/admin/residents" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Danh sách Cư dân
        </Link>
        <span>/</span>
        <span className="text-primary">Hồ sơ chi tiết</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Chi tiết Cư dân</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleResetPassword}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-primary rounded-lg hover:bg-tertiary flex items-center gap-2 transition-all duration-200 text-primary font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
            <span className="hidden sm:inline">Reset mật khẩu</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <Link
            href={`/admin/residents/${residentId}/edit`}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-primary rounded-lg hover:bg-tertiary flex items-center gap-2 transition-all duration-200 text-primary font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
            <span className="hidden sm:inline">Sửa thông tin</span>
            <span className="sm:hidden">Sửa</span>
          </Link>
          <Link
            href={`/admin/residents/new?userId=${residentId}`}
            className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg font-semibold"
          >
            <FileText size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
            <Plus size={14} className="sm:w-4 sm:h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Tạo hợp đồng mới</span>
            <span className="sm:hidden">Hợp đồng</span>
          </Link>
          <button
            onClick={handleDeleteUser}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm sm:text-base"
            title="Xóa vĩnh viễn cư dân này"
          >
            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
            <span className="hidden sm:inline">Xóa cư dân</span>
            <span className="sm:hidden">Xóa</span>
          </button>
        </div>
      </div>

      {/* Resident Summary Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="relative flex-shrink-0 mx-auto sm:mx-0">
            {resident.avatarUrl ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-visible shadow-lg relative">
                <img 
                  src={resident.avatarUrl} 
                  alt={resident.fullName}
                  className="w-full h-full object-cover rounded-full"
                />
                <label className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg border-2 border-white dark:border-gray-800 hover:scale-110 active:scale-95">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <Loader2 size={12} className="sm:w-[14px] sm:h-[14px] text-white animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Camera size={12} className="sm:w-[14px] sm:h-[14px] text-white" strokeWidth={1.5} />
                  )}
                </label>
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg relative overflow-visible">
                <span className="text-white font-bold text-xl sm:text-2xl">{initials}</span>
                <label className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg border-2 border-white dark:border-gray-800 hover:scale-110 active:scale-95">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <Loader2 size={12} className="sm:w-[14px] sm:h-[14px] text-white animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Camera size={12} className="sm:w-[14px] sm:h-[14px] text-white" strokeWidth={1.5} />
                  )}
                </label>
              </div>
            )}
          </div>
          <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{resident.fullName}</h2>
              {activeContract && (
                <span className="bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded inline-block w-fit mx-auto sm:mx-0">
                  Đang thuê
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-secondary text-sm sm:text-base">
                <Phone size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{resident.phone}</span>
              </div>
              {resident.email && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-secondary text-sm sm:text-base">
                  <Mail size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="break-all">{resident.email}</span>
                </div>
              )}
              {resident.cccdNumber && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-secondary text-sm sm:text-base">
                  <CreditCard size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{resident.cccdNumber}</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full sm:w-auto text-center sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 sm:pl-4" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-xs sm:text-sm text-secondary mb-1.5 font-medium">CÔNG NỢ HIỆN TẠI</p>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-3">
              {formatCurrency(resident.currentDebt || 0)}
            </p>
            {resident.currentDebt === 0 ? (
              <div className="flex items-center justify-center sm:justify-end gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Đã thanh toán đủ</span>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-end gap-1.5 text-red-600 dark:text-red-400">
                <XCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Còn {resident.unpaidInvoicesCount} hóa đơn chưa thanh toán</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Personal Information */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {resident.dob && (
                <div>
                  <p className="text-xs text-tertiary mb-1 font-medium">Ngày sinh</p>
                  <p className="text-sm sm:text-base text-primary flex items-center gap-2">
                    <Calendar size={16} className="text-secondary" />
                    {formatDate(resident.dob)}
                  </p>
                </div>
              )}
              {resident.gender && (
                <div>
                  <p className="text-xs text-tertiary mb-1 font-medium">Giới tính</p>
                  <p className="text-sm sm:text-base text-primary">
                    {resident.gender === 'MALE' ? 'Nam' : resident.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
              )}
              {resident.cccdDate && (
                <div>
                  <p className="text-xs text-tertiary mb-1 font-medium">Ngày cấp CCCD</p>
                  <p className="text-sm sm:text-base text-primary flex items-center gap-2">
                    <Calendar size={16} className="text-secondary" />
                    {formatDate(resident.cccdDate)}
                  </p>
                </div>
              )}
              {resident.cccdPlace && (
                <div>
                  <p className="text-xs text-tertiary mb-1 font-medium">Nơi cấp CCCD</p>
                  <p className="text-sm sm:text-base text-primary">{resident.cccdPlace}</p>
                </div>
              )}
              {resident.address && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-tertiary mb-1 font-medium">Địa chỉ thường trú</p>
                  <p className="text-sm sm:text-base text-primary flex items-start gap-2">
                    <MapPin size={16} className="text-secondary flex-shrink-0 mt-0.5" />
                    <span>{resident.address}</span>
                  </p>
                </div>
              )}
              {resident.job && (
                <div>
                  <p className="text-xs text-tertiary mb-1 font-medium">Nghề nghiệp</p>
                  <p className="text-sm sm:text-base text-primary flex items-center gap-2">
                    <Briefcase size={16} className="text-secondary" />
                    {resident.job}
                  </p>
                </div>
              )}
              {resident.licensePlate && (
                <div>
                  <p className="text-xs text-tertiary mb-1 font-medium">Biển số xe</p>
                  <p className="text-sm sm:text-base text-primary flex items-center gap-2">
                    <Car size={16} className="text-secondary" />
                    {resident.licensePlate}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contracts */}
          <div className="card">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-primary">Hợp đồng</h3>
              <Link
                href={`/admin/residents/new?userId=${residentId}`}
                className="btn-primary flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg font-semibold"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Tạo hợp đồng</span>
                <span className="sm:hidden">Mới</span>
              </Link>
            </div>
            {resident.contracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-tertiary mb-3" />
                <p className="text-sm text-secondary">Chưa có hợp đồng</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {resident.contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="border rounded-lg p-4 sm:p-5 hover:shadow-md transition-all"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <Building2 size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <h4 className="font-semibold text-primary text-sm sm:text-base break-words">
                            {contract.room ? `${contract.room.name} - Tầng ${contract.room.floor}` : 'N/A'}
                          </h4>
                          <div className="flex-shrink-0">
                            {getStatusBadge(contract.status)}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-secondary">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Bắt đầu: {formatDate(contract.startDate)}</span>
                          </div>
                          {contract.endDate && (
                            <div className="flex items-center gap-2">
                              <Calendar size={14} />
                              <span>Kết thúc: {formatDate(contract.endDate)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} />
                            <span>Giá thuê: {formatCurrency(Number(contract.rentPrice))}</span>
                          </div>
                          {contract.deposit > 0 && (
                            <div className="flex items-center gap-2">
                              <DollarSign size={14} />
                              <span>Tiền cọc: {formatCurrency(Number(contract.deposit))}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/admin/rooms/${contract.room?.id}/contracts`}
                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0"
                      >
                        <Eye size={14} className="flex-shrink-0" />
                        <span className="hidden sm:inline">Xem chi tiết</span>
                        <span className="sm:hidden">Chi tiết</span>
                      </Link>
                    </div>
                    {contract.occupants && contract.occupants.length > 0 && (
                      <div className="pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                        <p className="text-xs text-tertiary mb-2 font-medium flex items-center gap-1">
                          <Users size={14} />
                          Người ở cùng ({contract.occupants.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {contract.occupants.map((occupant) => (
                            <span
                              key={occupant.id}
                              className="text-xs px-2 py-1 rounded bg-secondary text-primary"
                            >
                              {occupant.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">Lịch sử hóa đơn</h3>
            {resident.invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-tertiary mb-3" />
                <p className="text-sm text-secondary">Chưa có hóa đơn</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                        <th className="text-left py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">Tháng/Năm</th>
                        <th className="text-right py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">Tổng tiền</th>
                        <th className="text-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">Trạng thái</th>
                        <th className="text-right py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resident.invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-secondary transition-colors" style={{ borderColor: 'var(--border-primary)' }}>
                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-primary font-medium whitespace-nowrap">
                            {invoice.month}/{invoice.year}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-primary font-semibold text-right whitespace-nowrap">
                            {formatCurrency(Number(invoice.totalAmount))}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-center">
                            <div className="flex justify-center">
                              {getInvoiceStatusBadge(invoice.status)}
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-tertiary text-right whitespace-nowrap">
                            {formatDate(invoice.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Service Orders */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">Đơn dịch vụ</h3>
            {resident.serviceOrders.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-tertiary mb-3" />
                <p className="text-sm text-secondary">Chưa có đơn dịch vụ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resident.serviceOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-primary text-sm sm:text-base mb-1 break-words">{order.service.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:gap-4 text-xs sm:text-sm text-secondary">
                          <span className="whitespace-nowrap">Số lượng: {order.quantity}</span>
                          <span className="font-semibold text-primary whitespace-nowrap">
                            Tổng: {formatCurrency(Number(order.total))}
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Clock size={12} className="flex-shrink-0" />
                            {formatDate(order.orderDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">Thống kê</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-tertiary mb-1 font-medium">Tổng hợp đồng</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{resident.contracts.length}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-xs text-tertiary mb-1 font-medium">Hợp đồng đang hoạt động</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {resident.contracts.filter(c => c.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-tertiary mb-1 font-medium">Tổng hóa đơn</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{resident.invoices.length}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-tertiary mb-1 font-medium">Đơn dịch vụ</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{resident.serviceOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
