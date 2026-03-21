'use client'

import React from 'react'
import Image from 'next/image'

// Loading style types
type LoadingStyle = 'spinner' | 'pulse' | 'dots' | 'wave' | 'progress' | 'bars' | 'dual-ring'

type LoadingColor = 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'gradient'

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
    fullScreen?: boolean
    className?: string
    style?: LoadingStyle
    color?: LoadingColor
}

// Size configurations - synced with website design
const sizeMap = {
    sm: {
        spinner: 'w-4 h-4',
        pulse: 'w-6 h-6',
        dots: 'w-3 h-3',
        wave: 'w-1 h-4',
        progress: 'w-16 h-1',
        bars: 'w-8 h-6',
        dualRing: 'w-6 h-6',
        textSize: 'text-xs'
    },
    md: {
        spinner: 'w-6 h-6',
        pulse: 'w-10 h-10',
        dots: 'w-3 h-3',
        wave: 'w-2 h-6',
        progress: 'w-32 h-1.5',
        bars: 'w-12 h-8',
        dualRing: 'w-10 h-10',
        textSize: 'text-sm'
    },
    lg: {
        spinner: 'w-8 h-8',
        pulse: 'w-14 h-14',
        dots: 'w-4 h-4',
        wave: 'w-2 h-8',
        progress: 'w-48 h-2',
        bars: 'w-16 h-10',
        dualRing: 'w-14 h-14',
        textSize: 'text-base'
    },
    xl: {
        spinner: 'w-10 h-10',
        pulse: 'w-20 h-20',
        dots: 'w-5 h-5',
        wave: 'w-3 h-10',
        progress: 'w-64 h-2.5',
        bars: 'w-20 h-12',
        dualRing: 'w-20 h-20',
        textSize: 'text-lg'
    },
}

// Website color scheme - synced with globals.css
const colorMap = {
    blue: {
        light: '#60a5fa',
        DEFAULT: '#3b82f6',
        dark: '#2563eb',
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        ring: 'ring-blue-500/30'
    },
    purple: {
        light: '#a78bfa',
        DEFAULT: '#8b5cf6',
        dark: '#7c3aed',
        bg: 'bg-purple-500',
        text: 'text-purple-500',
        ring: 'ring-purple-500/30'
    },
    green: {
        light: '#34d399',
        DEFAULT: '#10b981',
        dark: '#059669',
        bg: 'bg-green-500',
        text: 'text-green-500',
        ring: 'ring-green-500/30'
    },
    red: {
        light: '#f87171',
        DEFAULT: '#ef4444',
        dark: '#dc2626',
        bg: 'bg-red-500',
        text: 'text-red-500',
        ring: 'ring-red-500/30'
    },
    orange: {
        light: '#fbbf24',
        DEFAULT: '#f59e0b',
        dark: '#d97706',
        bg: 'bg-orange-500',
        text: 'text-orange-500',
        ring: 'ring-orange-500/30'
    },
    gradient: {
        light: '#60a5fa',
        DEFAULT: '#8b5cf6',
        dark: '#7c3aed',
        bg: 'bg-gradient-to-r from-blue-400 to-purple-500',
        text: 'text-gradient bg-clip-text text-transparent',
        ring: 'ring-purple-500/30'
    }
}

// Spinner Animation
function SpinnerLoader({ size, color }: { size: string; color: LoadingColor }) {
    const c = colorMap[color]
    return (
        <svg
            className={`${size} animate-spin`}
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: c.DEFAULT }}
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    )
}

// Dual Ring Animation
function DualRingLoader({ size, color }: { size: string; color: LoadingColor }) {
    const c = colorMap[color]
    return (
        <div
            className={`${size} rounded-full border-2 border-transparent animate-spin`}
            style={{
                borderTopColor: c.DEFAULT,
                borderRightColor: c.light,
                animationDirection: 'reverse'
            }}
        />
    )
}

// Pulse Animation
function PulseLoader({ size, color }: { size: string; color: LoadingColor }) {
    const c = colorMap[color]
    return (
        <div className={`${size} relative`}>
            <div
                className="absolute inset-0 rounded-full animate-ping opacity-75"
                style={{ backgroundColor: c.DEFAULT }}
            />
            <div
                className="absolute inset-1 rounded-full animate-pulse"
                style={{ backgroundColor: c.DEFAULT }}
            />
            <div
                className="absolute inset-2 rounded-full"
                style={{ backgroundColor: c.light }}
            />
        </div>
    )
}

// Dots Animation - Bouncing dots
function DotsLoader({ size, color }: { size: string; color: LoadingColor }) {
    const c = colorMap[color]
    return (
        <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className={`${size} rounded-full animate-bounce`}
                    style={{
                        backgroundColor: c.DEFAULT,
                        animationDelay: `${i * 150}ms`
                    }}
                />
            ))}
        </div>
    )
}

