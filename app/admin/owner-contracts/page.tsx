'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Home, MapPin, Users, Building2, X, ChevronLeft, ChevronRight, Eye, FileText, DollarSign, Calendar, ChevronDown, CheckCircle, ArrowUpRight, ShieldCheck, Mail, Phone, Calculator, Upload, Download, Filter, Save } from 'lucide-react'
import Loading, { LoadingSpinner } from '@/components/Loading'
import { useBuilding } from '@/components/BuildingContext'

interface OwnerContract {
    id: number
    monthlyRent: number
    deposit: number
    commission: number
    startDate: string
    endDate: string | null
    status: string
    contractType: string
    notes: string | null
    contractUrl: string | null
    createdAt: string
    owner: {
        id: number
        fullName: string
        phone: string
        email: string | null
    }
    building: {
        id: number
        name: string
        address: string
    }
}

export default function OwnerContractsPage() {
    const [contracts, setContracts] = useState<OwnerContract[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const { selectedBuildingId } = useBuilding()
    const [buildings, setBuildings] = useState<{ id: number, name: string }[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // UI States
    const [showModal, setShowModal] = useState(false)
    const [selectedContract, setSelectedContract] = useState<OwnerContract | null>(null)
    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const [uploadingPdf, setUploadingPdf] = useState(false)
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)

    const [formData, setFormData] = useState({
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        buildingId: '',
        contractType: 'THUÊ_TOÀN_BỘ',
        monthlyRent: '',
        deposit: '',
        commission: '10',
        startDate: '',
        endDate: '',
        notes: '',
        contractUrl: ''
    })

    const itemsPerPage = 8

    useEffect(() => {
        setCurrentPage(1)
    }, [search, statusFilter, selectedBuildingId])

    useEffect(() => {
        fetchContracts()
        fetchBuildings()
    }, [search, statusFilter, selectedBuildingId, currentPage])

    const fetchContracts = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('limit', itemsPerPage.toString())
            if (search) params.append('search', search)
            if (statusFilter !== 'ALL') params.append('status', statusFilter)
            if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

            const response = await fetch(`/api/admin/owner-contracts?${params.toString()}`)
            const data = await response.json()

            setContracts(data.contracts || [])
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error('Error fetching contracts:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchBuildings = async () => {
        try {
            const response = await fetch('/api/admin/buildings?limit=100')
            const data = await response.json()
            setBuildings(data.buildings || [])
        } catch (error) {
            console.error('Error fetching buildings:', error)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            alert('Vui lòng chọn file PDF')
            return
        }

        setUploadingPdf(true)
        try {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                setFormData(prev => ({ ...prev, contractUrl: reader.result as string }))
                setUploadingPdf(false)
            }
        } catch (error) {
            console.error('Error reading file:', error)
            setUploadingPdf(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingSubmit(true)
        try {
            const url = selectedContract ? `/api/admin/owner-contracts/${selectedContract.id}` : '/api/admin/owner-contracts'
            const method = selectedContract ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    buildingId: parseInt(formData.buildingId),
                    monthlyRent: parseFloat(formData.monthlyRent),
                    deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
                    commission: parseFloat(formData.commission)
                })
            })

            if (response.ok) {
                setShowModal(false)
                fetchContracts()
            } else {
                const data = await response.json()
                alert(data.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            alert('Lỗi kết nối server')
        } finally {
            setLoadingSubmit(false)
        }
    }

    const openModal = (contract?: OwnerContract) => {
        if (contract) {
            setSelectedContract(contract)
            setFormData({
                ownerName: contract.owner.fullName,
                ownerPhone: contract.owner.phone,
                ownerEmail: contract.owner.email || '',
                buildingId: contract.building.id.toString(),
                contractType: contract.contractType,
                monthlyRent: contract.monthlyRent.toString(),
                deposit: contract.deposit?.toString() || '',
                commission: contract.commission.toString(),
                startDate: contract.startDate.split('T')[0],
                endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
                notes: contract.notes || '',
                contractUrl: contract.contractUrl || ''
            })
        } else {
            setSelectedContract(null)
            setFormData({
                ownerName: '',
                ownerPhone: '',
                ownerEmail: '',
                buildingId: selectedBuildingId?.toString() || '',
                contractType: 'THUÊ_TOÀN_BỘ',
                monthlyRent: '',
                deposit: '',
                commission: '10',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                notes: '',
                contractUrl: ''
            })
        }
        setShowModal(true)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN')
    }

    const viewPdf = (url: string | null) => {
        if (!url) return
        if (url.startsWith('data:application/pdf;base64,')) {
            try {
                const base64 = url.split(',')[1]
                const binary = atob(base64)
                const array = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) {
                    array[i] = binary.charCodeAt(i)
                }
                const blob = new Blob([array], { type: 'application/pdf' })
                const blobUrl = URL.createObjectURL(blob)
                window.open(blobUrl, '_blank')
            } catch (error) {
                console.error('Error viewing PDF:', error)
                window.open(url, '_blank')
            }
        } else {
            window.open(url, '_blank')
        }
    }

    const getStatusBadge = (status: string) => {
        const baseClass = "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border"
        const dotClass = "sm:hidden w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm shadow-black/5"

        switch (status) {
            case 'ACTIVE': return (
                <>
                    <span className={`hidden sm:inline-block ${baseClass} bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800`}>Đang hiệu lực</span>
                    <div className={`${dotClass} bg-emerald-500`} title="Đang hiệu lực" />
                </>
            )
            case 'EXPIRED': return (
                <>
                    <span className={`hidden sm:inline-block ${baseClass} bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800`}>Hết hạn</span>
                    <div className={`${dotClass} bg-amber-500`} title="Hết hạn" />
                </>
            )
            case 'TERMINATED': return (
                <>
                    <span className={`hidden sm:inline-block ${baseClass} bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:border-rose-800`}>Chấm dứt</span>
                    <div className={`${dotClass} bg-rose-500`} title="Chấm dứt" />
                </>
            )
            default: return (
                <>
                    <span className={`hidden sm:inline-block ${baseClass} bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800`}>{status}</span>
                    <div className={`${dotClass} bg-slate-500`} title={status} />
                </>
            )
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left w-full">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-tight">HỢP ĐỒNG ỦY THÁC</h1>
                    <p className="text-xs sm:text-sm text-secondary mt-1 font-medium">Quản lý pháp lý và vận hành tòa nhà với chủ sở hữu</p>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full lg:flex lg:flex-row lg:w-auto lg:items-center lg:gap-3">
                    <button
                        onClick={() => openModal()}
                        className="btn btn-primary h-11 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} />
                        <span className="font-bold">Lập hợp đồng</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="card stat-card-blue">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">TỔNG HỢP ĐỒNG</p>
                            <p className="text-lg sm:text-xl font-bold text-primary">{contracts.length}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                            <FileText className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div className="card stat-card-green">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">ĐANG HIỆU LỰC</p>
                            <p className="text-lg sm:text-xl font-bold text-primary">{contracts.filter(c => c.status === 'ACTIVE').length}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                            <CheckCircle className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div className="card stat-card-blue">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">TỔNG TIỀN THUÊ</p>
                            <p className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">{formatCurrency(contracts.reduce((a, b) => a + Number(b.monthlyRent), 0))}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <DollarSign className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div className="card stat-card-orange">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">SẮP HẾT HẠN</p>
                            <p className="text-lg sm:text-xl font-bold text-primary">{contracts.filter(c => c.status === 'EXPIRED').length}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                            <Calendar className="text-white" size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card p-4 flex flex-col lg:flex-row items-center gap-4 !overflow-visible relative z-20">
                <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                    {/* Status Filter Dropdown */}
                    <div className="relative w-full md:w-64 shrink-0">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown ? 'bg-slate-50 dark:bg-slate-800 border-blue-500 ring-2 ring-blue-500/10 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-500 shadow-sm'}`}
                        >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                                <Filter size={14} />
                            </div>
                            <div className="text-left pr-1 min-w-0 flex-1">
                                <p className="text-sm font-medium leading-tight truncate text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                    {statusFilter === 'ALL' ? 'TẤT CẢ TRẠNG THÁI' : statusFilter === 'ACTIVE' ? 'ĐANG HIỆU LỰC' : statusFilter === 'EXPIRED' ? 'HẾT HẠN' : 'CHẤM DỨT'}
                                </p>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-slate-400 ml-auto ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showStatusDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                                <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-scaleIn origin-top-left">
                                    <button onClick={() => { setStatusFilter('ALL'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>TẤT CẢ TRẠNG THÁI</button>
                                    <button onClick={() => { setStatusFilter('ACTIVE'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 ${statusFilter === 'ACTIVE' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>ĐANG HIỆU LỰC</button>
                                    <button onClick={() => { setStatusFilter('EXPIRED'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 ${statusFilter === 'EXPIRED' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>HẾT HẠN</button>
                                    <button onClick={() => { setStatusFilter('TERMINATED'); setShowStatusDropdown(false); setCurrentPage(1); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 ${statusFilter === 'TERMINATED' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>CHẤM DỨT</button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm chủ nhà, tòa nhà..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="input input-with-icon w-full pl-11 h-11 rounded-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Contracts List */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center">
                    <Loading size="lg" />
                    <p className="text-tertiary mt-4 text-[10px] font-black uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
                </div>
            ) : contracts.length === 0 ? (
                <div className="card py-20 border-2 border-dashed border-primary flex flex-col items-center justify-center bg-primary">
                    <div className="w-16 h-16 rounded-2xl bg-tertiary flex items-center justify-center text-tertiary mb-4 opacity-50">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-primary">Chưa có hợp đồng nào</h3>
                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">Bắt đầu quản lý bằng cách lập hợp đồng mới</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm leading-none">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                                    <th className="pl-8 pr-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hợp đồng & Chủ sở hữu</th>
                                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Toà nhà</th>
                                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Tài chính</th>
                                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Hiệu lực</th>
                                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Trạng thái</th>
                                    <th className="pl-4 pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Thao tác hồ sơ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {contracts.map((c) => (
                                    <tr key={c.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all group">
                                        <td className="pl-8 pr-4 py-6 align-middle">
                                            <div className="flex items-center gap-4 whitespace-nowrap">
                                                <div className="w-11 h-11 flex-shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
                                                    {c.owner.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors whitespace-nowrap">{c.owner.fullName}</p>
                                                    <div className="flex items-center gap-2.5 mt-1.5 leading-none">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md leading-none">#{c.id}</span>
                                                        <span className="text-[10px] font-bold text-slate-500 tracking-widest flex items-center gap-1.5 leading-none">
                                                            <Phone size={10} className="text-blue-500" /> {c.owner.phone}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 align-middle text-center">
                                            <div className="flex flex-col items-center justify-center text-center whitespace-nowrap">
                                                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-2">
                                                    <Building2 size={16} />
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase truncate leading-tight whitespace-nowrap">{c.building.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center align-middle">
                                            <div className="inline-block text-left whitespace-nowrap">
                                                <p className="text-[15px] font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">{formatCurrency(Number(c.monthlyRent))}</p>
                                                <div className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800 leading-none">
                                                    Phí: {c.commission}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center align-middle">
                                            <div className="inline-flex flex-col items-center gap-2 whitespace-nowrap">
                                                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 leading-none whitespace-nowrap">
                                                    <Calendar size={14} className="text-blue-500 opacity-70" /> {formatDate(c.startDate)}
                                                </p>
                                                <p className="text-[11px] font-medium text-slate-400 tracking-tight opacity-80 leading-none whitespace-nowrap">
                                                    {c.endDate ? `Đến ${formatDate(c.endDate)}` : 'Vô thời hạn'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center align-middle">
                                            <div className="inline-flex justify-center w-full scale-110 origin-center whitespace-nowrap">
                                                {getStatusBadge(c.status)}
                                            </div>
                                        </td>
                                        <td className="pl-4 pr-8 py-6 text-right align-middle">
                                            <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                                                {c.contractUrl && (
                                                    <button
                                                        onClick={() => viewPdf(c.contractUrl)}
                                                        className="w-10 h-10 flex-shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 hover:scale-110 transition-all shadow-lg shadow-emerald-500/20"
                                                        title="Xem file Scan"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openModal(c)}
                                                    className="w-10 h-10 flex-shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 hover:scale-110 transition-all shadow-lg shadow-amber-500/20"
                                                    title="Sửa hợp đồng"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <Link
                                                    href={`/admin/owner-contracts/${c.id}`}
                                                    className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all shadow-lg shadow-blue-500/20"
                                                    title="Chi tiết"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-10">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary disabled:opacity-30 hover:bg-tertiary transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="bg-primary px-6 h-10 rounded-xl border border-primary flex items-center justify-center gap-3">
                        <span className="text-xs font-bold text-blue-600">{currentPage}</span>
                        <span className="text-[10px] text-tertiary font-black">/ {totalPages}</span>
                    </div>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary disabled:opacity-30 hover:bg-tertiary transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-primary rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                        <div className="p-6 sm:p-8 border-b border-primary flex items-center justify-between flex-shrink-0 bg-blue-50/20 dark:bg-blue-900/10">
                            <div className="flex items-center gap-5 text-left">
                                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-primary">{selectedContract ? 'Cập nhật hợp đồng' : 'Thiết lập hợp đồng mới'}</h2>
                                    <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mt-1">Quản lý các điều khoản vận hành tòa nhà</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center hover:bg-tertiary transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            {/* Section: Owner */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="w-2 h-4 bg-blue-600 rounded-full" />
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Thông tin chủ sở hữu</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Họ và tên chủ nhà *</label>
                                        <input required value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} className="input w-full px-5" placeholder="VD: Nguyễn Văn A" />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Số điện thoại *</label>
                                        <input required value={formData.ownerPhone} onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })} className="input w-full px-5" placeholder="VD: 0912345678" />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Terms */}
                            <div className="space-y-4 pt-4 border-t border-primary">
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="w-2 h-4 bg-emerald-600 rounded-full" />
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Chi tiết thỏa thuận vận hành</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Tòa nhà cho thuê *</label>
                                        <select required value={formData.buildingId} onChange={e => setFormData({ ...formData, buildingId: e.target.value })} className="select w-full px-5">
                                            <option value="">-- Chọn tòa nhà --</option>
                                            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Hình thức hợp tác</label>
                                        <select value={formData.contractType} onChange={e => setFormData({ ...formData, contractType: e.target.value })} className="select w-full px-5">
                                            <option value="THUÊ_TOÀN_BỘ">Thuê trọn gói</option>
                                            <option value="HỢP_TÁC_DOANH_THU">Hợp tác % doanh thu</option>
                                            <option value="VẬN_HÀNH_THU_HỘ">Ủy quyền vận hành</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Tiền thuê hàng tháng (VNĐ) *</label>
                                        <div className="relative">
                                            <input type="number" required value={formData.monthlyRent} onChange={e => setFormData({ ...formData, monthlyRent: e.target.value })} className="input input-with-icon w-full pl-11 pr-5" />
                                            <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Tỷ lệ phí vận hành (%)</label>
                                        <div className="relative">
                                            <input type="number" required value={formData.commission} onChange={e => setFormData({ ...formData, commission: e.target.value })} className="input input-with-icon w-full pl-11 pr-5" />
                                            <Calculator size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Ngày bắt đầu *</label>
                                        <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="input w-full px-5" />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Ngày kết hạn</label>
                                        <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="input w-full px-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Section: File Attachment */}
                            <div className="space-y-4 pt-4 border-t border-primary">
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="w-2 h-4 bg-amber-500 rounded-full" />
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Hồ sơ pháp lý</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Tải lên hợp đồng scan (PDF)</label>
                                        <div className="flex items-center gap-4">
                                            <label className={`flex-1 min-h-[128px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${formData.contractUrl ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-500 hover:bg-blue-50/30 hover:text-blue-500'
                                                }`}>
                                                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                                    {uploadingPdf ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <LoadingSpinner size={24} />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Đang tải...</span>
                                                        </div>
                                                    ) : formData.contractUrl ? (
                                                        <>
                                                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                                                                <CheckCircle size={24} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Tệp hợp đồng đã sẵn sàng</span>
                                                            <p className="text-[9px] mt-1 opacity-70">Nhấp để thay đổi</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                                                                <Upload size={24} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Tải lên hợp đồng scan (PDF)</span>
                                                            <p className="text-[9px] mt-1 opacity-70 font-medium">Chọn hoặc kéo thả tệp vào đây</p>
                                                        </>
                                                    )}
                                                </div>
                                            </label>
                                            {formData.contractUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, contractUrl: '' }))}
                                                    className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center hover:bg-rose-100 transition-all"
                                                >
                                                    <X size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Ghi chú bổ sung</label>
                                        <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input w-full px-5 py-4 min-h-[128px]" placeholder="Ghi chú về các thỏa thuận đặc biệt khác..." />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-10 border-t border-primary flex-shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]">Hủy bỏ</button>
                                <button type="submit" disabled={loadingSubmit || uploadingPdf} className="btn btn-primary h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 flex items-center justify-center min-w-[140px]">
                                    {loadingSubmit ? (
                                        <div className="flex items-center gap-2">
                                            <LoadingSpinner size={16} />
                                            <span>Đang xử lý...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Save size={16} />
                                            <span>{selectedContract ? 'Cập nhật hợp đồng' : 'Thiết lập hợp đồng'}</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
