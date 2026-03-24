'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from 'flowbite-react'
import { Check, X, Clock, RefreshCw, FileText, User, Calendar, Loader2, Search, Phone, Mail, Building2, CheckCircle, ChevronDown, Filter, Plus } from 'lucide-react'
import { useBuilding } from '@/components/BuildingContext'

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

interface Contract {
    id: number
    userId: number
    startDate: string
    endDate: string
    status: string
    user: {
        id: number
        fullName: string
        phone: string
        email: string | null
    }
    room: {
        id: number
        name: string
        floor: number
    }
}

export default function RenewalsPage() {
    const [requests, setRequests] = useState<RenewalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const { selectedBuildingId } = useBuilding()
    const [statusFilter, setStatusFilter] = useState('all')
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)
    const [search, setSearch] = useState('')
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<RenewalRequest | null>(null)
    const [adminNote, setAdminNote] = useState('')
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // State for direct contract extension
    const [showExtendModal, setShowExtendModal] = useState(false)
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loadingContracts, setLoadingContracts] = useState(false)
    const [contractSearch, setContractSearch] = useState('')
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [extendNote, setExtendNote] = useState('')
    const [extendingContract, setExtendingContract] = useState(false)
    const [showContractDropdown, setShowContractDropdown] = useState(false)

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())
            if (search) params.append('search', search)

            const url = `/api/contracts/renewals?${params.toString()}`

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
    }, [statusFilter, selectedBuildingId, search])

    useEffect(() => {
        setCurrentPage(1)
        setShowModal(false)
        setShowExtendModal(false)
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
            <Badge color={badge.color} className="whitespace-nowrap rounded font-medium inline-flex justify-center py-1.5 min-h-[28px]">
                {badge.label}
            </Badge>
        )
    }

    const pendingCount = requests.filter(r => r.status === 'PENDING').length
    const approvedCount = requests.filter(r => r.status === 'APPROVED').length
    const rejectedCount = requests.filter(r => r.status === 'REJECTED').length

    // Fetch contracts for extension
    const fetchContracts = useCallback(async () => {
        try {
            setLoadingContracts(true)
            const params = new URLSearchParams()
            if (contractSearch) params.append('search', contractSearch)
            if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

            const url = `/api/admin/contracts?${params.toString()}`

            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setContracts(data.contracts || [])
            }
        } catch (error) {
            console.error('Error fetching contracts:', error)
        } finally {
            setLoadingContracts(false)
        }
    }, [contractSearch, selectedBuildingId])

    useEffect(() => {
        if (showExtendModal) {
            fetchContracts()
        }
    }, [showExtendModal, fetchContracts])

    const filteredContracts = contracts.filter(c => {
        if (!contractSearch) return true
        const searchLower = contractSearch.toLowerCase()
        return (
            c.user.fullName.toLowerCase().includes(searchLower) ||
            c.user.phone.includes(contractSearch) ||
            c.room.name.toLowerCase().includes(searchLower)
        )
    })

    const handleExtendContract = async () => {
        if (!selectedContract) {
            alert('Vui lòng chọn hợp đồng')
            return
        }

        const newEndDate = (document.getElementById('newEndDate') as HTMLInputElement)?.value
        if (!newEndDate) {
            alert('Vui lòng chọn ngày kết thúc mới')
            return
        }

        setExtendingContract(true)
        try {
            const response = await fetch('/api/admin/contracts/renewals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contractId: selectedContract.id,
                    newEndDate,
                    adminNote: extendNote
                })
            })

            if (response.ok) {
                alert('Gia hạn hợp đồng thành công!')
                setShowExtendModal(false)
                setSelectedContract(null)
                setExtendNote('')
                fetchRequests()
            } else {
                const error = await response.json()
                alert(error.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Error extending contract:', error)
            alert('Có lỗi xảy ra')
        } finally {
            setExtendingContract(false)
        }
    }

    return (
        <div className="space-y-6 pb-28 sm:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 text-center sm:text-left w-full">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase line-clamp-1">GIA HẠN HỢP ĐỒNG</h1>
                    <p className="text-xs sm:text-sm text-secondary mt-1">Xem và duyệt yêu cầu gia hạn hợp đồng thuê</p>
                </div>
                <button
                    onClick={() => setShowExtendModal(true)}
                    className="btn btn-primary h-11 px-6 rounded-2xl !hidden sm:!flex items-center justify-center gap-2 order-1 lg:order-none shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Gia hạn hợp đồng</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="card p-3 sm:p-4 !overflow-visible relative z-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="relative w-full">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown
                                ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                                : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                                }`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                                statusFilter === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                                    statusFilter === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 text-green-500' :
                                        'bg-red-50 dark:bg-red-900/20 text-red-500'
                                }`}>
                                {statusFilter === 'all' && <Filter size={14} />}
                                {statusFilter === 'PENDING' && <Clock size={14} />}
                                {statusFilter === 'APPROVED' && <CheckCircle size={14} />}
                                {statusFilter === 'REJECTED' && <X size={14} />}
                            </div>
                            <div className="text-left pr-1 flex-1">
                                <p className="text-md font-medium leading-tight whitespace-nowrap text-primary uppercase">
                                    {statusFilter === 'all' ? 'TẤT CẢ' :
                                        statusFilter === 'PENDING' ? 'CHỜ DUYỆT' :
                                            statusFilter === 'APPROVED' ? 'ĐÃ DUYỆT' : 'TỪ CHỐI'}
                                </p>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showStatusDropdown && (
                            <>
                                <div className="fixed inset-0 z-40 transition-opacity" onClick={() => setShowStatusDropdown(false)} />
                                <div className="absolute top-full left-0 mt-2 w-full sm:w-[280px] bg-white/95 dark:bg-[#1a1c22]/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/20 dark:border-gray-800/50 p-3 z-50 animate-scaleIn origin-top-left overflow-hidden">
                                    <div className="flex flex-col gap-1">
                                        {[
                                            { id: 'all', label: 'TẤT CẢ', icon: <Filter size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                                            { id: 'PENDING', label: 'CHỜ DUYỆT', icon: <Clock size={16} />, color: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10' },
                                            { id: 'APPROVED', label: 'ĐÃ DUYỆT', icon: <CheckCircle size={16} />, color: 'text-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10' },
                                            { id: 'REJECTED', label: 'TỪ CHỐI', icon: <X size={16} />, color: 'text-red-500', bg: 'bg-red-50/50 dark:bg-red-900/10' }
                                        ].map((item) => (
                                            <button
                                              key={item.id}
                                              onClick={() => { setStatusFilter(item.id); setShowStatusDropdown(false); setCurrentPage(1); }}
                                              className={`flex items-center gap-3 w-full px-3 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                                                statusFilter === item.id 
                                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]' 
                                                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                                              }`}
                                            >
                                                <div className={`p-2 rounded-xl transition-colors ${statusFilter === item.id ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`}`}>
                                                    {item.icon}
                                                </div>
                                                <span className="uppercase tracking-tight">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="sm:col-span-1 lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm cư dân, phòng hoặc số điện thoại..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="input input-with-icon w-full pl-10 pr-4 py-2 text-sm h-11"
                        />
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
                                className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmProcess}
                                className={`btn h-11 px-6 rounded-2xl flex items-center justify-center gap-2 ${action === 'APPROVE' ? 'btn-success shadow-lg shadow-green-500/20' : 'btn-danger'}`}
                            >
                                {processingId ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        {action === 'APPROVE' ? <Check size={20} /> : <X size={20} />}
                                        {action === 'APPROVE' ? 'Duyệt' : 'Từ chối'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Contract Extension Modal */}
            {showExtendModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <RefreshCw size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Gia hạn hợp đồng
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Gia hạn hợp đồng thuê cho cư dân
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowExtendModal(false); setSelectedContract(null); setExtendNote(''); }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Contract Selection */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Chọn hợp đồng <span className="text-red-500">*</span>
                                </label>
                                <button
                                    onClick={() => setShowContractDropdown(!showContractDropdown)}
                                    className={`flex items-center justify-between w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 transition-all ${showContractDropdown ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-primary'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {selectedContract ? (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                    <User size={18} className="text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-primary">{selectedContract.user.fullName}</p>
                                                    <p className="text-sm text-tertiary">{selectedContract.room.name} • {selectedContract.user.phone}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-tertiary">Tìm kiếm hợp đồng...</span>
                                        )}
                                    </div>
                                    <ChevronDown size={18} className={`transition-transform ${showContractDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showContractDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowContractDropdown(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-primary z-50 max-h-60 overflow-y-auto">
                                            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                                                <div className="relative">
                                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                                                    <input
                                                        type="text"
                                                        placeholder="Tìm kiếm cư dân, phòng..."
                                                        value={contractSearch}
                                                        onChange={(e) => setContractSearch(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2 border border-primary rounded-lg bg-white dark:bg-gray-600 text-primary dark:text-white"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            {loadingContracts ? (
                                                <div className="p-4 text-center text-tertiary">
                                                    <Loader2 size={20} className="animate-spin mx-auto" />
                                                </div>
                                            ) : filteredContracts.length === 0 ? (
                                                <div className="p-4 text-center text-tertiary">Không tìm thấy hợp đồng</div>
                                            ) : (
                                                filteredContracts.map((contract) => (
                                                    <button
                                                        key={contract.id}
                                                        onClick={() => { setSelectedContract(contract); setShowContractDropdown(false); setContractSearch(''); }}
                                                        className={`flex items-center gap-3 w-full p-3 hover:bg-tertiary transition-colors ${selectedContract?.id === contract.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                            <User size={18} className="text-white" />
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="font-medium text-primary">{contract.user.fullName}</p>
                                                            <p className="text-sm text-tertiary">{contract.room.name} • {contract.user.phone}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-tertiary">Hết hạn:</p>
                                                            <p className={`text-sm font-medium ${new Date(contract.endDate) < new Date() ? 'text-red-500' : 'text-secondary'}`}>
                                                                {formatDate(contract.endDate)}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Selected Contract Info */}
                            {selectedContract && (
                                <div className="p-4 bg-tertiary rounded-lg">
                                    <h3 className="font-semibold text-primary mb-3">Thông tin hợp đồng hiện tại</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className="text-tertiary" />
                                            <span className="text-sm text-secondary">Phòng: {selectedContract.room.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-tertiary" />
                                            <span className="text-sm text-secondary">Ngày ký: {formatDate(selectedContract.startDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 col-span-2">
                                            <Clock size={16} className={new Date(selectedContract.endDate) < new Date() ? 'text-red-500' : 'text-tertiary'} />
                                            <span className={`text-sm ${new Date(selectedContract.endDate) < new Date() ? 'text-red-500 font-medium' : 'text-secondary'}`}>
                                                Ngày kết thúc hiện tại: {formatDate(selectedContract.endDate)}
                                                {new Date(selectedContract.endDate) < new Date() && ' (Đã hết hạn)'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* New End Date */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Ngày kết thúc mới <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="newEndDate"
                                    type="date"
                                    className="w-full px-4 py-3 border border-primary rounded-lg bg-white dark:bg-gray-700 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Admin Note */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Ghi chú
                                </label>
                                <textarea
                                    value={extendNote}
                                    onChange={(e) => setExtendNote(e.target.value)}
                                    className="w-full px-4 border-primary py-3 border rounded-lg bg-white dark:bg-gray-700 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Nhập ghi chú (không bắt buộc)..."
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => { setShowExtendModal(false); setSelectedContract(null); setExtendNote(''); }}
                                className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleExtendContract}
                                disabled={!selectedContract || extendingContract}
                                className="btn btn-primary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                {extendingContract ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Check size={20} />
                                        Gia hạn hợp đồng
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Mobile Sticky Footer */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-primary px-3 py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 pb-safe">
                <button
                    onClick={() => setShowExtendModal(true)}
                    className="btn btn-primary btn-md w-full py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    <span className="font-bold uppercase text-[13px] tracking-tight">Gia hạn hợp đồng</span>
                </button>
            </div>
        </div>
    )
}