// Wave Animation - Similar to typing indicator
function WaveLoader({ size, color }: { size: string; color: LoadingColor }) {
    const c = colorMap[color]
    return (
        <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="w-1 rounded-full animate-wave"
                    style={{
                        height: size,
                        backgroundColor: c.DEFAULT,
                        animationDelay: `${i * 100}ms`
                    }}
                />
            ))}
        </div>
    )
}

// Progress Bar Animation - New style!
function ProgressLoader({ size, color }: { size: string; color: LoadingColor }) {
    const c = colorMap[color]
    return (
        <div className={`${size} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
            <div
                className="h-full rounded-full animate-progress-loading"
                style={{
                    backgroundColor: c.DEFAULT,
                    backgroundImage: color === 'gradient'
                        ? 'linear-gradient(90deg, #60a5fa 0%, #8b5cf6 50%, #60a5fa 100%)'
                        : 'none'
                }}
            />
        </div>
    )
}

// Bars Animation - Equalizer style
function BarsLoader({ size, color }: { size: string; color: LoadingColor }) {
    const c = colorMap[color]
    return (
        <div className="flex items-end gap-1 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="w-1.5 rounded-t animate-equalizer"
                    style={{
                        height: '60%',
                        backgroundColor: c.DEFAULT,
                        animationDelay: `${i * 80}ms`
                    }}
                />
            ))}
        </div>
    )
}

// Main Loading Component
export default function Loading({
    size = 'md',
    text = 'Đang tải...',
    fullScreen = false,
    className = '',
    style = 'spinner',
    color = 'blue'
}: LoadingProps) {
    const sizes = sizeMap[size]
    const c = colorMap[color]

    const getLoader = () => {
        switch (style) {
            case 'spinner':
                return <SpinnerLoader size={sizes.spinner} color={color} />
            case 'dual-ring':
                return <DualRingLoader size={sizes.dualRing} color={color} />
            case 'pulse':
                return <PulseLoader size={sizes.pulse} color={color} />
            case 'dots':
                return <DotsLoader size={sizes.dots} color={color} />
            case 'wave':
                return <WaveLoader size={sizes.wave} color={color} />
            case 'progress':
                return <ProgressLoader size={sizes.progress} color={color} />
            case 'bars':
                return <BarsLoader size={sizes.bars} color={color} />
            default:
                return <SpinnerLoader size={sizes.spinner} color={color} />
        }
    }

    const LoadingContent = () => (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            {getLoader()}
            {text && (
                <p className={`${sizes.textSize} text-slate-500 dark:text-slate-400 font-medium animate-pulse`}>
                    {text}
                </p>
            )}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
                <LoadingContent />
            </div>
        )
    }

    return <LoadingContent />
}

// Simple spinner for inline use (like in buttons)
export function LoadingSpinner({ size = 18, className = '' }: { size?: number; className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

// Simple dots for inline use
export function LoadingDots({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    )
}

// Wave/typing style loader
export function LoadingWave({ className = '', color = 'blue' }: { className?: string; color?: LoadingColor }) {
    const c = colorMap[color]
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-1.5 rounded-full animate-wave"
                    style={{
                        height: '1rem',
                        backgroundColor: c.DEFAULT,
                        animationDelay: `${i * 150}ms`
                    }}
                />
            ))}
        </div>
    )
}

// Page loading overlay with gradient colors
export function PageLoader({ text = 'Đang tải...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-900">
            <div className="flex flex-col items-center gap-6">
                {/* Logo with gradient */}
                <div className="relative">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 overflow-hidden">
                        <Image
                            src="/logo_final.png"
                            alt="Logo"
                            width={64}
                            height={64}
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Progress Bar Loading */}
                <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-progress-loading" />
                </div>

                {/* Text */}
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>
            </div>

        </div>
    )
}

// Card loading skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse space-y-4 ${className}`}>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
    )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </td>
            ))}
        </tr>
    )
}

// Button loading state
export function ButtonLoader({ className = '' }: { className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

// Progress bar only (without text)
export function ProgressBar({
    progress = 0,
    color = 'blue',
    showLabel = false,
    className = ''
}: {
    progress?: number;
    color?: LoadingColor;
    showLabel?: boolean;
    className?: string;
}) {
    const c = colorMap[color]
    const percentage = Math.min(100, Math.max(0, progress))

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tiến trình</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{percentage}%</span>
                </div>
            )}
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: c.DEFAULT
                    }}
                />
            </div>
        </div>
    )
}

// Circular progress
export function CircularProgress({
    progress = 0,
    size = 48,
    color = 'blue',
    strokeWidth = 4,
    showLabel = true,
    className = ''
}: {
    progress?: number;
    size?: number;
    color?: LoadingColor;
    strokeWidth?: number;
    showLabel?: boolean;
    className?: string;
}) {
    const c = colorMap[color]
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={c.DEFAULT}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                />
            </svg>
            {showLabel && (
                <span className="absolute text-xs font-bold" style={{ color: c.DEFAULT }}>
                    {Math.round(progress)}%
                </span>
            )}
        </div>
    )
}
