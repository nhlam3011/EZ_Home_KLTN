'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from 'flowbite-react'
import { ArrowLeft, Edit, Trash2, Home, MapPin, Users, Building2, FileText, Plus, X, Calendar, DollarSign, Zap, MoreHorizontal, ArrowUpRight } from 'lucide-react'
import Loading from '@/components/Loading'

interface Building {
    id: number
    name: string
    address: string
    buildingType: string
    floorCount: number
    totalRooms: number
    area: number | null
    description: string | null
    images: string[]
    thumbnailUrl: string | null
    status: string
    isActive: boolean
    createdAt: string
    rooms?: Room[]
    ownerContracts?: OwnerContract[]
    invoices?: Invoice[]
    stats?: {
        totalRooms: number
        rentedRooms: number
        availableRooms: number
        maintenanceRooms: number
        totalRevenue: number
    }
}

interface Room {
    id: number
    name: string
    floor: number
    price: number
    status: string
    roomType: string | null
    contracts: Array<{
        id: number
        status: string
        user: {
            id: number
            fullName: string
            phone?: string
        }
    }>
}

interface OwnerContract {
    id: number
    monthlyRent: number
    deposit: number
    commission: number
    startDate: string
    endDate: string | null
    status: string
    contractType: string
    contractUrl: string | null
    owner: {
        id: number
        fullName: string
        phone: string
        email: string | null
    }
}

interface Invoice {
    id: number
    month: number
    year: number
    totalAmount: number
    status: string
    createdAt: string
    contract: {
        id: number
        user: {
            fullName: string
        }
    }
}

