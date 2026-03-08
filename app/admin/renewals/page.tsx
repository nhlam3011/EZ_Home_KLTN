'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from 'flowbite-react'
import { Check, X, Clock, RefreshCw, FileText, User, Calendar, Loader2, Search, Phone, Mail, Building2, CheckCircle } from 'lucide-react'

interface RenewalRequest {
    id: number
    contractId: number
    userId: number
    requestDate: string
    newEndDate: string
    status: string
    adminNote: string | null
    processedAt: string | null
    createdAt: string
    contract: {
        id: number
        startDate: string
        endDate: string
        room: {
            id: number
            name: string
            floor: number
        }
        user: {
            fullName: string
            phone: string
            email: string | null
        }
    }
    user: {
        fullName: string
        phone: string
        email: string | null
    }
}

export default function RenewalsPage() {
    const [requests, setRequests] = useState<RenewalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<RenewalRequest | null>(null)
    const [adminNote, setAdminNote] = useState('')
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true)
            const url = statusFilter === 'all'
                ? '/api/contracts/renewals'
                : `/api/contracts/renewals?status=${statusFilter}`

            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setRequests(Array.isArray(data) ? data : (data.renewals || []))
            }
        } catch (error) {
            console.error('Error fetching requests:', error)
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const filteredRequests = requests.filter(request => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            request.user.fullName.toLowerCase().includes(searchLower) ||
            request.user.phone.includes(search) ||
            request.contract.room.name.toLowerCase().includes(searchLower)
        )
    })

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

    const handleProcess = (request: RenewalRequest, actionType: 'APPROVE' | 'REJECT') => {
        setSelectedRequest(request)
        setAction(actionType)
        setAdminNote('')
        setShowModal(true)
    }

    const confirmProcess = async () => {
        if (!selectedRequest || !action) return

        setProcessingId(selectedRequest.id)
        try {
            const response = await fetch(`/api/contracts/renewals/${selectedRequest.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestId: selectedRequest.id,
                    action,
                    adminNote
                })
            })

            if (response.ok) {
                alert(action === 'APPROVE' ? 'Đã duyệt yêu cầu gia hạn!' : 'Đã từ chối yêu cầu gia hạn!')
                setShowModal(false)
                fetchRequests()
            } else {
                const error = await response.json()
                alert(error.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Error processing request:', error)
            alert('Có lỗi xảy ra')
        } finally {
            setProcessingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            PENDING: { label: 'Chờ duyệt', color: 'warning' },
            APPROVED: { label: 'Đã duyệt', color: 'success' },
            REJECTED: { label: 'Từ chối', color: 'failure' }
        }
        const badge = statusMap[status] || { label: status, color: 'gray' }
        return (
            <Badge color={badge.color} className="whitespace-nowrap rounded font-medium inline-flex">
                {badge.label}
            </Badge>
        )
    }

    const pendingCount = requests.filter(r => r.status === 'PENDING').length
    const approvedCount = requests.filter(r => r.status === 'APPROVED').length
    const rejectedCount = requests.filter(r => r.status === 'REJECTED').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary truncate">Quản lý gia hạn hợp đồng</h1>
                    <p className="text-secondary mt-1 text-sm sm:text-base">Xem và duyệt yêu cầu gia hạn hợp đồng thuê</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <label className="text-xs sm:text-sm text-secondary whitespace-nowrap font-medium w-auto">TRẠNG THÁI:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="select flex-1"
                        >
                            <option value="all">Tất cả</option>
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="APPROVED">Đã duyệt</option>
                            <option value="REJECTED">Từ chối</option>
                        </select>
                    </div>
                    <div className="sm:col-span-1 lg:col-span-2 relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, số điện thoại hoặc phòng..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="input input-with-icon w-full pr-4 py-2 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-tertiary">Đang tải...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="card p-12 text-center">
                    <FileText className="mx-auto text-tertiary" size={48} />
                    <p className="text-tertiary mt-4">Không có yêu cầu gia hạn nào</p>
                </div>
            ) : (
                <>
                    <div className="card overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-tertiary border-b border-primary">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                                            CƯ DÂN
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                                            PHÒNG
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                                            NGÀY KẾT THÚC CŨ
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                                            NGÀY KẾT THÚC MỚI
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                                            NGÀY YÊU CẦU
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase align-middle">
                                            TRẠNG THÁI
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase align-middle">
                                            HÀNH ĐỘNG
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary">
                                    {paginatedRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-secondary transition-colors">
                                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                                                        <User size={18} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">{request.user.fullName}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Phone size={12} className="text-tertiary" />
                                                            <p className="text-xs text-tertiary">{request.user.phone}</p>
                                                        </div>
                                                        {request.user.email && (
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Mail size={12} className="text-tertiary" />
                                                                <p className="text-xs text-tertiary">{request.user.email}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={16} className="text-tertiary" />
                                                    <span className="font-medium text-primary">{request.contract.room.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                                                <div className="flex items-center gap-2 text-secondary">
                                                    <Calendar size={14} />
                                                    {formatDate(request.contract.endDate)}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                                                <div className="flex items-center gap-2 text-blue-600 font-medium">
                                                    <RefreshCw size={14} />
                                                    {formatDate(request.newEndDate)}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-secondary">
                                                {formatDate(request.requestDate)}
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 sm:py-4 align-middle">
                                                <div className="flex items-center justify-center gap-1">
                                                    {request.status === 'PENDING' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleProcess(request, 'APPROVE')}
                                                                disabled={processingId === request.id}
                                                                className="btn btn-ghost btn-icon text-success"
                                                                title="Duyệt"
                                                            >
                                                                {processingId === request.id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <CheckCircle size={16} className="w-[18px] h-[18px]" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcess(request, 'REJECT')}
                                                                disabled={processingId === request.id}
                                                                className="btn btn-ghost btn-icon text-danger"
                                                                title="Từ chối"
                                                            >
                                                                {processingId === request.id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <X size={16} className="w-[18px] h-[18px]" />
                                                                )}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-secondary truncate max-w-[120px]" title={request.adminNote || 'Đã xử lý'}>
                                                            {request.adminNote || 'Đã xử lý'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {filteredRequests.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-0 card p-3 sm:p-4 mt-4">
                            <p className="text-xs sm:text-sm text-secondary text-center sm:text-left">
                                Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredRequests.length)} trong tổng số {filteredRequests.length} yêu cầu
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
                                            className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
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

            {/* Confirmation Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action === 'APPROVE' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                    {action === 'APPROVE' ? (
                                        <Check size={20} className="text-green-600" />
                                    ) : (
                                        <X size={20} className="text-red-600" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {action === 'APPROVE' ? 'Duyệt yêu cầu gia hạn' : 'Từ chối yêu cầu gia hạn'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {action === 'APPROVE' ? 'Hợp đồng sẽ được gia hạn' : 'Yêu cầu sẽ bị từ chối'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Resident Info */}
                            <div className="p-4 bg-tertiary rounded-lg">
                                <h3 className="font-semibold text-primary mb-3">Thông tin cư dân</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-tertiary" />
                                        <span className="text-sm text-secondary">{selectedRequest.user.fullName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-tertiary" />
                                        <span className="text-sm text-secondary">{selectedRequest.user.phone}</span>
                                    </div>
                                    {selectedRequest.user.email && (
                                        <div className="flex items-center gap-2 col-span-2">
                                            <Mail size={16} className="text-tertiary" />
                                            <span className="text-sm text-secondary">{selectedRequest.user.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contract Info */}
                            <div className="p-4 bg-tertiary rounded-lg">
                                <h3 className="font-semibold text-primary mb-3">Thông tin hợp đồng</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-tertiary" />
                                        <span className="text-sm text-secondary">Phòng: {selectedRequest.contract.room.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-tertiary" />
                                        <span className="text-sm text-secondary">Ngày kết thúc cũ: {formatDate(selectedRequest.contract.endDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* New End Date */}
                            <div className={`p-4 rounded-lg ${action === 'APPROVE' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={20} className={action === 'APPROVE' ? 'text-green-600' : 'text-red-600'} />
                                    <div>
                                        <p className="text-sm text-secondary">Ngày kết thúc mới</p>
                                        <p className={`text-lg font-bold ${action === 'APPROVE' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatDate(selectedRequest.newEndDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Note */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Ghi chú {action === 'REJECT' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full px-4 border-primary py-3 border rounded-lg bg-white dark:bg-gray-700 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder={action === 'APPROVE' ? 'Nhập ghi chú (không bắt buộc)...' : 'Nhập lý do từ chối...'}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-secondary"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmProcess}
                                className={`btn ${action === 'APPROVE' ? 'btn-success' : 'btn-error'}`}
                            >
                                {processingId ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        {action === 'APPROVE' ? <Check size={16} /> : <X size={16} />}
                                        {action === 'APPROVE' ? 'Duyệt' : 'Từ chối'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
