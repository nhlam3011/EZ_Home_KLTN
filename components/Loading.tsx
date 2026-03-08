'use client'

import React from 'react'

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
    fullScreen?: boolean
    className?: string
}

// Cấu hình kích thước tương ứng cho hiệu ứng sóng nước
const sizeMap = {
    sm: { width: '32px', text: 'text-xs' },
    md: { width: '48px', text: 'text-sm' },
    lg: { width: '64px', text: 'text-base' },
    xl: { width: '96px', text: 'text-lg' },
}

export default function Loading({
    size = 'md',
    text = 'Đang tải...',
    fullScreen = false,
    className = ''
}: LoadingProps) {
    const sizes = sizeMap[size]

    const LoadingContent = () => (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            {/* Inject CSS trực tiếp để không cần sửa file globals.css */}
            <style>{`
                .liquid-loader {
                    --r1: 154%;
                    --r2: 68.5%;
                    aspect-ratio: 1;
                    border-radius: 50%;
                    background:
                        radial-gradient(var(--r1) var(--r2) at top, #0000 79.5%, #3b82f6 80%),
                        radial-gradient(var(--r1) var(--r2) at bottom, #3b82f6 79.5%, #0000 80%),
                        radial-gradient(var(--r1) var(--r2) at top, #0000 79.5%, #3b82f6 80%),
                        #e2e8f0; /* Chuyển màu nền từ #ccc sang màu xám nhạt của Tailwind cho hiện đại hơn */
                    background-size: 50.5% 220%;
                    background-position: -100% 0%, 0% 0%, 100% 0%;
                    background-repeat: no-repeat;
                    animation: l9 2s infinite linear;
                }
                @keyframes l9 {
                    33%  {background-position:    0% 33% ,100% 33% ,200% 33% }
                    66%  {background-position: -100%  66%,0%   66% ,100% 66% }
                    100% {background-position:    0% 100%,100% 100%,200% 100%}
                }
            `}</style>

            {/* Khối Loader chính */}
            <div
                className="liquid-loader shadow-sm"
                style={{ width: sizes.width }} // Ghi đè width từ sizeMap
            ></div>

            {/* Loading text */}
            {text && (
                <p className={`${sizes.text} text-slate-500 font-medium animate-pulse`}>
                    {text}
                </p>
            )}
        </div>
    )

    // Layout khi bật chế độ toàn màn hình
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
                <LoadingContent />
            </div>
        )
    }

    return <LoadingContent />
}

// Các sub-components khác (nếu bạn vẫn dùng ở những chỗ nhỏ hẹp)
export function LoadingSpinner({ size = 18, className = '' }: { size?: number; className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

export function LoadingDots({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    )
}