'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Home, MapPin, Users, Building2, X, ChevronLeft, ChevronRight, Eye, FileText, ChevronDown, CheckCircle, DollarSign, Ruler, Calendar, Phone, Mail, Activity, ArrowUpRight, Sparkles, Zap, Image as ImageIcon, Save } from 'lucide-react'
import Loading, { LoadingSpinner } from '@/components/Loading'

interface RoomTypePreset {
    type: string
    price: number
    area: number
    amenities: string[]
}

interface Building {
    id: number
    name: string
    address: string
    buildingType: string
    floorCount: number
    totalRooms: number // actual count from API
    rentedRooms: number
    availableRooms: number
    capacity?: number // from DB
    area: number | null
    description: string | null
    images: string[]
    thumbnailUrl: string | null
    status: string
    isActive: boolean
    roomTypePresets?: RoomTypePreset[]
}

export default function BuildingsPage() {
    const [buildings, setBuildings] = useState<Building[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)

    // Add/Edit State
    const [showModal, setShowModal] = useState(false)
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        buildingType: 'NHÀ_PHỐ',
        floorCount: 1,
        totalRooms: 0,
        area: '',
        description: '',
        status: 'ACTIVE',
        roomTypePresets: [] as RoomTypePreset[],
        images: [] as string[],
        thumbnailUrl: ''
    })

    const itemsPerPage = 8

    useEffect(() => {
        fetchBuildings()
    }, [search, statusFilter, typeFilter, currentPage])

    const fetchBuildings = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('limit', itemsPerPage.toString())
            if (search) params.append('search', search)
            if (statusFilter !== 'ALL') params.append('status', statusFilter)
            if (typeFilter !== 'ALL') params.append('type', typeFilter)

            const response = await fetch(`/api/admin/buildings?${params.toString()}`)
            const data = await response.json()

            setBuildings(data.buildings || [])
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error('Error fetching buildings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingSubmit(true)
        try {
            const url = selectedBuilding ? `/api/admin/buildings/${selectedBuilding.id}` : '/api/admin/buildings'
            const method = selectedBuilding ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    floorCount: parseInt(formData.floorCount.toString()),
                    totalRooms: parseInt(formData.totalRooms.toString()),
                    area: formData.area ? parseFloat(formData.area) : null,
                    images: formData.images,
                    thumbnailUrl: formData.thumbnailUrl
                })
            })

            if (response.ok) {
                setShowModal(false)
                fetchBuildings()
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

    const deleteBuilding = async (id: number) => {
        const confirmValue = prompt('Vui lòng nhập "DELETE" để xác nhận xóa tòa nhà này cùng toàn bộ các dữ liệu liên quan:')
        if (confirmValue !== 'DELETE') {
            if (confirmValue !== null) alert('Nhập sai từ khóa xác nhận.')
            return
        }
        try {
            const response = await fetch(`/api/admin/buildings/${id}`, { method: 'DELETE' })
            if (response.ok) {
                fetchBuildings()
                setShowModal(false)
            } else {
                const data = await response.json()
                alert(data.error || 'Không thể xóa tòa nhà')
            }
        } catch (error) {
            alert('Lỗi kết nối server')
        }
    }

    const openModal = (building?: Building) => {
        if (building) {
            setSelectedBuilding(building)
            setFormData({
                name: building.name,
                address: building.address,
                buildingType: building.buildingType,
                floorCount: building.floorCount,
                totalRooms: building.capacity || building.totalRooms,
                area: building.area?.toString() || '',
                description: building.description || '',
                status: building.status,
                roomTypePresets: building.roomTypePresets || [],
                images: building.images || [],
                thumbnailUrl: building.thumbnailUrl || ''
            })
        } else {
            setSelectedBuilding(null)
            setFormData({
                name: '',
                address: '',
                buildingType: 'NHÀ_PHỐ',
                floorCount: 1,
                totalRooms: 0,
                area: '',
                description: '',
                status: 'ACTIVE',
                roomTypePresets: [
                    { type: 'Studio', price: 5000000, area: 25, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường', 'Tủ quần áo'] },
                    { type: '1PN', price: 7000000, area: 35, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường', 'Tủ quần áo', 'Máy giặt', 'Bếp'] }
                ],
                images: [],
                thumbnailUrl: ''
            })
        }
        setShowModal(true)
    }

    const addPreset = () => {
        setFormData({
            ...formData,
            roomTypePresets: [
                ...formData.roomTypePresets,
                { type: '', price: 0, area: 0, amenities: [] }
            ]
        })
    }

    const removePreset = (index: number) => {
        const newPresets = [...formData.roomTypePresets]
        newPresets.splice(index, 1)
        setFormData({ ...formData, roomTypePresets: newPresets })
    }

    const updatePreset = (index: number, field: keyof RoomTypePreset, value: any) => {
        const newPresets = [...formData.roomTypePresets]
        newPresets[index] = { ...newPresets[index], [field]: value }
        setFormData({ ...formData, roomTypePresets: newPresets })
    }

    const getBuildingTypeLabel = (type: string) => {
        switch (type) {
            case 'NHÀ_PHỐ': return 'Nhà phố'
            case 'CĂN_HỘ': return 'Căn hộ'
            case 'PHÒNG_TRỌ': return 'Phòng trọ'
            default: return type
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">Hoạt động</span>
            case 'MAINTENANCE': return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">Bảo trì</span>
            default: return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">{status}</span>
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left w-full">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-tight">CẤU HÌNH TÒA NHÀ</h1>
                    <p className="text-xs sm:text-sm text-secondary mt-1 font-medium">Thiết lập thông số vận hành và thông tin tòa nhà</p>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap w-full sm:w-auto">
                    <button
                        onClick={() => openModal()}
                        className="btn btn-primary h-11 px-6 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span className="font-bold">Thêm tòa nhà mới</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="card stat-card-blue">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">TỔNG TÒA NHÀ</p>
                            <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{buildings.length}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                            <Building2 className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div className="card stat-card-green">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">ĐANG HOẠT ĐỘNG</p>
                            <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{buildings.filter(b => b.status === 'ACTIVE').length}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                            <CheckCircle className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div className="card stat-card-orange">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">ĐANG BẢO TRÌ</p>
                            <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{buildings.filter(b => b.status === 'MAINTENANCE').length}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                            <Zap className="text-white" size={20} />
                        </div>
                    </div>
                </div>
                <div className="card stat-card-purple">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">TỔNG SỐ PHÒNG</p>
                            <p className="text-lg sm:text-xl font-bold text-primary">{buildings.reduce((sum, b) => sum + (b.capacity || b.totalRooms || 0), 0)}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                            <Home className="text-white" size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Synchronized Filter Bar */}
            <div className="card p-3 sm:p-4 !overflow-visible relative z-30">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Building Type Filter */}
                    <div className="relative w-full">
                        <button
                            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showTypeDropdown
                                ? 'bg-tertiary border-blue-500 ring-2 ring-blue-500/10 shadow-lg'
                                : 'bg-primary border-primary hover:border-blue-500 shadow-sm'
                                }`}
                        >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                                <Building2 size={14} />
                            </div>
                            <div className="text-left pr-1 min-w-0 flex-1">
                                <p className="text-sm font-medium leading-tight truncate text-primary uppercase tracking-wider">
                                    {typeFilter === 'ALL' ? 'TẤT CẢ LOẠI HÌNH' : getBuildingTypeLabel(typeFilter).toUpperCase()}
                                </p>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ml-auto ${showTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showTypeDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowTypeDropdown(false)} />
                                <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left">
                                    {['ALL', 'NHÀ_PHỐ', 'CĂN_HỘ', 'PHÒNG_TRỌ'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => { setTypeFilter(type); setShowTypeDropdown(false); setCurrentPage(1); }}
                                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all uppercase ${typeFilter === type ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                                        >
                                            {type === 'ALL' ? 'TẤT CẢ LOẠI HÌNH' : getBuildingTypeLabel(type).toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative w-full">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown
                                ? 'bg-tertiary border-blue-500 ring-2 ring-blue-500/10 shadow-lg'
                                : 'bg-primary border-primary hover:border-blue-500 shadow-sm'
                                }`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${statusFilter === 'ALL' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                                statusFilter === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' :
                                    'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
                                }`}>
                                {statusFilter === 'ALL' ? <Activity size={14} /> : statusFilter === 'ACTIVE' ? <CheckCircle size={14} /> : <Zap size={14} />}
                            </div>
                            <div className="text-left pr-1 min-w-0 flex-1">
                                <p className="text-sm font-medium leading-tight truncate text-primary uppercase tracking-wider">
                                    {statusFilter === 'ALL' ? 'TẤT CẢ TRẠNG THÁI' : statusFilter === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'BẢO TRÌ'}
                                </p>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ml-auto ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showStatusDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                                <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left">
                                    {[
                                        { id: 'ALL', label: 'TẤT CẢ TRẠNG THÁI', icon: <Activity size={14} /> },
                                        { id: 'ACTIVE', label: 'HOẠT ĐỘNG', icon: <CheckCircle size={14} /> },
                                        { id: 'MAINTENANCE', label: 'BẢO TRÌ', icon: <Zap size={14} /> }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => { setStatusFilter(s.id); setShowStatusDropdown(false); setCurrentPage(1); }}
                                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all uppercase ${statusFilter === s.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                                        >
                                            {s.icon}
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc địa chỉ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input input-with-icon w-full pl-10 h-11 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-gray-100 dark:border-gray-700"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-blue-500 transition-colors" size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Buildings Grid */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center">
                    <Loading size="lg" />
                    <p className="text-tertiary mt-4 animate-pulse">Đang đồng bộ dữ liệu tòa nhà...</p>
                </div>
            ) : buildings.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-20 border-2 border-dashed">
                    <div className="w-16 h-16 rounded-xl bg-tertiary flex items-center justify-center text-tertiary mb-4">
                        <Building2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-primary">Không tìm thấy tòa nhà</h3>
                    <p className="text-secondary text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm tòa nhà mới</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {buildings.map((b) => (
                        <div key={b.id} className="card group p-0 overflow-hidden flex flex-col border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 rounded-xl">
                            {/* Image Section */}
                            <div className="p-2.5 pb-0">
                                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 rounded-md relative overflow-hidden">
                                    {b.thumbnailUrl || b.images?.[0] ? (
                                        <img src={b.thumbnailUrl || b.images?.[0]} alt={b.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                            <Building2 size={48} strokeWidth={1} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${b.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`} />
                                    </div>

                                    {/* Quick Actions Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => openModal(b)}
                                            title="Chỉnh sửa thông tin"
                                            className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center hover:bg-amber-100 transition-all shadow-sm"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <Link
                                            href={`/admin/buildings/${b.id}`}
                                            title="Xem chi tiết tòa nhà"
                                            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            <ArrowUpRight size={16} className="text-white" />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="px-4 py-2.5 flex flex-col flex-1">
                                <div className="mb-2">
                                    <h3 className="text-base font-bold text-primary group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate pr-2" title={b.name}>{b.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 dark:text-slate-400">
                                        <MapPin size={13} className="flex-shrink-0" />
                                        <p className="text-xs font-medium truncate">{b.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/30">
                                        {getBuildingTypeLabel(b.buildingType)}
                                    </span>
                                    <span className="px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                        {b.floorCount} TẦNG
                                    </span>
                                </div>

                                {/* Stats Grid Section - Simplified Alignment */}
                                <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-3">
                                    <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700">
                                        <div className="p-2 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">TỔNG</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                    <Home size={14} />
                                                </div>
                                                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{b.totalRooms}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-500/60 uppercase tracking-widest mb-1">TRỐNG</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                                    <CheckCircle size={14} />
                                                </div>
                                                <span className="text-lg font-black text-emerald-600 tracking-tight">{b.availableRooms || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Section - One icon for residents */}
                                <div className="mt-auto -mx-4 -mb-3.5 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <Users size={12} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 dark:text-white leading-none mb-0.5">{b.rentedRooms || 0}</p>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">CƯ DÂN</p>
                                        </div>
                                    </div>
                                    <Link href={`/admin/buildings/${b.id}`} className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:gap-1.5 transition-all">
                                        PHÒNG <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-10">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="w-11 h-11 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary disabled:opacity-30 hover:bg-tertiary transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="bg-primary px-8 h-11 rounded-xl border border-primary flex items-center justify-center gap-3">
                        <span className="text-sm font-bold text-blue-600">{currentPage}</span>
                        <span className="text-xs text-tertiary font-medium">của {totalPages} trang</span>
                    </div>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="w-11 h-11 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary disabled:opacity-30 hover:bg-tertiary transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Standardized Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-primary rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden animate-scaleIn h-[90vh] flex flex-col border border-primary">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-primary flex items-center justify-between flex-shrink-0 bg-primary">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-primary">{selectedBuilding ? 'Chỉnh sửa tòa nhà' : 'Thêm tòa nhà mới'}</h2>
                                    <p className="text-secondary text-sm">Cập nhật thông tin chi tiết và cấu hình tòa nhà</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon h-10 w-10">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar bg-secondary/30">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Side: Form Details */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Basic Info Section */}
                                    <div className="card space-y-6">
                                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                                            <FileText size={20} />
                                            <h3 className="text-base font-bold text-primary">Thông tin cơ bản</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2 text-left">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Tên tòa nhà *</label>
                                                <input
                                                    required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="input h-11" placeholder="VD: EZ Home Nguyễn Trãi"
                                                />
                                            </div>
                                            <div className="space-y-2 text-left">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Loại hình</label>
                                                <select
                                                    value={formData.buildingType} onChange={e => setFormData({ ...formData, buildingType: e.target.value })}
                                                    className="select h-11 w-full"
                                                >
                                                    <option value="NHÀ_PHỐ">Nhà phố</option>
                                                    <option value="CĂN_HỘ">Căn hộ</option>
                                                    <option value="PHÒNG_TRỌ">Phòng trọ</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-2 text-left">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Địa chỉ đầy đủ *</label>
                                                <input
                                                    required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                    className="input h-11" placeholder="Số nhà, tên đường, phường, quận..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 md:col-span-2">
                                                <div className="space-y-2 text-left">
                                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Số tầng</label>
                                                    <input type="number" required value={formData.floorCount} onChange={e => setFormData({ ...formData, floorCount: parseInt(e.target.value) })} className="input h-11" />
                                                </div>
                                                <div className="space-y-2 text-left">
                                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Tổng số phòng</label>
                                                    <input type="number" required value={formData.totalRooms} onChange={e => setFormData({ ...formData, totalRooms: parseInt(e.target.value) })} className="input h-11" />
                                                </div>
                                                <div className="space-y-2 text-left">
                                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Diện tích (m²)</label>
                                                    <input value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} className="input h-11" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Room Type Presets */}
                                    <div className="card space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-amber-500">
                                                <Sparkles size={20} />
                                                <h3 className="text-base font-bold text-primary">Cấu hình loại phòng mẫu</h3>
                                            </div>
                                            <button type="button" onClick={addPreset} className="btn btn-secondary btn-sm h-9">
                                                <Plus size={16} /> Thêm loại
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {formData.roomTypePresets.map((preset, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-primary bg-tertiary/20 relative group transition-all hover:bg-tertiary/40">
                                                    <button type="button" onClick={() => removePreset(idx)} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 z-10">
                                                        <X size={14} />
                                                    </button>
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3">
                                                        <div className="md:col-span-3 text-left">
                                                            <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block tracking-wider">Loại phòng</label>
                                                            <input value={preset.type} onChange={e => updatePreset(idx, 'type', e.target.value)} className="input h-10 text-xs font-bold" placeholder="Studio" />
                                                        </div>
                                                        <div className="md:col-span-3 text-left">
                                                            <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block tracking-wider">Giá thuê</label>
                                                            <input type="number" value={preset.price} onChange={e => updatePreset(idx, 'price', parseInt(e.target.value))} className="input h-10 text-xs font-bold text-blue-600" />
                                                        </div>
                                                        <div className="md:col-span-2 text-left">
                                                            <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block tracking-wider">Diện tích</label>
                                                            <input type="number" value={preset.area} onChange={e => updatePreset(idx, 'area', parseInt(e.target.value))} className="input h-10 text-xs font-bold" />
                                                        </div>
                                                        <div className="md:col-span-4 text-left">
                                                            <label className="text-[10px] font-bold text-tertiary uppercase mb-1 block tracking-wider">Tiện ích</label>
                                                            <input
                                                                value={preset.amenities.join(', ')}
                                                                onChange={e => {
                                                                    const val = e.target.value
                                                                    const amenities = val ? val.split(',').map(s => s.trim()).filter(s => s !== '') : []
                                                                    updatePreset(idx, 'amenities', amenities)
                                                                }}
                                                                className="input h-10 text-xs font-medium"
                                                                placeholder="Máy lạnh, Tủ..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Images & Status */}
                                <div className="space-y-8">
                                    <div className="card space-y-4">
                                        <div className="flex items-center gap-3 text-blue-600 mb-4 pb-2 border-b border-primary/50">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                                <ImageIcon size={18} />
                                            </div>
                                            <h3 className="text-base font-bold text-primary">Hình ảnh toà nhà</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-4 text-center">
                                                <label className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] block">ẢNH ĐẠI DIỆN TÒA NHÀ</label>
                                                <div className="flex flex-col items-center gap-4">
                                                    <label className={`w-full max-w-sm h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${formData.thumbnailUrl ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50 text-emerald-600' : 'bg-tertiary/20 border-primary text-tertiary hover:border-blue-500/50 hover:text-blue-500'
                                                        }`}>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    const reader = new FileReader()
                                                                    reader.readAsDataURL(file)
                                                                    reader.onload = () => {
                                                                        setFormData({ ...formData, thumbnailUrl: reader.result as string })
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        {formData.thumbnailUrl ? (
                                                            <div className="w-full h-full relative group flex items-center justify-center p-2">
                                                                <img src={formData.thumbnailUrl} alt="Thumbnail" className="max-w-full max-h-full object-contain rounded-lg" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                                                        <ImageIcon size={20} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="w-12 h-12 rounded-full bg-tertiary/30 flex items-center justify-center mb-3">
                                                                    <ImageIcon size={24} className="text-tertiary" />
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">CHỌN ẢNH TÒA NHÀ</span>
                                                            </>
                                                        )}
                                                    </label>

                                                    <div className="w-full max-w-sm space-y-2 text-left px-2">
                                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">HOẶC NHẬP URL ẢNH</label>
                                                        <input
                                                            type="text"
                                                            value={formData.thumbnailUrl?.startsWith('data:') ? '' : formData.thumbnailUrl || ''}
                                                            onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                                            placeholder="https://example.com/image.jpg"
                                                            className="input h-10 text-xs"
                                                        />
                                                    </div>

                                                    {formData.thumbnailUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                                                            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-2 hover:bg-rose-100 transition-all shadow-sm text-[10px] font-black uppercase tracking-wider mt-2"
                                                        >
                                                            <Trash2 size={16} /> Gỡ ảnh
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-primary">
                                                <label className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] ml-1 block mb-3 text-left">TRẠNG THÁI HOẠT ĐỘNG</label>
                                                <select
                                                    value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                    className="select h-11 w-full font-bold"
                                                >
                                                    <option value="ACTIVE">HOẠT ĐỘNG</option>
                                                    <option value="MAINTENANCE">BẢO TRÌ</option>
                                                    <option value="INACTIVE">NGỪNG HOẠT ĐỘNG</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 p-6">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                                <FileText size={18} />
                                                <p className="text-xs font-bold uppercase tracking-widest">Mô tả toà nhà</p>
                                            </div>
                                            <textarea
                                                value={formData.description || ''}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="input text-xs sm:text-sm min-h-[140px] p-4 bg-primary border-primary focus:border-blue-500"
                                                placeholder="Nhập mô tả về tòa nhà, vị trí, tiện ích chung..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-primary flex items-center justify-between gap-3 bg-primary flex-shrink-0">
                            <div>
                                {selectedBuilding && (
                                    <button
                                        type="button"
                                        onClick={() => deleteBuilding(selectedBuilding.id)}
                                        className="btn bg-rose-50 text-rose-600 border border-rose-100 px-6 h-11 font-bold uppercase tracking-wider text-xs hover:bg-rose-100 transition-all"
                                    >
                                        <Trash2 size={18} className="mr-2" /> Xóa
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary px-8 h-11 font-bold uppercase tracking-wider text-xs">Hủy bỏ</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loadingSubmit}
                                    className="btn btn-primary px-6 h-11 min-w-[160px] shadow-lg shadow-blue-600/20 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                                >
                                    {loadingSubmit ? (
                                        <>
                                            <LoadingSpinner size={16} />
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} strokeWidth={2.5} />
                                            <span>{selectedBuilding ? 'Cập nhật' : 'Tạo tòa nhà'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
