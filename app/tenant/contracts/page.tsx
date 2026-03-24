'use client'

import { useEffect, useState } from 'react'
import { FileText, Calendar, DollarSign, Users, Building2, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react'

interface Contract {
  id: number
  status: string
  startDate: Date | string
  endDate?: Date | string | null
  deposit?: number | null
  rentPrice?: number | null
  createdAt: Date | string
  room: {
    id: number
    name: string
    floor: number
    price: number
    area?: number | null
    roomType?: string | null
  }
  occupants?: Array<{
    id: number
    fullName: string
    phone?: string | null
    email?: string | null
  }>
}

interface RenewalRequest {
  id: number
  contractId: number
  requestDate: string
  newEndDate: string
  status: string
  adminNote: string | null
}

export default function TenantContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>([])
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [newEndDate, setNewEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      // Get user ID from localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        console.error('User not found in localStorage')
        return
      }
      const parsedUser = JSON.parse(userData)

      // Get user info with userId
      const userRes = await fetch(`/api/tenant/me?userId=${parsedUser.id}`)
      const user = await userRes.json()

      if (user.id) {
        const response = await fetch(`/api/contracts?userId=${user.id}`)
        const data = await response.json()
        if (response.ok) {
          setContracts(data)
          if (data.length > 0) {
            setSelectedContract(data[0])
          }
        }

        // Fetch renewal requests for this user
        try {
          const renewalRes = await fetch(`/api/contracts/renewals?userId=${user.id}`)
          if (renewalRes.ok) {
            const renewalData = await renewalRes.json()
            setRenewalRequests(Array.isArray(renewalData) ? renewalData : (renewalData.renewals || []))
          }
        } catch (err) {
          console.error('Error fetching renewal requests:', err)
        }
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Chưa cập nhật'
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'Chưa cập nhật'
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj)
    } catch {
      return 'Chưa cập nhật'
    }
  }

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return 'Chưa cập nhật'
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'Chưa cập nhật'
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch {
      return 'Chưa cập nhật'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
      ACTIVE: {
        label: 'Đang hiệu lực',
        className: 'badge badge-success',
        icon: CheckCircle
      },
      EXPIRED: {
        label: 'Đã hết hạn',
        className: 'badge badge-error',
        icon: XCircle
      },
      PENDING: {
        label: 'Chờ xử lý',
        className: 'badge badge-warning',
        icon: Clock
      },
      CANCELLED: {
        label: 'Đã hủy',
        className: 'badge badge-error',
        icon: XCircle
      }
    }
    return statusMap[status] || {
      label: status,
      className: 'badge badge-info',
      icon: FileText
    }
  }

  const getDaysRemaining = (endDate: Date | string | null | undefined) => {
    if (!endDate) return null
    try {
      const end = new Date(endDate)
      if (isNaN(end.getTime())) return null
      const now = new Date()
      const diff = end.getTime() - now.getTime()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  const handleRenewRequest = () => {
    setNewEndDate('')
    setShowRenewalModal(true)
  }

  const submitRenewalRequest = async () => {
    if (!selectedContract || !newEndDate) return

    const userData = localStorage.getItem('user')
    if (!userData) return
    const parsedUser = JSON.parse(userData)

    setSubmitting(true)
    try {
      const response = await fetch('/api/contracts/renewals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractId: selectedContract.id,
          userId: parsedUser.id,
          newEndDate: newEndDate
        })
      })

      if (response.ok) {
        alert('Yêu cầu gia hạn hợp đồng đã được gửi thành công!')
        setShowRenewalModal(false)
        // Refresh renewal requests
        const userRes = await fetch(`/api/tenant/me?userId=${parsedUser.id}`)
        const user = await userRes.json()
        if (user.id) {
          const renewalRes = await fetch(`/api/contracts/renewals?userId=${user.id}`)
          if (renewalRes.ok) {
            const renewalData = await renewalRes.json()
            setRenewalRequests(Array.isArray(renewalData) ? renewalData : (renewalData.renewals || []))
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error submitting renewal request:', error)
      alert('Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const getRenewalStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock size={12} /> Chờ duyệt
        </span>
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle size={12} /> Đã duyệt
        </span>
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <XCircle size={12} /> Từ chối
        </span>
      default:
        return status
    }
  }

  const getContractRenewalRequests = (contractId: number) => {
    return renewalRequests.filter(r => r.contractId === contractId)
  }

  const canRenew = (contract: Contract) => {
    if (contract.status !== 'ACTIVE') return false
    const requests = getContractRenewalRequests(contract.id)
    // Can renew if there's no pending request
    return !requests.some(r => r.status === 'PENDING')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${selectedContract && canRenew(selectedContract) ? 'pb-24 sm:pb-0' : ''}`}>
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">HỢP ĐỒNG CỦA TÔI</h1>
        <p className="text-secondary mt-1 text-xs sm:text-sm">Quản lý và xem chi tiết các hợp đồng thuê phòng</p>
      </div>

      {contracts.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={48} className="text-tertiary mx-auto mb-4" />
          <p className="text-lg font-semibold text-primary mb-2">Bạn chưa có hợp đồng nào</p>
          <p className="text-secondary">Vui lòng liên hệ quản lý để được hỗ trợ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contracts List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-primary">Danh sách hợp đồng</h2>
            <div className="space-y-3">
              {contracts.map((contract) => {
                const statusInfo = getStatusBadge(contract.status)
                const StatusIcon = statusInfo.icon
                const isSelected = selectedContract?.id === contract.id

                return (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className={`card cursor-pointer transition-all ${isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:shadow-lg'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary mb-1">{contract.room.name}</h3>
                        <p className="text-sm text-secondary">Tầng {contract.room.floor}</p>
                      </div>
                      <StatusIcon
                        size={20}
                        className={`${contract.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' :
                          contract.status === 'EXPIRED' ? 'text-red-600 dark:text-red-400' :
                            contract.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-gray-600 dark:text-gray-400'
                          }`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={statusInfo.className}>
                        {statusInfo.label}
                      </span>
                      {contract.endDate && contract.status === 'ACTIVE' && (
                        <span className="text-xs text-secondary">
                          Còn {getDaysRemaining(contract.endDate)} ngày
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contract Details */}
          <div className="lg:col-span-2">
            {selectedContract ? (
              <div className="card">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary">
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-1">
                      Hợp đồng {selectedContract.room.name}
                    </h2>
                    <p className="text-sm text-secondary">Tầng {selectedContract.room.floor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={getStatusBadge(selectedContract.status).className}>
                      {getStatusBadge(selectedContract.status).label}
                    </span>
                  </div>
                </div>

                {/* Contract Info */}
                <div className="space-y-6">
                  {/* Room Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                      </div>
                      Thông tin phòng
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Tên phòng</p>
                        <p className="text-base font-bold text-primary">{selectedContract.room.name}</p>
                      </div>
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Tầng</p>
                        <p className="text-base font-bold text-primary">Tầng {selectedContract.room.floor}</p>
                      </div>
                      {selectedContract.room.area && (
                        <div className="p-4 bg-tertiary rounded-lg border border-primary">
                          <p className="text-xs text-tertiary mb-1">Diện tích</p>
                          <p className="text-base font-bold text-primary">{selectedContract.room.area} m²</p>
                        </div>
                      )}
                      {selectedContract.room.roomType && (
                        <div className="p-4 bg-tertiary rounded-lg border border-primary">
                          <p className="text-xs text-tertiary mb-1">Loại phòng</p>
                          <p className="text-base font-bold text-primary">{selectedContract.room.roomType}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contract Period */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Calendar size={18} className="text-white" />
                      </div>
                      Thời gian hợp đồng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Ngày bắt đầu</p>
                        <p className="text-base font-bold text-primary">
                          {formatDate(selectedContract.startDate)}
                        </p>
                      </div>
                      {selectedContract.endDate && (
                        <div className="p-4 bg-tertiary rounded-lg border border-primary">
                          <p className="text-xs text-tertiary mb-1">Ngày kết thúc</p>
                          <p className="text-base font-bold text-primary">
                            {formatDate(selectedContract.endDate)}
                          </p>
                          {selectedContract.status === 'ACTIVE' && (
                            <p className="text-xs text-secondary mt-1">
                              Còn {getDaysRemaining(selectedContract.endDate)} ngày
                            </p>
                          )}
                          {selectedContract.status === 'ACTIVE' && canRenew(selectedContract) && (
                               <button
                                onClick={handleRenewRequest}
                                className="mt-2 btn btn-primary btn-sm hidden sm:flex items-center gap-1"
                              >
                                <RefreshCw size={14} />
                                Gia hạn
                              </button>
                          )}
                          {selectedContract.status === 'ACTIVE' && !canRenew(selectedContract) && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock size={12} /> Chờ gia hạn
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 bg-tertiary rounded-lg border border-primary">
                        <p className="text-xs text-tertiary mb-1">Ngày tạo hợp đồng</p>
                        <p className="text-base font-bold text-primary">
                          {formatDateTime(selectedContract.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  {(selectedContract.deposit || selectedContract.rentPrice) && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <DollarSign size={18} className="text-white" />
                        </div>
                        Thông tin tài chính
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedContract.rentPrice && (
                          <div className="p-4 bg-tertiary rounded-lg border border-primary">
                            <p className="text-xs text-tertiary mb-1">Giá thuê/tháng</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(Number(selectedContract.rentPrice))}
                            </p>
                          </div>
                        )}
                        {selectedContract.deposit && (
                          <div className="p-4 bg-tertiary rounded-lg border border-primary">
                            <p className="text-xs text-tertiary mb-1">Tiền cọc</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(Number(selectedContract.deposit))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Occupants */}
                  {selectedContract.occupants && selectedContract.occupants.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Users size={18} className="text-white" />
                        </div>
                        Người ở cùng
                      </h3>
                      <div className="space-y-2">
                        {selectedContract.occupants.map((occupant) => (
                          <div
                            key={occupant.id}
                            className="p-4 bg-tertiary rounded-lg border border-primary"
                          >
                            <p className="font-semibold text-primary">{occupant.fullName}</p>
                            {occupant.phone && (
                              <p className="text-sm text-secondary mt-1">Điện thoại: {occupant.phone}</p>
                            )}
                            {occupant.email && (
                              <p className="text-sm text-secondary">Email: {occupant.email}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Renewal Requests Section */}
                  {getContractRenewalRequests(selectedContract.id).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <RefreshCw size={18} className="text-white" />
                        </div>
                        Lịch sử gia hạn
                      </h3>
                      <div className="space-y-3">
                        {getContractRenewalRequests(selectedContract.id).map((request) => (
                          <div key={request.id} className="p-4 bg-tertiary rounded-lg border border-primary">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-primary">Yêu cầu gia hạn</span>
                              {getRenewalStatusBadge(request.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-secondary">Ngày yêu cầu:</span>
                                <span className="ml-2 text-primary">{formatDate(request.requestDate)}</span>
                              </div>
                              <div>
                                <span className="text-secondary">Ngày kết thúc mới:</span>
                                <span className="ml-2 text-blue-600 font-medium">{formatDate(request.newEndDate)}</span>
                              </div>
                            </div>
                            {request.adminNote && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                <span className="text-secondary">Ghi chú: </span>
                                <span className="text-primary">{request.adminNote}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <FileText size={48} className="text-tertiary mx-auto mb-4" />
                <p className="text-secondary">Chọn một hợp đồng để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sticky Footer */}
      {selectedContract && canRenew(selectedContract) && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-primary p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <button
            onClick={handleRenewRequest}
            className="btn btn-primary btn-md w-full py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            <span className="font-bold">GIA HẠN HỢP ĐỒNG</span>
          </button>
        </div>
      )}
    </div>
  )
}

