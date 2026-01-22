'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, Users, FileText, Phone, Mail, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react'
import Link from 'next/link'

interface Contract {
  id: number
  startDate: Date | string
  endDate: Date | string | null
  deposit: number
  rentPrice: number
  status: string
  user: {
    id: number
    fullName: string
    phone: string
    email: string | null
  }
  occupants?: Array<{
    id: number
    fullName: string
    phone: string | null
    relationship: string | null
  }>
  invoices?: Array<{
    id: number
    month: number
    year: number
    totalAmount: number
    status: string
    paidAt: Date | string | null
    createdAt: Date | string
    amountRoom: number
    amountElec: number
    amountWater: number
    amountService: number
    amountCommonService: number
  }>
}

interface Room {
  id: number
  name: string
  floor: number
}

export default function RoomContractsPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState<Room | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])

  useEffect(() => {
    if (roomId) {
      fetchData()
    }
  }, [roomId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch room info
      const roomRes = await fetch(`/api/rooms/${roomId}`)
      const roomData = await roomRes.json()
      if (roomRes.ok) {
        setRoom(roomData)
      }

      // Fetch contracts for this room
      const contractsRes = await fetch(`/api/contracts?roomId=${roomId}`)
      const contractsData = await contractsRes.json()
      if (contractsRes.ok) {
        // Fetch invoices for each contract
        const contractsWithInvoices = await Promise.all(
          contractsData.map(async (contract: Contract) => {
            const invoicesRes = await fetch(`/api/invoices?contractId=${contract.id}`)
            const invoices = await invoicesRes.json()
            return { ...contract, invoices: invoices || [] }
          })
        )
        setContracts(contractsWithInvoices)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Có lỗi xảy ra khi tải dữ liệu')
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

  const formatDate = (date: Date | string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
            <CheckCircle size={14} />
            Đang hoạt động
          </span>
        )
      case 'TERMINATED':
        return (
          <span className="bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
            <XCircle size={14} />
            Đã kết thúc
          </span>
        )
      default:
        return (
          <span className="bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded">
            {status}
          </span>
        )
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded">
            Đã thanh toán
          </span>
        )
      case 'UNPAID':
        return (
          <span className="bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded">
            Chưa thanh toán
          </span>
        )
      case 'OVERDUE':
        return (
          <span className="bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded">
            Quá hạn
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-tertiary">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/rooms/${roomId}`}
          className="btn btn-ghost btn-icon"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Lịch sử hợp đồng</h1>
          <p className="text-secondary mt-1 text-sm sm:text-base">
            {room ? `Phòng ${room.name} - Tầng ${room.floor}` : 'Đang tải...'}
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={48} className="text-tertiary mx-auto mb-4" />
          <p className="text-tertiary">Chưa có hợp đồng nào cho phòng này</p>
        </div>
      ) : (
        <div className="space-y-6">
          {contracts.map((contract) => {
            const totalInvoices = contract.invoices?.length || 0
            const paidInvoices = contract.invoices?.filter(inv => inv.status === 'PAID').length || 0
            const unpaidInvoices = contract.invoices?.filter(inv => inv.status === 'UNPAID').length || 0
            const totalPaid = contract.invoices?.filter(inv => inv.status === 'PAID')
              .reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0
            const totalUnpaid = contract.invoices?.filter(inv => inv.status === 'UNPAID')
              .reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0

            return (
              <div key={contract.id} className="card">
                {/* Contract Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-primary">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-primary">Hợp đồng #{contract.id}</h2>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Từ {formatDate(contract.startDate)}</span>
                      </div>
                      {contract.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>Đến {formatDate(contract.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tenant Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-blue-500" />
                    Thông tin khách thuê
                  </h3>
                  <div className="bg-tertiary p-4 rounded-lg border border-primary">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-tertiary mb-1">Tên khách thuê</p>
                        <p className="text-base font-semibold text-primary">{contract.user.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-tertiary mb-1">Số điện thoại</p>
                        <p className="text-sm text-secondary flex items-center gap-2">
                          <Phone size={14} />
                          {contract.user.phone}
                        </p>
                      </div>
                      {contract.user.email && (
                        <div>
                          <p className="text-xs text-tertiary mb-1">Email</p>
                          <p className="text-sm text-secondary flex items-center gap-2">
                            <Mail size={14} />
                            {contract.user.email}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-tertiary mb-1">Tiền cọc</p>
                        <p className="text-base font-semibold text-primary flex items-center gap-2">
                          <DollarSign size={16} />
                          {formatCurrency(Number(contract.deposit))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-tertiary mb-1">Giá thuê/tháng</p>
                        <p className="text-base font-semibold text-primary flex items-center gap-2">
                          <DollarSign size={16} />
                          {formatCurrency(Number(contract.rentPrice))}
                        </p>
                      </div>
                    </div>

                    {/* Occupants */}
                    {contract.occupants && contract.occupants.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-primary">
                        <p className="text-xs text-tertiary mb-2">Người ở cùng</p>
                        <div className="space-y-2">
                          {contract.occupants.map((occupant) => (
                            <div key={occupant.id} className="flex items-center gap-2 text-sm text-secondary">
                              <Users size={14} />
                              <span>{occupant.fullName}</span>
                              {occupant.relationship && (
                                <span className="text-tertiary">({occupant.relationship})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Summary */}
                {totalInvoices > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-green-500" />
                      Tóm tắt hóa đơn
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-tertiary mb-1">Tổng hóa đơn</p>
                        <p className="text-lg font-bold text-primary">{totalInvoices}</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs text-tertiary mb-1">Đã thanh toán</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">{paidInvoices}</p>
                      </div>
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-tertiary mb-1">Chưa thanh toán</p>
                        <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{unpaidInvoices}</p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-xs text-tertiary mb-1">Tổng đã thu</p>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {formatCurrency(totalPaid)}
                        </p>
                      </div>
                    </div>
                    {totalUnpaid > 0 && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <span className="font-semibold">Còn nợ:</span> {formatCurrency(totalUnpaid)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Invoice List */}
                {contract.invoices && contract.invoices.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-orange-500" />
                      Danh sách hóa đơn
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-tertiary border-b border-primary">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Kỳ thanh toán</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Phòng</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Điện</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Nước</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Dịch vụ</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Tổng</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">Ngày</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary">
                          {contract.invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-tertiary transition-colors">
                              <td className="px-4 py-3 text-sm text-primary font-medium">
                                {invoice.month}/{invoice.year}
                              </td>
                              <td className="px-4 py-3 text-sm text-secondary">
                                {formatCurrency(Number(invoice.amountRoom))}
                              </td>
                              <td className="px-4 py-3 text-sm text-secondary">
                                {formatCurrency(Number(invoice.amountElec))}
                              </td>
                              <td className="px-4 py-3 text-sm text-secondary">
                                {formatCurrency(Number(invoice.amountWater))}
                              </td>
                              <td className="px-4 py-3 text-sm text-secondary">
                                {formatCurrency(Number(invoice.amountService) + Number(invoice.amountCommonService || 0))}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-primary">
                                {formatCurrency(Number(invoice.totalAmount))}
                              </td>
                              <td className="px-4 py-3">
                                {getInvoiceStatusBadge(invoice.status)}
                              </td>
                              <td className="px-4 py-3 text-sm text-tertiary">
                                {invoice.paidAt 
                                  ? formatDateTime(invoice.paidAt)
                                  : formatDateTime(invoice.createdAt)
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-tertiary rounded-lg border border-primary">
                    <FileText size={32} className="text-tertiary mx-auto mb-2" />
                    <p className="text-sm text-tertiary">Chưa có hóa đơn nào</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
