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
        switch (status) {
            case 'PENDING':
                return (
                    <Badge color="warning" icon={Clock}>
                        Chờ duyệt
                    </Badge>
                )
            case 'APPROVED':
                return (
                    <Badge color="success" icon={CheckCircle}>
                        Đã duyệt
                    </Badge>
                )
            case 'REJECTED':
                return (
                    <Badge color="failure" icon={X}>
                        Từ chối
                    </Badge>
                )
            default:
                return <span className="text-secondary">{status}</span>
        }
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div
                    className="card stat-card-blue cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setStatusFilter('all')}
                    style={{ borderLeftColor: statusFilter === 'all' ? '#3b82f6' : 'transparent', borderLeftWidth: statusFilter === 'all' ? '4px' : '0px' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">TẤT CẢ</p>
                            <p className="text-xl sm:text-2xl font-bold text-primary">{requests.length}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                            <FileText className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div
                    className="card stat-card-yellow cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setStatusFilter('PENDING')}
                    style={{ borderLeftColor: statusFilter === 'PENDING' ? '#eab308' : 'transparent', borderLeftWidth: statusFilter === 'PENDING' ? '4px' : '0px' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">CHỜ DUYỆT</p>
                            <p className="text-xl sm:text-2xl font-bold text-primary">{pendingCount}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                            <Clock className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div
                    className="card stat-card-green cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setStatusFilter('APPROVED')}
                    style={{ borderLeftColor: statusFilter === 'APPROVED' ? '#22c55e' : 'transparent', borderLeftWidth: statusFilter === 'APPROVED' ? '4px' : '0px' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">ĐÃ DUYỆT</p>
                            <p className="text-xl sm:text-2xl font-bold text-primary">{approvedCount}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                            <Check className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div
                    className="card stat-card-red cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setStatusFilter('REJECTED')}
                    style={{ borderLeftColor: statusFilter === 'REJECTED' ? '#ef4444' : 'transparent', borderLeftWidth: statusFilter === 'REJECTED' ? '4px' : '0px' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium">TỪ CHỐI</p>
                            <p className="text-xl sm:text-2xl font-bold text-primary">{rejectedCount}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-md">
                            <X className="text-white" size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card p-3 sm:p-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, số điện thoại hoặc phòng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-with-icon w-full pr-4 py-2 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
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
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-tertiary border-b border-primary">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                                        CƯ DÂN
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                                        PHÒNG
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                                        NGÀY KẾT THÚC CŨ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                                        NGÀY KẾT THÚC MỚI
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                                        NGÀY YÊU CẦU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase">
                                        TRẠNG THÁI
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-secondary uppercase">
                                        HÀNH ĐỘNG
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary">
                                {filteredRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-secondary transition-colors">
                                        <td className="px-6 py-4">
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={16} className="text-tertiary" />
                                                <span className="font-medium text-primary">{request.contract.room.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-secondary">
                                                <Calendar size={14} />
                                                {formatDate(request.contract.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-blue-600 font-medium">
                                                <RefreshCw size={14} />
                                                {formatDate(request.newEndDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-secondary">
                                            {formatDate(request.requestDate)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {request.status === 'PENDING' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleProcess(request, 'APPROVE')}
                                                        disabled={processingId === request.id}
                                                        className="btn btn-success btn-sm"
                                                    >
                                                        {processingId === request.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Check size={14} />
                                                        )}
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => handleProcess(request, 'REJECT')}
                                                        disabled={processingId === request.id}
                                                        className="btn btn-error btn-sm"
                                                    >
                                                        {processingId === request.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <X size={14} />
                                                        )}
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-secondary">
                                                    {request.adminNote || 'Đã xử lý'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
