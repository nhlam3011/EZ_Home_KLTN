'use client'

import { useState } from 'react'
import {
    Clock, Heart, MessageCircle, Share2, MoreHorizontal,
    CheckCircle, XCircle, Trash2, Image as ImageIcon,
    Megaphone, MessageSquare, Heart as HeartIcon, Bookmark
} from 'lucide-react'

interface Post {
    id: number
    content: string
    images: string[]
    category: 'ANNOUNCEMENT' | 'DISCUSSION' | 'FEEDBACK' | 'MARKET'
    status?: string
    createdAt: Date
    user: {
        id?: number
        fullName: string
        avatarUrl?: string
        contracts?: { room: { name: string } }[]
    }
    likes?: number
    comments?: number
}

interface CommunityPostCardProps {
    post: Post
    showCategory?: 'icon' | 'text' | 'both'
    showStatus?: boolean
    onApprove?: (id: number) => void
    onReject?: (id: number) => void
    onDelete?: (id: number) => void
    onViewDetail?: (post: Post) => void
    variant?: 'tenant' | 'admin'
    isModeration?: boolean
}

const CATEGORY_THEMES = {
    ANNOUNCEMENT: {
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        icon: Megaphone,
        label: 'Thông báo',
        gradient: 'from-orange-500 to-amber-500'
    },
    DISCUSSION: {
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        icon: MessageSquare,
        label: 'Thảo luận',
        gradient: 'from-blue-500 to-indigo-500'
    },
    FEEDBACK: {
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-500/10',
        icon: HeartIcon,
        label: 'Góp ý',
        gradient: 'from-red-500 to-rose-500'
    },
    MARKET: {
        color: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-500/10',
        icon: Bookmark,
        label: 'Mua bán',
        gradient: 'from-green-500 to-emerald-500'
    }
}

const STATUS_BADGES = {
    PENDING: { label: 'Chờ duyệt', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
    PUBLIC: { label: 'Đã duyệt', bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400' },
    REJECTED: { label: 'Từ chối', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' }
}

export default function CommunityPostCard({
    post,
    showCategory = 'both',
    showStatus = false,
    onApprove,
    onReject,
    onDelete,
    onViewDetail,
    variant = 'tenant',
    isModeration = false
}: CommunityPostCardProps) {
    const [isLiked, setIsLiked] = useState(false)

    const initials = post.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const categoryTheme = CATEGORY_THEMES[post.category] || CATEGORY_THEMES.DISCUSSION
    const StatusIcon = categoryTheme.icon
    const isPinned = post.content.startsWith('📌')
    const statusBadge = post.status ? STATUS_BADGES[post.status as keyof typeof STATUS_BADGES] : null

    const formatRelativeTime = (date: Date | string) => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days} ngày trước`
        if (hours > 0) return `${hours} giờ trước`
        return 'Vừa xong'
    }

    return (
        <article className="group bg-primary rounded-3xl border border-primary shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 overflow-hidden">
            {isPinned && (
                <div className="bg-gradient-to-r from-orange-400 to-amber-500 h-1 w-full" />
            )}

            <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                {post.user.avatarUrl ? (
                                    <img src={post.user.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <span className="text-white font-black text-sm sm:text-base">{initials}</span>
                                )}
                            </div>
                            {/* Category Icon Badge */}
                            {(showCategory === 'icon' || showCategory === 'both') && (
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg ${categoryTheme.bg} border-2 border-white dark:border-slate-800 flex items-center justify-center`}>
                                    <StatusIcon className={categoryTheme.color} size={10} />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-primary text-sm sm:text-base truncate tracking-tight">
                                    {post.user.fullName}
                                </h3>
                                {/* Status Badge */}
                                {showStatus && statusBadge && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadge.bg} ${statusBadge.text}`}>
                                        {statusBadge.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {post.user.contracts?.[0]?.room?.name && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-tertiary text-secondary px-2 py-0.5 rounded-lg border border-primary">
                                        {post.user.contracts[0].room.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-[11px] text-tertiary font-medium">
                                    <Clock size={12} className="opacity-70" />
                                    {formatRelativeTime(post.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {!isModeration && onDelete && (
                            <button
                                onClick={() => onDelete?.(post.id)}
                                className="w-9 h-9 flex items-center justify-center text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                title="Xóa"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        {!isModeration && (
                            <button className="w-9 h-9 flex items-center justify-center text-tertiary hover:bg-tertiary rounded-xl transition-all">
                                <MoreHorizontal size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Label */}
                {showCategory === 'text' && (
                    <div className="mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${categoryTheme.bg} ${categoryTheme.color}`}>
                            <StatusIcon size={12} />
                            {categoryTheme.label}
                        </span>
                    </div>
                )}

                {/* Content - Hidden in main moderation grid to save space, shown in detail */}
                {!isModeration && (
                    <div className="relative">
                        <p className="text-secondary text-lg sm:text-lg leading-relaxed mb-4 whitespace-pre-wrap font-medium">
                            {isPinned ? post.content.replace(/^📌\s*/, '') : post.content}
                        </p>
                    </div>
                )}

                {/* Images - Hidden in main moderation grid */}
                {!isModeration && post.images && post.images.length > 0 && (
                    <div className="mb-4 -mx-4 sm:mx-0 overflow-hidden sm:rounded-xl">
                        <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.images.slice(0, 4).map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`relative bg-tertiary ${post.images.length === 1 ? 'w-full' : (post.images.length === 3 && idx === 0 ? 'row-span-2' : 'aspect-video')}`}
                                >
                                    <img
                                        src={img}
                                        alt=""
                                        className={`w-full h-full object-cover ${post.images.length === 1 ? 'object-contain max-h-[500px] bg-black/5 dark:bg-black/20' : ''}`}
                                    />
                                    {idx === 3 && post.images.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-bold">+{post.images.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-center pt-4 border-t border-primary">
                    <div className="flex items-center gap-2">
                        {isModeration ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onApprove?.(post.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-green-600 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 transition-all border border-green-200 dark:border-green-500/20 shadow-sm"
                                    title="Duyệt"
                                >
                                    <CheckCircle size={18} />
                                </button>
                                <button
                                    onClick={() => onReject?.(post.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 transition-all border border-amber-200 dark:border-amber-500/20 shadow-sm"
                                    title="Từ chối"
                                >
                                    <XCircle size={18} />
                                </button>
                                <button
                                    onClick={() => onDelete?.(post.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all border border-red-200 dark:border-red-500/20 shadow-sm"
                                    title="Xóa"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => onViewDetail?.(post)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--accent-blue)] bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 transition-all border border-blue-200 dark:border-blue-500/20 shadow-sm"
                                    title="Chi tiết"
                                >
                                    <ImageIcon size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsLiked(!isLiked)}
                                    className={`flex justify-center items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95 ${isLiked
                                        ? 'text-red-500 bg-red-50 dark:bg-red-500/10 shadow-inner'
                                        : 'text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                        }`}
                                >
                                    <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                                    <span>{post.likes || 0}</span>
                                </button>
                                {!isModeration && (
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-tertiary hover:text-[var(--accent-blue)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95 font-bold">
                                        <MessageCircle size={18} />
                                        <span>{post.comments || 0}</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {!isModeration && (
                        <button className="flex items-center justify-center w-10 h-10 text-tertiary hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl transition-all active:scale-90">
                            <Share2 size={18} />
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}

