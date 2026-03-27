'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Building2, Users, DollarSign, Calendar, FileText, CheckCircle, Trash2, Edit, Phone, Mail, MapPin, Upload } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/Loading'

interface OwnerContract {
    id: number
    ownerId: number
    buildingId: number
    contractType: string
    monthlyRent: number
    deposit: number
    commission: number
    startDate: string
    endDate: string | null
    contractUrl: string | null
    notes: string | null
    status: string
    owner: {
        fullName: string
        phone: string
        email: string | null
    }
    building: {
        name: string
        address: string
    }
}

export default function OwnerContractDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params)
    const router = useRouter()
    const contractId = params?.id as string
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [contract, setContract] = useState<OwnerContract | null>(null)
    const [buildings, setBuildings] = useState<any[]>([])
    
    const [formData, setFormData] = useState({
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        buildingId: '',
        contractType: 'MANAGEMENT',
        monthlyRent: '',
        deposit: '',
        commission: '',
        startDate: '',
        endDate: '',
        contractUrl: '',
        notes: '',
        status: 'ACTIVE'
    })

    useEffect(() => {
        if (contractId) {
            fetchData()
        }
    }, [contractId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [contractRes, buildingsRes] = await Promise.all([
                fetch(`/api/admin/owner-contracts/${contractId}`),
                fetch('/api/admin/buildings')
            ])

            const contractData = await contractRes.json()
            const buildingsData = await buildingsRes.json()

            if (contractRes.ok) {
                const cData = contractData.contract
                setContract(cData)
                setFormData({
                    ownerName: cData.owner.fullName,
                    ownerPhone: cData.owner.phone,
                    ownerEmail: cData.owner.email || '',
                    buildingId: cData.buildingId.toString(),
                    contractType: cData.contractType,
                    monthlyRent: cData.monthlyRent.toString(),
                    deposit: cData.deposit.toString(),
                    commission: cData.commission.toString(),
                    startDate: new Date(cData.startDate).toISOString().split('T')[0],
                    endDate: cData.endDate ? new Date(cData.endDate).toISOString().split('T')[0] : '',
                    contractUrl: cData.contractUrl || '',
                    notes: cData.notes || '',
                    status: cData.status
                })
            }
 else {
                alert(contractData.error || 'Không tìm thấy hợp đồng')
                router.push('/admin/owner-contracts')
            }

            if (buildingsRes.ok) {
                setBuildings(buildingsData.buildings || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const response = await fetch(`/api/admin/owner-contracts/${contractId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                router.push('/admin/owner-contracts')
                router.refresh()
            } else {
                const data = await response.json()
                alert(data.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            alert('Lỗi kết nối server')
        } finally {
            setSaving(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Đang hiệu lực</span>
            case 'EXPIRED':
                return <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Hết hiệu lực</span>
            default:
                return <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{status}</span>
        }
    }

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center">
                <Loading size="lg" />
                <p className="text-tertiary mt-4 animate-pulse uppercase text-[10px] font-black tracking-widest">Đang tải dữ liệu hợp đồng...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 mt-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/owner-contracts" className="btn btn-ghost btn-icon">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold text-primary uppercase tracking-tight">Chi tiết hợp đồng #{contract?.id}</h1>
                            {contract && getStatusBadge(contract.status)}
                        </div>
                        <p className="text-xs sm:text-sm text-secondary mt-1 tracking-wide uppercase font-medium opacity-70">
                            Chủ nhà: {contract?.owner.fullName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
                    <Link href="/admin/owner-contracts" className="btn btn-secondary h-11 px-6 rounded-2xl flex items-center justify-center gap-2">
                        <X size={18} />
                        <span className="font-bold uppercase tracking-widest text-[10px]">Hủy bỏ</span>
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn btn-primary h-11 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {saving ? <Loading size="sm" /> : <Save size={18} />}
                        <span className="font-bold uppercase tracking-widest text-[10px]">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8 text-left">
                    {/* Owner Info Section */}
                    <div className="bg-primary p-8 rounded-2xl border border-primary space-y-8 shadow-sm">
                        <div className="flex items-center gap-3 text-blue-600">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-sm text-left">Thông tin chủ sở hữu</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Họ và tên chủ nhà *</label>
                                <input name="ownerName" required value={formData.ownerName} onChange={handleChange} className="input h-11" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Số điện thoại *</label>
                                <div className="relative">
                                    <input name="ownerPhone" required value={formData.ownerPhone} onChange={handleChange} className="input h-11 pl-10" />
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Email liên hệ</label>
                                <div className="relative">
                                    <input name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} className="input h-11 pl-10" />
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contract Details Section */}
                    <div className="bg-primary p-8 rounded-2xl border border-primary space-y-8 shadow-sm">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-sm">Điều khoản tài chính</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Tiền thuê / Tháng</label>
                                <div className="relative">
                                    <input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} className="input h-11 pl-10 font-bold text-emerald-600" />
                                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Tiền cọc ủy thác</label>
                                <div className="relative">
                                    <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="input h-11 pl-10 font-bold text-blue-600" />
                                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Phí vận hành (%)</label>
                                <input type="number" name="commission" value={formData.commission} onChange={handleChange} className="input h-11 font-bold text-amber-600" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Ngày bắt đầu</label>
                                <div className="relative">
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input h-11 pl-10" />
                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Ngày kết thúc</label>
                                <div className="relative">
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="input h-11 pl-10" />
                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 text-left">
                    <div className="bg-primary p-8 rounded-2xl border border-primary space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Building2 size={20} />
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-sm">Tòa nhà ủy thác</h3>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50">
                            <p className="text-xs font-bold text-primary truncate uppercase mb-1">{contract?.building.name}</p>
                            <div className="flex items-center gap-1.5 text-tertiary">
                                <MapPin size={10} />
                                <p className="text-[9px] font-bold truncate tracking-tight uppercase opacity-70">{contract?.building.address}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Thay đổi tòa nhà</label>
                            <select name="buildingId" value={formData.buildingId} onChange={handleChange} className="input h-11">
                                {buildings.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-primary p-8 rounded-2xl border border-primary space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 text-amber-600">
                            <div className="p-2 bg-amber-50 rounded-xl">
                                <Upload size={20} />
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-sm text-left">Hợp đồng Scan</h3>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Đường dẫn file (PDF/Image)</label>
                            <input name="contractUrl" value={formData.contractUrl} onChange={handleChange} className="input h-11 placeholder:italic" placeholder="https://example.com/contract.pdf" />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
