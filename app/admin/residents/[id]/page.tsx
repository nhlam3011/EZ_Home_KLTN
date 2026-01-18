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
  Download, 
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
  File,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Camera,
  Users,
  Trash2
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

interface Document {
  id: number
  fileName: string
  fileUrl: string
  fileSize: number | null
  fileType: string | null
  description: string | null
  createdAt: Date | string
}

export default function ResidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const residentId = params?.id as string
  const [resident, setResident] = useState<Resident | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'payments' | 'services' | 'history'>('payments')
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [showUploadDoc, setShowUploadDoc] = useState(false)

  useEffect(() => {
    if (residentId) {
      fetchResident()
      fetchDocuments()
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

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/residents/${residentId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`/api/residents/${residentId}/upload-avatar`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResident(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null)
        alert('Cập nhật avatar thành công!')
      } else {
        alert(data.error || 'Có lỗi xảy ra khi upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Có lỗi xảy ra khi upload avatar')
    } finally {
      setUploadingAvatar(false)
      e.target.value = '' // Reset input
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB')
      e.target.value = ''
      return
    }

    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const activeContract = resident?.contracts?.find(c => c.status === 'ACTIVE')
      if (activeContract) {
        formData.append('contractId', activeContract.id.toString())
      }

      const response = await fetch(`/api/residents/${residentId}/documents`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDocuments()
        alert('Tải lên hồ sơ thành công!')
        setShowUploadDoc(false)
      } else {
        const errorMsg = data.error || 'Có lỗi xảy ra khi tải lên hồ sơ'
        let details = ''
        
        if (data.code === 'PRISMA_CLIENT_NOT_GENERATED') {
          details = '\n\n⚠️ VUI LÒNG LÀM THEO CÁC BƯỚC SAU:\n' + 
                   '1. Mở Terminal/Command Prompt\n' +
                   '2. Chạy lệnh: npx prisma generate\n' +
                   '3. Chạy lệnh: npx prisma db push\n' +
                   '4. Restart dev server (Ctrl+C rồi npm run dev)\n' +
                   '5. Thử upload lại'
        } else if (data.details) {
          details = '\n\nChi tiết: ' + data.details
        }
        
        alert(errorMsg + details)
        console.error('Upload error:', data)
      }
    } catch (error: any) {
      console.error('Error uploading document:', error)
      alert(`Có lỗi xảy ra khi tải lên hồ sơ: ${error.message || 'Unknown error'}`)
    } finally {
      setUploadingDoc(false)
      e.target.value = '' // Reset input
    }
  }

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) return

    try {
      const response = await fetch(`/api/residents/${residentId}/documents?documentId=${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDocuments()
        alert('Xóa hồ sơ thành công!')
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi xóa hồ sơ')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Có lỗi xảy ra khi xóa hồ sơ')
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleResetPassword = async () => {
    if (!confirm('Bạn có chắc chắn muốn reset mật khẩu cho cư dân này? Mật khẩu mới sẽ là số CCCD.')) return

    try {
      const response = await fetch(`/api/residents/${residentId}/reset-password`, {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok) {
        alert('Reset mật khẩu thành công! Mật khẩu mới là số CCCD.')
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Có lỗi xảy ra khi reset mật khẩu')
    }
  }

  const handleRenewContract = () => {
    const newEndDate = prompt('Nhập ngày hết hạn mới (DD/MM/YYYY):')
    if (newEndDate) {
      // In a real app, this would call API to renew contract
      alert('Tính năng gia hạn hợp đồng đang được phát triển...')
    }
  }

  const handleTerminateContract = async () => {
    if (!confirm('Bạn có chắc chắn muốn thanh lý hợp đồng này? Hành động này sẽ chấm dứt hợp đồng và chuyển phòng về trạng thái trống.')) return

    try {
      const response = await fetch(`/api/residents/${residentId}/checkout`, {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok) {
        alert('Thanh lý hợp đồng thành công!')
        fetchResident()
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error terminating contract:', error)
      alert('Có lỗi xảy ra khi thanh lý hợp đồng')
    }
  }

  const handleDeleteUser = async () => {
    const activeContract = resident?.contracts?.find(c => c.status === 'ACTIVE')
    
    if (activeContract) {
      alert('Không thể xóa cư dân đang có hợp đồng hoạt động. Vui lòng check-out trước.')
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN cư dân "${resident?.fullName}"?\n\nHành động này sẽ:\n- Xóa tất cả thông tin cư dân\n- Xóa tất cả hợp đồng, hóa đơn, hồ sơ đính kèm\n- Xóa tất cả dữ liệu liên quan\n\nHành động này KHÔNG THỂ HOÀN TÁC!`)) return

    try {
      const response = await fetch(`/api/residents/${residentId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (response.ok) {
        alert('Xóa cư dân thành công!')
        router.push('/admin/residents')
        router.refresh()
      } else {
        alert(data.error || 'Có lỗi xảy ra khi xóa cư dân')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Có lỗi xảy ra khi xóa cư dân')
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PAID: { label: 'Đã thanh toán', className: 'badge badge-success' },
      UNPAID: { label: 'Chưa thanh toán', className: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 font-semibold' },
      OVERDUE: { label: 'Quá hạn', className: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 font-semibold' },
      PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 font-semibold' },
      PROCESSING: { label: 'Đang xử lý', className: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-semibold' },
      DONE: { label: 'Hoàn thành', className: 'badge badge-success' },
      ACTIVE: { label: 'Đang hiệu lực', className: 'badge badge-success' },
      TERMINATED: { label: 'Đã chấm dứt', className: 'bg-tertiary text-primary' }
    }
    return statusMap[status] || { label: status, className: 'bg-tertiary text-primary' }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-tertiary">Đang tải...</p>
      </div>
    )
  }

  if (!resident) {
    return null
  }

  const activeContract = resident.contracts?.find(c => c.status === 'ACTIVE') || resident.contracts?.[0]
  const initials = getInitials(resident.fullName)

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-secondary">
        <Link href="/admin/residents" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Danh sách Cư dân
        </Link>
        <span>/</span>
        <span className="text-primary">Hồ sơ chi tiết</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Chi tiết Cư dân</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetPassword}
            className="px-4 py-2.5 border border-primary rounded-lg hover:bg-tertiary flex items-center gap-2 transition-all duration-200 text-primary font-semibold shadow-sm hover:shadow-md"
          >
            <RefreshCw size={18} strokeWidth={2} />
            <span>Reset mật khẩu</span>
          </button>
          <Link
            href={`/admin/residents/${residentId}/edit`}
            className="px-4 py-2.5 border border-primary rounded-lg hover:bg-tertiary flex items-center gap-2 transition-all duration-200 text-primary font-semibold shadow-sm hover:shadow-md"
          >
            <Edit size={18} strokeWidth={2} />
            <span>Sửa thông tin</span>
          </Link>
          <Link
            href={`/admin/residents/new?userId=${residentId}`}
            className="px-5 py-2.5 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
          >
            <FileText size={19} strokeWidth={2.5} />
            <Plus size={16} strokeWidth={2.5} />
            <span>Tạo hợp đồng mới</span>
          </Link>
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2.5 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            title="Xóa vĩnh viễn cư dân này"
          >
            <Trash2 size={18} strokeWidth={2} />
            <span>Xóa cư dân</span>
          </button>
        </div>
      </div>

      {/* Resident Summary Card */}
      <div className="card">
        <div className="flex items-start gap-6">
          <div className="relative">
            {resident.avatarUrl ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={resident.avatarUrl} 
                  alt={resident.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">{initials}</span>
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 shadow-md">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              {uploadingAvatar ? (
                <Loader2 size={16} className="text-white animate-spin" />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </label>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-primary">{resident.fullName}</h2>
              {activeContract && (
                <span className="badge badge-success rounded-full text-sm">
                  Đang thuê
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-secondary">
                <Phone size={16} />
                <span>{resident.phone}</span>
              </div>
              {resident.email && (
                <div className="flex items-center gap-2 text-secondary">
                  <Mail size={16} />
                  <span>{resident.email}</span>
                </div>
              )}
              {resident.cccdNumber && (
                <div className="flex items-center gap-2 text-secondary">
                  <CreditCard size={16} />
                  <span>{resident.cccdNumber}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary mb-1">CÔNG NỢ HIỆN TẠI</p>
            <p className="text-2xl font-bold text-primary mb-2">
              {formatCurrency(resident.currentDebt || 0)}
            </p>
            {resident.currentDebt === 0 ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm">Đã thanh toán đủ</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle size={16} />
                <span className="text-sm">Còn {resident.unpaidInvoicesCount} hóa đơn chưa thanh toán</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-primary mb-4">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-tertiary uppercase">Họ và tên</label>
                  <p className="text-sm font-medium text-primary mt-1">{resident.fullName}</p>
                </div>
                <div>
                  <label className="text-xs text-tertiary uppercase">Số điện thoại</label>
                  <p className="text-sm font-medium text-primary mt-1">{resident.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-tertiary uppercase">CCCD/CMND</label>
                  <p className="text-sm font-medium text-primary mt-1">{resident.cccdNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-tertiary uppercase">Địa chỉ thường trú</label>
                  <p className="text-sm font-medium text-primary mt-1">{resident.address || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-tertiary uppercase">Ngày sinh</label>
                  <p className="text-sm font-medium text-primary mt-1">{formatDate(resident.dob)}</p>
                </div>
                <div>
                  <label className="text-xs text-tertiary uppercase">Email</label>
                  <p className="text-sm font-medium text-primary mt-1">{resident.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-tertiary uppercase">Nơi cấp</label>
                  <p className="text-sm font-medium text-primary mt-1">{resident.cccdPlace || 'N/A'}</p>
                </div>
                {resident.job && (
                  <div>
                    <label className="text-xs text-tertiary uppercase">Nghề nghiệp</label>
                    <p className="text-sm font-medium text-primary mt-1">{resident.job}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="card">
            <div className="border-b border-primary">
              <div className="flex items-center gap-6 px-6">
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                    activeTab === 'payments'
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-secondary hover:text-primary hover:border-primary'
                  }`}
                >
                  Lịch sử thanh toán
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                    activeTab === 'services'
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-secondary hover:text-primary hover:border-primary'
                  }`}
                >
                  Yêu cầu dịch vụ
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                    activeTab === 'history'
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-secondary hover:text-primary hover:border-primary'
                  }`}
                >
                  Lịch sử thuê phòng
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Payment History Tab */}
              {activeTab === 'payments' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-tertiary border-b border-primary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">MÃ HĐ</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">KỲ THANH TOÁN</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">SỐ TIỀN</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">TRẠNG THÁI</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">NGÀY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary">
                      {resident.invoices && resident.invoices.length > 0 ? (
                        resident.invoices.map((invoice) => {
                          const statusBadge = getStatusBadge(invoice.status)
                          return (
                            <tr key={invoice.id} className="hover:bg-secondary transition-colors">
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-primary">
                                  INV-{invoice.id.toString().padStart(5, '0')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-secondary">
                                  Tháng {invoice.month}/{invoice.year}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-semibold text-primary">
                                  {formatCurrency(Number(invoice.totalAmount))}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-secondary">{formatDate(invoice.createdAt)}</span>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-tertiary">
                            Chưa có lịch sử thanh toán
                          </td>
                        </tr>
                      )}
                      {/* Deposit entry */}
                      {activeContract && activeContract.deposit > 0 && (
                        <tr className="hover:bg-secondary transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-primary">COC-{activeContract.id.toString().padStart(5, '0')}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-secondary">Tiền cọc phòng</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(Number(activeContract.deposit))}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-success rounded-full text-xs">
                              Đã thanh toán
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-secondary">{formatDate(activeContract.startDate)}</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Service Requests Tab */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  {resident.serviceOrders && resident.serviceOrders.length > 0 ? (
                    resident.serviceOrders.map((order) => {
                      const statusBadge = getStatusBadge(order.status)
                      return (
                        <div key={order.id} className="flex items-center justify-between p-4 border border-primary rounded-lg hover:bg-secondary transition-colors bg-tertiary">
                          <div>
                            <p className="text-sm font-medium text-primary">{order.service.name}</p>
                            <p className="text-xs text-tertiary mt-1">
                              Số lượng: {order.quantity} | {formatDate(order.orderDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(Number(order.total))}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-tertiary">
                      Chưa có yêu cầu dịch vụ nào
                    </div>
                  )}
                </div>
              )}

              {/* Rental History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {resident.contracts && resident.contracts.length > 0 ? (
                    resident.contracts.map((contract) => {
                      const statusBadge = getStatusBadge(contract.status)
                      return (
                        <div key={contract.id} className="p-4 border border-primary rounded-lg hover:bg-tertiary transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-primary">
                                {contract.room?.name || 'N/A'} - Tầng {contract.room?.floor || 'N/A'}
                              </p>
                              <p className="text-xs text-tertiary mt-1">
                                Mã HĐ: HD-{contract.id.toString().padStart(6, '0')}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-tertiary">Ngày vào ở:</span>
                              <span className="ml-2 text-primary">{formatDate(contract.startDate)}</span>
                            </div>
                            <div>
                              <span className="text-tertiary">Hạn hợp đồng:</span>
                              <span className="ml-2 text-primary">{formatDate(contract.endDate)}</span>
                            </div>
                            <div>
                              <span className="text-tertiary">Tiền thuê/tháng:</span>
                              <span className="ml-2 text-primary font-semibold">
                                {formatCurrency(Number(contract.rentPrice))}
                              </span>
                            </div>
                            <div>
                              <span className="text-tertiary">Tiền cọc:</span>
                              <span className="ml-2 text-primary font-semibold">
                                {formatCurrency(Number(contract.deposit))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-tertiary">
                      Chưa có lịch sử thuê phòng
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Current Contract */}
          {activeContract && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Hợp đồng hiện tại</h3>
                <Link
                  href={`/admin/contracts/${activeContract.id}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500"
                >
                  Xem chi tiết
                </Link>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-tertiary mb-1">Đang ở phòng</p>
                  <p className="text-xl font-bold text-primary">{activeContract.room?.name || 'N/A'}</p>
                  <p className="text-sm text-secondary mt-1">
                    {activeContract.room?.area ? `Studio (${activeContract.room.area}m²)` : 'Studio'}
                  </p>
                </div>
                <div className="pt-4 border-t border-primary space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Mã hợp đồng:</span>
                    <span className="font-medium text-primary">HD-{activeContract.id.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Ngày vào ở:</span>
                    <span className="font-medium text-primary">{formatDate(activeContract.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Hạn hợp đồng:</span>
                    <span className="font-medium text-primary">{formatDate(activeContract.endDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Tiền thuê/tháng:</span>
                    <span className="font-semibold text-primary">{formatCurrency(Number(activeContract.rentPrice))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Tiền cọc:</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(Number(activeContract.deposit))}
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Đã đóng)</span>
                    </span>
                  </div>
                  {activeContract.room && (
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Số người ở:</span>
                      <span className="font-semibold text-primary">
                        {1 + (activeContract.occupants?.length || 0)} / {activeContract.room.maxPeople} người
                      </span>
                    </div>
                  )}
                </div>
                {activeContract.occupants && activeContract.occupants.length > 0 && (
                  <div className="pt-4 border-t border-primary">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <Users size={16} />
                      <span>Người ở cùng ({activeContract.occupants.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {activeContract.occupants.map((occupant) => (
                        <div key={occupant.id} className="p-3 bg-tertiary rounded-lg border border-primary">
                              <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-primary">{occupant.fullName}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-secondary">
                                {occupant.relationship && (
                                  <span>Quan hệ: {occupant.relationship}</span>
                                )}
                                {occupant.cccdNumber && (
                                  <span>CCCD: {occupant.cccdNumber}</span>
                                )}
                                {occupant.phone && (
                                  <span>ĐT: {occupant.phone}</span>
                                )}
                                {occupant.dob && (
                                  <span>SN: {formatDate(occupant.dob)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-primary flex gap-2">
                  <button
                    onClick={handleRenewContract}
                    className="flex-1 px-4 py-2.5 border border-primary rounded-lg hover:bg-tertiary text-sm transition-all duration-200 text-primary font-semibold shadow-sm hover:shadow-md"
                  >
                    Gia hạn
                  </button>
                  <button
                    onClick={handleTerminateContract}
                    className="flex-1 px-4 py-2.5 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                  >
                    Thanh lý
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attached Files */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Hồ sơ đính kèm</h3>
              <button 
                onClick={() => setShowUploadDoc(!showUploadDoc)}
                className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                title="Tải lên hồ sơ"
              >
                <Plus size={18} className="text-secondary" />
              </button>
            </div>

            {/* Upload Document Form */}
            {showUploadDoc && (
              <div className="mb-4 p-4 border border-primary rounded-lg bg-tertiary">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-primary">Tải lên hồ sơ mới</label>
                  <button
                    onClick={() => setShowUploadDoc(false)}
                    className="text-tertiary hover:text-primary"
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="file"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDoc}
                  className="w-full text-sm text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:btn-primary file:text-white hover:file:bg-[#2a4a6f] disabled:opacity-50"
                />
                {uploadingDoc && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-secondary">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tải lên...</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc) => {
                  const isImage = doc.fileType?.startsWith('image/')
                  const Icon = isImage ? ImageIcon : FileText
                  const iconBg = isImage ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  const iconColor = isImage ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'

                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-primary rounded-lg hover:bg-secondary transition-colors bg-tertiary">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={iconColor} size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{doc.fileName}</p>
                          <p className="text-xs text-tertiary">
                            {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={doc.fileUrl}
                          download
                          className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={16} className="text-secondary" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <X size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-tertiary">
                  <FileText size={32} className="mx-auto mb-2 text-tertiary" />
                  <p className="text-sm">Chưa có hồ sơ đính kèm</p>
                  <p className="text-xs mt-1">Nhấn nút + để tải lên hồ sơ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
