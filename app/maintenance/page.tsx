'use client'

import Image from 'next/image'
import { ShieldAlert, Clock, Phone, Mail } from 'lucide-react'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-[var(--bg-primary)] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-[var(--border-primary)] text-center animate-fadeIn">
                {/* Icon Section */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <ShieldAlert size={48} className="text-white" />
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
                    Hệ thống đang bảo trì
                </h1>
                <p className="text-[var(--text-secondary)] text-lg mb-8 leading-relaxed">
                    EZ-Home đang được nâng cấp để mang lại trải nghiệm tốt hơn cho bạn.
                    Chúng tôi sẽ quay lại trong giây lát!
                </p>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
                    <div className="p-4 bg-[var(--bg-tertiary)]/50 rounded-2xl border border-[var(--border-primary)] flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Dự kiến</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">Sẽ sớm hoàn tất</p>
                        </div>
                    </div>
                    <div className="p-4 bg-[var(--bg-tertiary)]/50 rounded-2xl border border-[var(--border-primary)] flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Hỗ trợ</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">admin@ezhome.vn</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                        <Phone size={16} />
                        <span className="text-sm font-medium">090 123 4567</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-primary)] hidden md:block"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white p-1 border border-gray-100 shadow-sm">
                            <Image
                                src="/logo_final.png"
                                alt="Logo"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                        <span className="text-sm font-bold text-[var(--text-primary)]">EZ-Home Management</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    )
}
