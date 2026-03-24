'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, Loader2, Package, DollarSign, Ruler, FileText } from 'lucide-react'

export default function NewServicePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        unitPrice: '',
        unit: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.name.trim()) { setError('Vui lòng nhập tên dịch vụ'); return }
        if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) { setError('Vui lòng nhập đơn giá hợp lệ'); return }
        if (!formData.unit.trim()) { setError('Vui lòng nhập đơn vị tính'); return }

        setLoading(true)
        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    unitPrice: parseFloat(formData.unitPrice),
                    unit: formData.unit.trim(),
                })
            })

            if (response.ok) {
                router.push('/admin/services')
                router.refresh()
            } else {
                const data = await response.json()
                setError(data.error || 'Có lỗi xảy ra khi tạo dịch vụ')
            }
        } catch (err) {
            console.error('Error creating service:', err)
            setError('Có lỗi xảy ra khi tạo dịch vụ')
        } finally {
            setLoading(false)
        }
    }

    const unitSuggestions = ['kWh', 'm3', 'Người', 'Kg', 'Lần', 'Bình', 'Tháng', 'Ngày']

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 pb-28 sm:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/services" className="btn btn-ghost btn-icon">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-primary">Thêm dịch vụ mới</h1>
                        <p className="text-secondary mt-1 text-sm sm:text-base">
                            Tạo mới một dịch vụ trong hệ thống
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 !hidden sm:!flex">
                    <Link href="/admin/services" className="btn btn-secondary btn-sm sm:btn-md">
                        <X size={18} />
                        <span>Hủy</span>
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary btn-sm sm:btn-md"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Đang tạo...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} strokeWidth={2.5} />
                                <span>Lưu dịch vụ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <Package size={20} />
                            <span>Thông tin dịch vụ</span>
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Tên dịch vụ <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="input input-with-icon"
                                        placeholder="VD: Giặt ủi, Vệ sinh máy lạnh, ..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Đơn giá (VND) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                                        <input
                                            type="number"
                                            name="unitPrice"
                                            value={formData.unitPrice}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            className="input input-with-icon"
                                            placeholder="VD: 20000"
                                        />
                                    </div>
                                    {formData.unitPrice && parseFloat(formData.unitPrice) > 0 && (
                                        <p className="text-xs text-tertiary mt-1">
                                            = {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(parseFloat(formData.unitPrice))}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Đơn vị tính <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Ruler size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                                        <input
                                            type="text"
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            required
                                            className="input input-with-icon"
                                            placeholder="VD: Kg, Lần, Bình, ..."
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {unitSuggestions.map(u => (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, unit: u }))}
                                                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${formData.unit === u
                                                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium'
                                                    : 'bg-tertiary border-primary text-secondary hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                    }`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Info */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="card stat-card-blue">
                        <h3 className="text-xs sm:text-sm font-semibold text-primary mb-3">Hướng dẫn</h3>
                        <ul className="space-y-2 text-xs sm:text-sm text-secondary">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                                <span>Tên dịch vụ nên ngắn gọn, rõ ràng</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                                <span>Đơn giá là giá cho mỗi đơn vị tính</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                                <span>Đơn vị tính phù hợp: Kg, Lần, Bình, m3, kWh...</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                                <span>Dịch vụ mới sẽ tự động ở trạng thái hoạt động</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                                <span>Có thể tắt/bật dịch vụ sau khi tạo trong trang quản lý</span>
                            </li>
                        </ul>
                    </div>

                    {/* Preview */}
                    {formData.name && (
                        <div className="card">
                            <h3 className="text-xs sm:text-sm font-semibold text-primary mb-3">Xem trước</h3>
                            <div className="p-4 bg-tertiary rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-lg">
                                        📋
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-primary">{formData.name || 'Tên dịch vụ'}</p>
                                        <p className="text-xs text-tertiary">
                                            {formData.unitPrice
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(parseFloat(formData.unitPrice))
                                                : '0 ₫'
                                            }
                                            /{formData.unit || '...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </form>
            {/* Mobile Sticky Footer */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-primary px-3 py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 pb-safe">
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/admin/services')}
                        className="btn btn-secondary btn-md flex-1 py-3 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <X size={18} />
                        <span className="font-bold uppercase text-[13px] tracking-tight">Hủy</span>
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary btn-md flex-[2] py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span className="font-bold text-[13px] tracking-tight">ĐANG TẠO...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} strokeWidth={2.5} />
                                <span className="font-bold uppercase text-[13px] tracking-tight">Lưu dịch vụ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
