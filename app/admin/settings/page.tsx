'use client'

import { useEffect, useState } from 'react'
import {
    Save,
    RotateCcw,
    Settings as SettingsIcon,
    Building2,
    DollarSign,
    Bell,
    Shield,
    Mail,
    Phone,
    Globe,
    Clock,
    CheckCircle,
    ChevronRight,
    Info,
    Download
} from 'lucide-react'
import Loading from '@/components/Loading'

interface Settings {
    [key: string]: string
}

const defaultSettings: { key: string; label: string; description: string; value: string; icon: React.ElementType; category: string }[] = [
    { key: 'app_name', label: 'Tên hệ thống', description: 'Tên hiển thị chính thức của ứng dụng EZ-Home.', value: 'EZ-Home', icon: Building2, category: 'general' },
    { key: 'currency', label: 'Đơn vị tiền tệ', description: 'Sử dụng cho tất cả các hóa đơn và giao dịch.', value: 'VND', icon: DollarSign, category: 'general' },
    { key: 'timezone', label: 'Múi giờ', description: 'Cấu hình múi giờ hệ thống để đồng bộ lịch sử.', value: 'Asia/Ho_Chi_Minh', icon: Clock, category: 'general' },
    { key: 'language', label: 'Ngôn ngữ hiển thị', description: 'Ngôn ngữ mặc định cho giao diện người dùng.', value: 'vi', icon: Globe, category: 'general' },
    { key: 'admin_email', label: 'Email hỗ trợ', description: 'Email dùng để gửi thông báo và tiếp nhận phản hồi.', value: 'admin@ezhome.com', icon: Mail, category: 'contact' },
    { key: 'admin_phone', label: 'Hotline quản trị', description: 'Số điện thoại khẩn cấp dành cho cư dân.', value: '', icon: Phone, category: 'contact' },
    { key: 'email_notifications', label: 'Thông báo Email', description: 'Tự động gửi email khi có hóa đơn hoặc tin tức mới.', value: 'true', icon: Bell, category: 'notifications' },
    { key: 'sms_notifications', label: 'Thông báo SMS', description: 'Gửi tin nhắn SMS trực tiếp đến số điện thoại cư dân.', value: 'false', icon: Bell, category: 'notifications' },
    { key: 'maintenance_mode', label: 'Chế độ bảo trì', description: 'Tạm dừng tất cả các dịch vụ để cập nhật hệ thống.', value: 'false', icon: Shield, category: 'system' },
]

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/settings')
            const data = await response.json()

            const merged: Settings = {}
            defaultSettings.forEach(s => {
                merged[s.key] = data[s.key] !== undefined ? data[s.key] : s.value
            })
            setSettings(merged)
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)

        try {
            for (const [key, value] of Object.entries(settings)) {
                await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value })
                })
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            console.error('Error saving settings:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        if (confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) {
            const defaults: Settings = {}
            defaultSettings.forEach(s => {
                defaults[s.key] = s.value
            })
            setSettings(defaults)
        }
    }

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "ez_home_settings.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    const categories = [
        { key: 'general', label: 'Chung', description: 'Cấu hình cơ bản của hệ thống', icon: SettingsIcon },
        { key: 'contact', label: 'Liên hệ', description: 'Thông tin kênh hỗ trợ cư dân', icon: Mail },
        { key: 'notifications', label: 'Thông báo', description: 'Cài đặt các kênh gửi tin nhắn', icon: Bell },
        { key: 'system', label: 'Hệ thống', description: 'Các thiết lập kỹ thuật chuyên sâu', icon: Shield },
    ]

    const filteredSettings = defaultSettings.filter(s => s.category === activeTab)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading text="Đang tải cấu hình..." />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-center sm:text-left w-full">
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] uppercase">CÀI ĐẶT HỆ THỐNG</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Quản lý và tùy chỉnh các thiết lập của EZ-Home</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        onClick={handleReset}
                        className="btn-soft-blue flex items-center justify-center gap-2 text-sm font-bold h-10 sm:h-11 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all hover:opacity-80 active:scale-95 flex-1 sm:flex-none"
                    >
                        <RotateCcw size={18} />
                        <span className="whitespace-nowrap">Khôi phục</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn-soft-blue flex items-center justify-center gap-2 text-sm font-bold h-10 sm:h-11 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all hover:opacity-80 active:scale-95 flex-1 sm:flex-none"
                    >
                        <Download size={18} />
                        <span className="whitespace-nowrap">Export</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-premium-blue flex items-center justify-center gap-2 text-sm font-bold h-10 sm:h-11 px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span className="whitespace-nowrap">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                    </button>
                </div>
            </div>

            {saved && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 text-green-600 rounded-2xl border border-green-500/20 animate-scaleIn">
                    <CheckCircle size={20} />
                    <span className="text-sm font-bold">Cài đặt đã được cập nhật thành công!</span>
                </div>
            )}

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Navigation */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[var(--bg-primary)] rounded-2xl p-2 border border-[var(--border-primary)] shadow-sm flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar gap-1 custom-scrollbar">
                        {categories.map(cat => {
                            const Icon = cat.icon
                            const isActive = activeTab === cat.key
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveTab(cat.key)}
                                    className={`
                                        flex items-center justify-between px-4 py-2.5 lg:py-3 rounded-xl transition-all duration-200 group whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink
                                        ${isActive
                                            ? 'bg-[var(--accent-blue)] text-white shadow-md'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className={isActive ? 'text-white' : 'text-[var(--accent-blue)]'} />
                                        <span className="text-sm font-bold">{cat.label}</span>
                                    </div>
                                    {isActive && <ChevronRight size={14} className="opacity-50 hidden lg:block" />}
                                </button>
                            )
                        })}
                    </div>

                    <div className="p-4 bg-[var(--bg-tertiary)]/50 rounded-2xl border border-[var(--border-primary)] flex items-start gap-3">
                        <Info size={18} className="text-[var(--accent-blue)] shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--text-secondary)] leading-tight font-medium">
                            Các thay đổi sẽ được áp dụng ngay lập tức cho tất cả người dùng sau khi lưu.
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] shadow-sm overflow-hidden min-h-[500px]">
                        {/* Tab Title */}
                        <div className="px-6 py-5 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                                {categories.find(c => c.key === activeTab)?.label}
                            </h2>
                            <p className="text-xs text-[var(--text-tertiary)] font-medium mt-0.5">
                                {categories.find(c => c.key === activeTab)?.description}
                            </p>
                        </div>

                        {/* List */}
                        <div className="divide-y divide-[var(--border-primary)]">
                            {filteredSettings.map(setting => {
                                const Icon = setting.icon
                                const value = settings[setting.key] ?? setting.value
                                const isToggle = value === 'true' || value === 'false'

                                return (
                                    <div
                                        key={setting.key}
                                        className="px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-tertiary)]/10 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--accent-blue)] shrink-0">
                                                <Icon size={20} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                                                    {setting.label}
                                                </h3>
                                                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed max-w-md font-medium">
                                                    {setting.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-64">
                                            {isToggle ? (
                                                <div className="flex items-center justify-end">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={value === 'true'}
                                                            onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.checked ? 'true' : 'false' }))}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="relative w-12 h-6 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-blue)] peer-checked:border-[var(--accent-blue)] shadow-inner"></div>
                                                    </label>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                                                    className="input w-full focus:ring-2 focus:ring-[var(--accent-blue)]/10 text-sm font-medium h-10 px-4"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out forwards;
                }
                .btn-premium-blue {
                    background-color: #3b82f6;
                    color: white;
                }
                .btn-soft-blue {
                    background-color: rgba(59, 130, 246, 0.08);
                    color: #3b82f6;
                }
                .dark .btn-soft-blue {
                    background-color: rgba(59, 130, 246, 0.15);
                    color: #60a5fa;
                }
            `}</style>
        </div>
    )
}