export default function BuildingDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params)
    const router = useRouter()
    const [building, setBuilding] = useState<Building | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'rooms' | 'contracts' | 'invoices'>('rooms')

    useEffect(() => {
        if (params.id) {
            fetchBuilding()
        }
    }, [params.id])

    const fetchBuilding = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/buildings/${params.id}`)
            const data = await response.json()
            if (response.ok) {
                setBuilding(data.building)
            } else {
                alert(data.error || 'Không thể tải thông tin căn nhà')
                router.push('/admin/buildings')
            }
        } catch (error) {
            console.error('Error fetching building:', error)
            router.push('/admin/buildings')
        } finally {
            setLoading(false)
        }
    }

    const getBuildingTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'CĂN_HỘ': 'Căn hộ',
            'NHÀ_PHỐ': 'Nhà phố',
            'BIỆT_THỰ': 'Biệt thự',
            'PHÒNG_TRỌ': 'Phòng trọ'
        }
        return labels[type] || type
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Hoạt động'
            case 'INACTIVE': return 'Không hoạt động'
            case 'MAINTENANCE': return 'Bảo trì'
            default: return status
        }
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

    const getRoomStatusLabel = (status: string) => {
        switch (status) {
            case 'RENTED': return 'Đã thuê'
            case 'AVAILABLE': return 'Trống'
            case 'MAINTENANCE': return 'Bảo trì'
            default: return status
        }
    }

    const deleteBuilding = async () => {
        const confirmValue = prompt('Vui lòng nhập "DELETE" để xác nhận xóa tòa nhà này cùng toàn bộ các dữ liệu liên quan:')
        if (confirmValue !== 'DELETE') {
            if (confirmValue !== null) alert('Nhập sai từ khóa xác nhận.')
            return
        }
        try {
            const response = await fetch(`/api/admin/buildings/${params.id}`, { method: 'DELETE' })
            if (response.ok) {
                router.push('/admin/buildings')
            } else {
                const data = await response.json()
                alert(data.error || 'Không thể xóa tòa nhà')
            }
        } catch (error) {
            console.error('Error deleting building:', error)
            alert('Lỗi kết nối server')
        }
    }

    const handleDelete = async (roomId: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return
        try {
            const response = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
            if (response.ok) {
                fetchBuilding()
            } else {
                const data = await response.json()
                alert(data.error || 'Không thể xóa phòng')
            }
        } catch (error) {
            console.error('Error deleting room:', error)
            alert('Lỗi kết nối server')
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <Loading size="lg" text="Đang tải thông tin căn nhà..." />
            </div>
        )
    }

    if (!building) {
        return null
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Standardized Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4 text-left">
                    <Link href="/admin/buildings" className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary hover:bg-tertiary transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                                {getBuildingTypeLabel(building.buildingType)}
                            </span>
                            <span className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">{building.floorCount} TẦNG</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">CHI TIẾT TÒA NHÀ</h1>
                        <div className="flex items-center gap-1.5 mt-1 text-tertiary">
                            <MapPin size={12} className="flex-shrink-0" />
                            <p className="text-xs font-medium">{building.address}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 !hidden sm:!flex">
                    <button
                        onClick={deleteBuilding}
                        className="btn bg-rose-50 text-rose-600 border border-rose-100 h-11 px-4 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-all shadow-sm"
                        title="Xóa tòa nhà"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={() => router.push(`/admin/buildings?edit=${building.id}`)}
                        className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center gap-2 shadow-sm"
                    >
                        <Edit size={18} />
                        <span className="font-bold">Chỉnh sửa</span>
                    </button>
                    <Link
                        href={`/admin/rooms/new?buildingId=${building.id}`}
                        className="btn btn-primary h-11 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        <span className="font-bold">Thêm phòng mới</span>
                    </Link>
                </div>
            </div>

            {/* Mobile Sticky Footer */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-primary px-3 py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 pb-safe">
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push(`/admin/buildings?edit=${building.id}`)}
                        className="btn btn-secondary flex-1 py-3 rounded-xl font-bold uppercase text-[13px] tracking-tight flex items-center justify-center gap-2"
                    >
                        <Edit size={18} />
                        Sửa
                    </button>
                    <Link
                        href={`/admin/rooms/new?buildingId=${building.id}`}
                        className="btn btn-primary flex-[2] py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        <span className="font-bold uppercase text-[13px] tracking-tight">Thêm phòng</span>
                    </Link>
                </div>
            </div>

            {/* Standardized Stats Grid */}
            {building.stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="card stat-card-blue">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">TỔNG SỐ PHÒNG</p>
                                <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{building.stats.totalRooms}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                                <Building2 className="text-white" size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="card stat-card-green">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">ĐÃ CHO THUÊ</p>
                                <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{building.stats.rentedRooms}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                                <Users className="text-white" size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="card stat-card-purple">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">PHÒNG TRỐNG</p>
                                <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{building.stats.availableRooms}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                                <Home className="text-white" size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="card stat-card-orange">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-secondary mb-1 font-medium uppercase tracking-widest">TỔNG DOANH THU</p>
                                <p className="text-lg sm:text-xl font-bold text-primary tracking-tight">{formatCurrency(building.stats.totalRevenue)}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                                <DollarSign className="text-white" size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info and Navigation Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Side: Summary & Image */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-0 overflow-hidden bg-primary border border-primary shadow-sm flex flex-col">
                        <div className="aspect-[4/3] bg-tertiary relative overflow-hidden">
                            {building.thumbnailUrl ? (
                                <img src={building.thumbnailUrl} alt={building.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-tertiary">
                                    <Building2 size={48} strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                        <div className="p-5 space-y-5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-tertiary border-b border-primary pb-2 text-left">Thông tin quản lý</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1 text-left">
                                    <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">Trạng thái</span>
                                    <span className={`w-fit px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${building.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800'
                                        }`}>
                                        {getStatusLabel(building.status)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 text-left">
                                    <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">Diện tích</span>
                                    <span className="text-sm font-bold text-primary">{building.area ? `${building.area} m²` : 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-left">
                                    <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">Ngày đăng ký</span>
                                    <span className="text-sm font-bold text-primary">{formatDate(building.createdAt)}</span>
                                </div>
                            </div>

                            {building.description && (
                                <div className="pt-4 border-t border-primary text-left">
                                    <span className="text-[10px] font-black text-tertiary uppercase tracking-widest block mb-2">Ghi chú</span>
                                    <p className="text-xs text-secondary leading-relaxed line-clamp-4 font-medium">{building.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Tabbed Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Tabs Navigation - Responsive Scroll */}
                    <div className="flex items-center gap-2 p-1.5 bg-primary rounded-xl border border-primary mb-6 overflow-x-auto whitespace-nowrap no-scrollbar max-w-full">
                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === 'rooms' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-tertiary hover:text-primary hover:bg-tertiary'
                                }`}
                        >
                            <Home size={14} /> Danh sách phòng
                        </button>
                        <button
                            onClick={() => setActiveTab('contracts')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === 'contracts' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-tertiary hover:text-primary hover:bg-tertiary'
                                }`}
                        >
                            <FileText size={14} /> Hợp đồng chủ nhà
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-tertiary hover:text-primary hover:bg-tertiary'
                                }`}
                        >
                            <DollarSign size={14} /> Lịch sử hoá đơn
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[400px]">
                        {activeTab === 'rooms' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {building.rooms?.length === 0 ? (
                                    <div className="col-span-full card py-20 border-2 border-dashed flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 rounded-xl bg-tertiary flex items-center justify-center text-tertiary mb-3 opacity-50">
                                            <Home size={24} />
                                        </div>
                                        <p className="text-xs font-black text-secondary uppercase tracking-widest">Chưa có phòng nào trong tòa nhà này</p>
                                        <Link href={`/admin/rooms/new?buildingId=${building.id}`} className="mt-4 btn btn-secondary btn-sm h-10 px-6 font-bold uppercase tracking-wider text-[10px]">Thêm phòng ngay</Link>
                                    </div>
                                ) : (
                                    building.rooms?.map((room) => (
                                        <div key={room.id} className="card group bg-primary border-primary overflow-hidden hover:border-blue-500/30 transition-all flex flex-col shadow-sm hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer">
                                            <div className="p-3 flex flex-col h-full gap-2 bg-white dark:bg-slate-800/60 transition-colors">
                                                {/* Top Section */}
                                                <div className="flex items-center justify-between h-7">
                                                    <div className="text-left">
                                                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">{room.name}</h3>
                                                        <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-[0.1em]">Tầng {room.floor} • {room.roomType || 'Mặc định'}</p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className={`w-2 h-2 rounded-full ${room.status === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`}></div>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-slate-100 dark:bg-slate-700/50"></div>

                                                {/* Info Rows */}
                                                <div className="space-y-2 flex-1 py-0.5">
                                                    <div className="flex items-center justify-between text-left h-5">
                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">TRẠNG THÁI</span>
                                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' :
                                                            room.status === 'RENTED' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:border-rose-800' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800'
                                                            }`}>
                                                            {getRoomStatusLabel(room.status)}
                                                        </div>
                                                    </div>
                                                    <div className="h-px bg-slate-50 dark:bg-slate-800/30"></div>
                                                    <div className="flex items-center justify-between text-left h-5">
                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">GIÁ THUÊ</span>
                                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(Number(room.price))}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-50 dark:bg-slate-800/30"></div>
                                                    <div className="flex items-center justify-between text-left h-5">
                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">NGƯỜI THUÊ</span>
                                                        {room.contracts?.find(c => c.status === 'ACTIVE') ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                                                    <Users size={10} />
                                                                </div>
                                                                <span className="text-[9px] font-medium text-slate-900 dark:text-slate-100 uppercase tracking-widest truncate max-w-[100px]">{room.contracts[0]?.user.fullName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">TRỐNG</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions Section */}
                                                <div className="h-px bg-slate-100 dark:bg-slate-700/50 mt-1"></div>

                                                <div className="flex items-center justify-between mt-1 pt-1">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/admin/rooms/${room.id}`}
                                                            className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-800 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                            title="Sửa phòng"
                                                        >
                                                            <Edit size={14} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(room.id)}
                                                            className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-900/10 text-rose-500 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                            title="Xoá phòng"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <Link
                                                        href={`/admin/rooms/${room.id}`}
                                                        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-110"
                                                        title="Xem chi tiết"
                                                    >
                                                        <ArrowUpRight size={18} className="text-white" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'contracts' && (
                            <div className="space-y-6">
                                {building.ownerContracts?.length === 0 ? (
                                    <div className="card py-20 border-2 border-dashed flex flex-col items-center justify-center text-tertiary font-black text-[10px] uppercase tracking-widest">
                                        Chưa có hợp đồng với chủ nhà
                                    </div>
                                ) : (
                                    building.ownerContracts?.map((contract) => (
                                        <div key={contract.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                            {/* Header Section */}
                                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                                                        <FileText size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Hợp đồng uỷ quyền quản lý</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số hiệu hồ sơ: #{contract.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${contract.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800'
                                                        }`}>
                                                        {contract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => router.push(`/admin/owner-contracts?edit=${contract.id}`)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                            title="Chỉnh sửa hợp đồng"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                            title="Xóa hồ sơ"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Body */}
                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                                {/* Column 1: Owner Info */}
                                                <div className="space-y-6 text-left">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <Users size={12} className="text-blue-500" /> THÔNG TIN CHỦ TÒA NHÀ
                                                        </h5>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-0.5">Họ và tên</p>
                                                                <p className="text-base font-bold text-slate-900 dark:text-white uppercase">{contract.owner.fullName}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-0.5">Điện thoại liên hệ</p>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-widest">{contract.owner.phone}</p>
                                                            </div>
                                                            {contract.owner.email && (
                                                                <div>
                                                                    <p className="text-xs text-slate-500 mb-0.5">Email</p>
                                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{contract.owner.email}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Financials */}
                                                <div className="space-y-6 text-left">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <DollarSign size={12} className="text-emerald-500" /> ĐIỀU KHOẢN TÀI CHÍNH
                                                        </h5>
                                                        <div className="space-y-4">
                                                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                                                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-bold">Thanh toán hàng tháng</p>
                                                                <p className="text-xl font-black text-blue-700 dark:text-blue-300 tracking-tight">{formatCurrency(Number(contract.monthlyRent))}</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs text-slate-500 mb-0.5">Phí quản lý</p>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{contract.commission}% doanh thu</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500 mb-0.5">Tiền cọc giữ chỗ</p>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(Number(contract.deposit || 0))}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 3: Timeline & Actions */}
                                                <div className="space-y-6 text-left">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <Calendar size={12} className="text-amber-500" /> THỜI HẠN & PHÁP LÝ
                                                        </h5>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                                    <Calendar size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500 mb-0.5">Hiệu lực hợp đồng</p>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                                        {formatDate(contract.startDate)} → {contract.endDate ? formatDate(contract.endDate) : 'Vô hạn'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="pt-4 space-y-3">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">HỒ SƠ ĐÍNH KÈM</p>
                                                                <button
                                                                    disabled={!contract.contractUrl}
                                                                    onClick={() => contract.contractUrl && viewPdf(contract.contractUrl)}
                                                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <FileText size={18} className="text-emerald-500" />
                                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hợp đồng Scan (PDF)</span>
                                                                    </div>
                                                                    <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'invoices' && (
                            <div className="card p-0 border border-primary overflow-hidden bg-primary shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="table-standard w-full">
                                        <thead>
                                            <tr className="bg-tertiary/10">
                                                <th className="text-left font-black uppercase tracking-widest text-[10px] py-4 px-6 text-tertiary">Tháng/Năm</th>
                                                <th className="text-left font-black uppercase tracking-widest text-[10px] py-4 px-6 text-tertiary">Người thuê</th>
                                                <th className="text-right font-black uppercase tracking-widest text-[10px] py-4 px-6 text-tertiary">Số tiền</th>
                                                <th className="text-center font-black uppercase tracking-widest text-[10px] py-4 px-6 text-tertiary">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-primary">
                                            {building.invoices?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-20 text-tertiary font-black uppercase tracking-widest text-[10px]">
                                                        Chưa có dữ liệu hoá đơn
                                                    </td>
                                                </tr>
                                            ) : (
                                                building.invoices?.map((invoice) => (
                                                    <tr key={invoice.id} className="hover:bg-tertiary/10 transition-colors group">
                                                        <td className="py-4 px-6 text-left">
                                                            <span className="text-xs font-bold text-primary">T{invoice.month}/{invoice.year}</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-left">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-primary">{invoice.contract.user.fullName}</span>
                                                                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">HĐ: #{invoice.contract.id}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatCurrency(Number(invoice.totalAmount))}</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' :
                                                                invoice.status === 'UNPAID' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800' :
                                                                    'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:border-rose-800'
                                                                }`}>
                                                                {invoice.status === 'PAID' ? 'Đã thu' :
                                                                    invoice.status === 'UNPAID' ? 'Chưa thu' : 'Quá hạn'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
