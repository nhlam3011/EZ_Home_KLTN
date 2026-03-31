'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
    Clock, Heart, MessageCircle, Share2, MoreHorizontal,
    CheckCircle, XCircle, Trash2, Image as ImageIcon,
    Megaphone, MessageSquare, Heart as HeartIcon, Bookmark,
    Smile, Edit3, Send, X, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react'
import dynamic from 'next/dynamic'
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })
import { Theme, EmojiStyle } from 'emoji-picker-react'
import { EmojiText } from '@/components/EmojiText'
import { EmojiInput } from '@/components/EmojiInput'
import { useDarkMode } from '@/app/contexts/DarkModeContext'

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
    isLiked?: boolean
}

interface CommunityPostCardProps {
    post: Post
    showCategory?: 'icon' | 'text' | 'both'
    showStatus?: boolean
    onApprove?: (id: number) => void
    onReject?: (id: number) => void
    onDelete?: (id: number) => void
    onEdit?: (post: Post) => void
    onViewDetail?: (post: Post) => void
    variant?: 'tenant' | 'admin'
    isModeration?: boolean
    defaultShowComments?: boolean
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

const REACTION_ICONS: Record<string, string> = {
    LIKE: '👍', LOVE: '❤️', CARE: '🥰', HAHA: '😆', WOW: '😮', SAD: '😢', ANGRY: '😡'
}
const REACTION_COLORS: Record<string, string> = {
    LIKE: 'text-blue-500', LOVE: 'text-red-500', CARE: 'text-yellow-500', HAHA: 'text-yellow-500',
    WOW: 'text-yellow-500', SAD: 'text-orange-500', ANGRY: 'text-orange-600'
}
const REACTION_LABELS: Record<string, string> = {
    LIKE: 'Thích', LOVE: 'Yêu thích', CARE: 'Thương thương', HAHA: 'Haha',
    WOW: 'Wow', SAD: 'Buồn', ANGRY: 'Phẫn nộ'
}

function CommentItem({
    comment, currentUser, post, onReply, editingCommentId,
    setEditingCommentId, editContent, setEditContent, saveEditComment,
    activeDropdownId, setActiveDropdownId, handleDeleteComment,
    toggleReaction, formatRelativeTime,
    onImageClick, isReply = false, variant
}: {
    comment: any, currentUser: any, post: any, onReply: (c: any) => void,
    editingCommentId: number | null, setEditingCommentId: (id: number | null) => void,
    editContent: string, setEditContent: (c: string) => void,
    saveEditComment: (id: number) => void,
    activeDropdownId: number | null, setActiveDropdownId: (id: number | null) => void,
    handleDeleteComment: (id: number) => void,
    toggleReaction: (id: number, type: string) => void,
    formatRelativeTime: (d: any) => string,
    onImageClick: (url: string) => void,
    isReply?: boolean,
    variant?: 'tenant' | 'admin'
}) {
    const [showReactionPicker, setShowReactionPicker] = useState(false)
    const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null)
    const reactionPickerRef = useRef<HTMLDivElement>(null)
    const reactionBtnRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)
                && reactionBtnRef.current && !reactionBtnRef.current.contains(event.target as Node)) {
                setShowReactionPicker(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleToggleReactionPicker = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!showReactionPicker && reactionBtnRef.current) {
            const rect = reactionBtnRef.current.getBoundingClientRect()
            const windowWidth = window.innerWidth
            // Determine the ideal left position (centered over the button)
            let leftPos = rect.left + rect.width / 2

            // Adjust for mobile screens (e.g. max width 400px, popover is ~280px wide)
            // Left boundary check
            if (leftPos < 150) {
                leftPos = 150
            }

            // Right boundary check
            if (leftPos > windowWidth - 150) {
                leftPos = windowWidth - 150
            }

            setPickerPos({
                top: rect.top,
                left: leftPos,
            })
        }
        setShowReactionPicker(prev => !prev)
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    const isOwner = String(currentUser?.id) === String(comment.userId)
    const canDelete = isOwner || currentUser?.id === post.user.id || currentUser?.role === 'ADMIN' || variant === 'admin'
    return (
        <div className={`flex gap-2 sm:gap-3 group/comment relative ${isReply ? 'mt-3' : ''} min-w-0`}>
            <div className={`${isReply ? 'w-8 h-8 sm:w-8 sm:h-8' : 'w-9 h-9 sm:w-10 sm:h-10'} rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm`}>
                {comment.user.avatarUrl ? (
                    <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-white text-[12px] sm:text-[14px]">
                        {comment.user.fullName
                            ? (comment.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase())
                            : (comment.user.role === 'ADMIN' ? 'QT' : 'U')}
                    </span>
                )}
            </div>
            <div className="flex-1 relative min-w-0">
                <div className="flex items-center group/bubble min-w-0">
                    {editingCommentId === comment.id ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 shadow-sm border border-[var(--accent-blue)] w-full">
                            <textarea
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), saveEditComment(comment.id))}
                                className="w-full bg-transparent text-sm focus:outline-none resize-none overflow-hidden"
                                rows={1}
                            />
                            <div className="flex items-center justify-end gap-2 mt-2">
                                <button onClick={() => setEditingCommentId(null)} className="text-xs text-tertiary hover:underline">Hủy</button>
                                <button onClick={() => saveEditComment(comment.id)} className="text-xs text-[var(--accent-blue)] font-bold hover:underline">Lưu</button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-full">
                            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-3.5 py-2 inline-block relative border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors shadow-sm min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[13px] font-bold text-primary leading-tight hover:underline cursor-pointer">{comment.user.fullName}</h4>
                                    {comment.user.contracts?.[0]?.room?.name && (
                                        <span className="text-[9px] font-bold uppercase bg-white/60 dark:bg-slate-700 px-1.5 py-[0.5px] rounded border border-primary/5 text-secondary">
                                            {comment.user.contracts[0].room.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[13px] sm:text-[14px] text-primary mt-1 whitespace-pre-wrap break-words leading-snug">
                                    <EmojiText text={comment.content} />
                                </p>
                            </div>

                            {comment.imageUrl && (
                                <div
                                    className="mt-2 ml-1 group/img relative block cursor-pointer"
                                    onClick={() => onImageClick(comment.imageUrl)}
                                >
                                    <img src={comment.imageUrl} alt="Đính kèm" className="rounded-2xl max-h-64 sm:max-h-80 w-auto max-w-full object-cover border border-primary/10 shadow-sm transition-transform hover:scale-[1.01]" />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors rounded-2xl" />
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 sm:gap-3 mt-1.5 ml-0.5 sm:ml-1 text-[11px] sm:text-[12px] text-tertiary font-bold relative flex-nowrap min-w-0">
                                <span className="font-medium opacity-70 tracking-tight">{formatRelativeTime(comment.createdAt)}</span>
                                {editingCommentId !== comment.id && (() => {
                                    const userReaction = comment.reactions?.find((r: any) => r.userId === currentUser?.id);
                                    const label = userReaction ? REACTION_LABELS[userReaction.type] || 'Thích' : 'Thích';
                                    const colorClass = userReaction ? REACTION_COLORS[userReaction.type] || 'text-[var(--accent-blue)]' : '';

                                    return (
                                        <div className="relative">
                                            <button
                                                ref={reactionBtnRef}
                                                onClick={handleToggleReactionPicker}
                                                className={`hover:underline transition-colors whitespace-nowrap px-0.5 ${colorClass}`}
                                            >
                                                {label}
                                            </button>

                                            {showReactionPicker && pickerPos && mounted && (
                                                <div
                                                    ref={reactionPickerRef}
                                                    className="fixed z-[300]"
                                                    style={{
                                                        top: pickerPos.top - 64,
                                                        left: pickerPos.left,
                                                        transform: 'translateX(-50%)',
                                                    }}
                                                >
                                                    <div
                                                        className="bg-white dark:bg-slate-800 rounded-full shadow-[0_8px_40px_rgb(0,0,0,0.18)] border border-slate-200/80 dark:border-slate-700 px-2 py-1.5 flex items-center"
                                                        style={{ animation: 'reactionPickerIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards', transformOrigin: 'bottom center' }}
                                                    >
                                                        {Object.entries(REACTION_ICONS).map(([type, icon], i) => (
                                                            <button
                                                                key={type}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleReaction(comment.id, type);
                                                                    setShowReactionPicker(false);
                                                                }}
                                                                title={REACTION_LABELS[type]}
                                                                className="relative group/reactionbtn"
                                                                style={{
                                                                    animation: `reactionEmojiIn 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 35}ms both`,
                                                                }}
                                                            >
                                                                <span className="flex items-center justify-center w-9 h-9 transition-all duration-200 group-hover/reactionbtn:scale-[1.4] group-hover/reactionbtn:-translate-y-2 rounded-full">
                                                                    <EmojiText text={icon} emojiSize={26} />
                                                                </span>
                                                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-slate-800 rounded px-1 py-0.5 shadow opacity-0 group-hover/reactionbtn:opacity-100 transition-opacity pointer-events-none">
                                                                    {REACTION_LABELS[type]}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                <button
                                    onClick={() => onReply(comment)}
                                    className="hover:underline transition-colors whitespace-nowrap"
                                >
                                    Trả lời
                                </button>

                                {comment.reactions?.length > 0 && (() => {
                                    const reactionTypes = Array.from(new Set(comment.reactions.map((r: any) => r.type)));
                                    const topTypes = reactionTypes.slice(0, 3);
                                    return (
                                        <div className="flex items-center justify-center gap-1.5 ml-0.5 sm:ml-1 bg-white dark:bg-slate-800/50 rounded-full h-[22px] px-2 shadow-sm border border-primary/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group/reaction flex-shrink-0">
                                            <div className="flex -space-x-1 items-center justify-center">
                                                {topTypes.map((type: any, i) => (
                                                    <span key={type} className="flex items-center justify-center relative" style={{ zIndex: 10 - i }}>
                                                        <EmojiText text={REACTION_ICONS[type] || '👍'} emojiSize={16} />
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[12px] font-bold text-secondary group-hover/reaction:text-primary transition-colors flex items-center justify-center mt-[1px]" style={{ lineHeight: 1 }}>{comment.reactions.length}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {canDelete && editingCommentId !== comment.id && (
                        <div className="opacity-100 sm:opacity-0 sm:group-hover/comment:opacity-100 focus-within:opacity-100 transition-opacity ml-1 self-center relative z-20">
                            <button
                                onClick={() => setActiveDropdownId(activeDropdownId === comment.id ? null : comment.id)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-tertiary"
                            >
                                <MoreHorizontal size={14} />
                            </button>

                            {/* Desktop Dropdown */}
                            {activeDropdownId === comment.id && (
                                <div className="hidden sm:flex absolute left-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-primary overflow-hidden z-[100] flex-col text-sm">
                                    {isOwner && (
                                        <button
                                            onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); setActiveDropdownId(null); }}
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-tertiary text-left text-secondary"
                                        >
                                            <Edit3 size={14} /> Chỉnh sửa
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-left text-red-500"
                                    >
                                        <Trash2 size={14} /> Xóa
                                    </button>
                                </div>
                            )}

                            {/* Mobile Action Sheet (Bottom Sheet) */}
                            {mounted && activeDropdownId === comment.id && createPortal(
                                <div className="sm:hidden fixed inset-0 z-[3000] flex items-end justify-center animate-in fade-in duration-300">
                                    <div
                                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                                        onClick={() => setActiveDropdownId(null)}
                                    />
                                    <div className="relative w-full bg-primary rounded-t-[2.5rem] shadow-2xl border-t border-primary p-6 pb-10 flex flex-col gap-3 animate-in slide-in-from-bottom-full duration-500">
                                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 opacity-50" />

                                        <div className="text-center mb-2">
                                            <p className="text-xs font-bold text-tertiary uppercase tracking-widest">Hành động bình luận</p>
                                        </div>

                                        {isOwner && (
                                            <button
                                                onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); setActiveDropdownId(null); }}
                                                className="flex items-center gap-3 w-full h-11 px-5 rounded-2xl bg-tertiary text-primary font-bold text-sm active:scale-[0.98] transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                                                    <Edit3 size={16} />
                                                </div>
                                                Chỉnh sửa bình luận
                                            </button>
                                        )}

                                        <button
                                            onClick={() => { handleDeleteComment(comment.id); setActiveDropdownId(null); }}
                                            className="flex items-center gap-3 w-full h-11 px-5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 font-bold text-sm active:scale-[0.98] transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                                <Trash2 size={16} />
                                            </div>
                                            Xóa bình luận
                                        </button>

                                        <button
                                            onClick={() => setActiveDropdownId(null)}
                                            className="mt-1 w-full h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm active:scale-[0.98] transition-all"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CommunityPostCard({
    post,
    showCategory = 'both',
    showStatus = false,
    onApprove,
    onReject,
    onDelete,
    onEdit,
    onViewDetail,
    variant = 'tenant',
    isModeration = false,
    defaultShowComments = false,
}: CommunityPostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLiked || false)
    const [likesCount, setLikesCount] = useState(post.likes || 0)
    const [commentsCount, setCommentsCount] = useState(post.comments || 0)
    const [showComments, setShowComments] = useState(defaultShowComments)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(false)
    const [postingComment, setPostingComment] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Facebook style features
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [commentImage, setCommentImage] = useState<File | null>(null)
    const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null)
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
    const [editContent, setEditContent] = useState('')
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)
    const [postDropdownOpen, setPostDropdownOpen] = useState(false)
    const [replyingTo, setReplyingTo] = useState<{ id: number, fullName: string } | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const { isDark } = useDarkMode()
    const pickerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '40px'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [newComment])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr))
            } catch (e) {
                console.error('Error parsing user from storage', e)
            }
        }
    }, [])

    useEffect(() => {
        setIsLiked(post.isLiked || false)
        setLikesCount(post.likes || 0)
        setCommentsCount(post.comments || 0)
    }, [post.isLiked, post.likes, post.comments])

    const handleLike = async () => {
        // Optimistic update
        const previousIsLiked = isLiked
        const previousLikesCount = likesCount

        setIsLiked(!previousIsLiked)
        setLikesCount(prev => previousIsLiked ? prev - 1 : prev + 1)

        try {
            const res = await fetch(`/api/tenant/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser?.id })
            })
            if (!res.ok) {
                // Revert
                setIsLiked(previousIsLiked)
                setLikesCount(previousLikesCount)
            } else {
                const data = await res.json()
                setIsLiked(data.liked)
            }
        } catch (error) {
            console.error('Like error:', error)
            setIsLiked(previousIsLiked)
            setLikesCount(previousLikesCount)
        }
    }

    const fetchComments = async (isSilent = false) => {
        if (!isSilent) setLoadingComments(true)
        try {
            // Use a reasonable limit for initial load (e.g., 50)
            const res = await fetch(`/api/tenant/posts/${post.id}/comments?limit=50`)
            if (res.ok) {
                const data = await res.json()
                setComments(data)
            }
        } catch (error) {
            console.error('Fetch comments error:', error)
        } finally {
            if (!isSilent) setLoadingComments(false)
        }
    }

    useEffect(() => {
        const handleCommunityEvent = (e: any) => {
            const { type, data } = e.detail

            // If this post was updated or a comment was added, refresh comments if open
            if ((type === 'POST_UPDATED' || type === 'COMMENT_UPDATED' || type === 'COMMENT_CREATED') &&
                data.postId === post.id) {

                // If comments are open, refresh them
                if (showComments) {
                    fetchComments(true)
                }

                // If it's a new comment, increment count locally
                if (type === 'COMMENT_CREATED') {
                    setCommentsCount(prev => prev + 1)
                }
            }
        }

        window.addEventListener('community-event', handleCommunityEvent)
        return () => window.removeEventListener('community-event', handleCommunityEvent)
    }, [showComments, post.id])

    const toggleComments = () => {
        const willShow = !showComments
        setShowComments(willShow)
        if (willShow) {
            fetchComments()
        }
    }

    const toggleReaction = async (commentId: number, type: string = 'LIKE') => {
        if (!currentUser) return

        // OPTIMIZATION: Optimistic update
        const originalComments = [...comments]
        const commentIndex = comments.findIndex(c => c.id === commentId)
        if (commentIndex === -1) return

        const targetComment = { ...comments[commentIndex] }
        const existingReactionIndex = targetComment.reactions?.findIndex((r: any) => r.userId === currentUser.id)

        const newReactions = [...(targetComment.reactions || [])]
        if (existingReactionIndex !== undefined && existingReactionIndex !== -1) {
            if (newReactions[existingReactionIndex].type === type) {
                // Remove reaction
                newReactions.splice(existingReactionIndex, 1)
            } else {
                // Change type
                newReactions[existingReactionIndex] = { ...newReactions[existingReactionIndex], type }
            }
        } else {
            // Add new
            newReactions.push({ userId: currentUser.id, type, user: { id: currentUser.id, fullName: currentUser.fullName } })
        }

        targetComment.reactions = newReactions
        const newComments = [...comments]
        newComments[commentIndex] = targetComment
        setComments(newComments)

        try {
            const response = await fetch(`/api/tenant/posts/${post.id}/comments/${commentId}/reaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, type })
            })

            if (!response.ok) {
                // Revert on error
                setComments(originalComments)
            }
            // No need to refetch all comments here anymore!
        } catch (error) {
            console.error('Error toggling reaction:', error)
            setComments(originalComments)
        }
    }

    const uploadImage = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/posts/upload', {
                method: 'POST',
                body: formData
            })
            if (res.ok) {
                const data = await res.json()
                return data.url
            }
        } catch (error) {
            console.error('Upload failed', error)
        }
        return null
    }

    const handlePostComment = async () => {
        if ((!newComment.trim() && !commentImage) || !currentUser) return
        setPostingComment(true)
        try {
            let finalImageUrl = null
            if (commentImage) finalImageUrl = await uploadImage(commentImage)

            const res = await fetch(`/api/tenant/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    imageUrl: finalImageUrl,
                    userId: currentUser.id,
                    parentId: replyingTo?.id
                })
            })
            if (res.ok) {
                const data = await res.json()
                setComments([...comments, data])
                setCommentsCount(prev => prev + 1)
                setNewComment('')
                setCommentImage(null)
                setCommentImageUrl(null)
                setShowEmojiPicker(false)
                setReplyingTo(null)
            }
        } catch (error) {
            console.error('Post comment error:', error)
        } finally {
            setPostingComment(false)
        }
    }

    const handleDeleteComment = async (commentId: number) => {
        try {
            const res = await fetch(`/api/tenant/posts/${post.id}/comments/${commentId}?userId=${currentUser?.id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId))
                setCommentsCount(prev => prev - 1)
                setActiveDropdownId(null)
            }
        } catch (error) {
            console.error('Delete comment error', error)
        }
    }

    const saveEditComment = async (commentId: number) => {
        if (!editContent.trim()) return
        try {
            const res = await fetch(`/api/tenant/posts/${post.id}/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent, userId: currentUser.id })
            })
            if (res.ok) {
                const updated = await res.json()
                setComments(comments.map(c => c.id === commentId ? updated : c))
                setEditingCommentId(null)
            }
        } catch (error) {
            console.error('Edit error', error)
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile()
                if (file) {
                    setCommentImage(file)
                    setCommentImageUrl(URL.createObjectURL(file))
                }
            }
        }
    }

    const initials = post.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const categoryTheme = CATEGORY_THEMES[post.category] || CATEGORY_THEMES.DISCUSSION
    const StatusIcon = categoryTheme.icon
    const isPinned = post.content.startsWith('📌')
    const pinIcon = isPinned ? '📌' : ''
    const statusBadge = post.status ? STATUS_BADGES[post.status as keyof typeof STATUS_BADGES] : null

    const formatRelativeTime = (date: Date | string) => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days} ngày`
        if (hours > 0) return `${hours} giờ`
        if (minutes > 0) return `${minutes} phút`
        return 'Vừa xong'
    }

    return (
        <article className="group bg-primary rounded-3xl border border-primary shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500">
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
                        {/* More Actions Dropdown */}
                        {!isModeration && (currentUser?.id === post.user.id || currentUser?.role === 'ADMIN') && (
                            <div className="relative">
                                <button
                                    onClick={() => setPostDropdownOpen(!postDropdownOpen)}
                                    className="w-9 h-9 flex items-center justify-center text-tertiary hover:bg-tertiary rounded-xl transition-all"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {postDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setPostDropdownOpen(false)} />
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-primary overflow-hidden z-40 flex flex-col text-sm py-1 animate-in fade-in zoom-in-95 duration-100">
                                            {currentUser?.id === post.user.id && (
                                                <button
                                                    onClick={() => { onEdit?.(post); setPostDropdownOpen(false); }}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-secondary transition-colors"
                                                >
                                                    <Edit3 size={16} /> <span className="font-semibold">Chỉnh sửa</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { onDelete?.(post.id); setPostDropdownOpen(false); }}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-left text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} /> <span className="font-semibold">Xóa bài viết</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
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

                {/* Content - selalu tampil, jika moderation tampil singkat */}
                <div
                    className={`relative mb-3 ${onViewDetail ? 'cursor-pointer group/content' : ''}`}
                    onClick={() => onViewDetail?.(post)}
                >
                    <p className={`text-secondary leading-relaxed whitespace-pre-wrap font-medium group-hover/content:text-[var(--accent-blue)] transition-colors ${isModeration
                        ? 'text-sm line-clamp-3'
                        : 'text-base sm:text-lg mb-4'
                        }`}>
                        <EmojiText text={isPinned ? post.content.replace(/^📌\s*/, '') : post.content} />
                    </p>
                </div>

                {/* Images - Hidden in main moderation grid */}
                {!isModeration && post.images && post.images.length > 0 && (
                    <div className="mb-4 -mx-4 sm:mx-0 overflow-hidden sm:rounded-xl">
                        <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.images.slice(0, 4).map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`relative bg-tertiary cursor-pointer group/post-img ${post.images.length === 1 ? 'w-full' : (post.images.length === 3 && idx === 0 ? 'row-span-2' : 'aspect-video')}`}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img
                                        src={img}
                                        alt=""
                                        className={`w-full h-full object-cover ${post.images.length === 1 ? 'object-contain max-h-[500px] bg-black/5 dark:bg-black/20' : ''}`}
                                    />
                                    <div className="absolute inset-0 bg-black/0 transition-colors" />
                                    {idx === 3 && post.images.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">+{post.images.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-primary">
                    <div className="flex items-center gap-2">
                        {isModeration ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (onApprove) {
                                            setActionLoading(true);
                                            await onApprove(post.id);
                                            setActionLoading(false);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    title="Duyệt bài"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-200 dark:border-emerald-500/20 shadow-sm disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={18} />}
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (onReject) {
                                            setActionLoading(true);
                                            await onReject(post.id);
                                            setActionLoading(false);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    title="Từ chối"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all border border-amber-200 dark:border-amber-500/20 shadow-sm disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
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
                                    onClick={handleLike}
                                    className={`flex justify-center items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95 ${isLiked
                                        ? 'text-red-500 bg-red-50 dark:bg-red-500/10 shadow-inner'
                                        : 'text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                        }`}
                                >
                                    <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                                    <span>{likesCount}</span>
                                </button>
                                {!isModeration && (
                                    <button
                                        onClick={toggleComments}
                                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-tertiary hover:text-[var(--accent-blue)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
                                    >
                                        <MessageCircle size={18} />
                                        <span>{commentsCount}</span>
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

            {/* Comments Section */}
            {showComments && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-5 border-t border-primary">
                    <div className="space-y-4 mb-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto no-scrollbar pb-14">
                        {loadingComments ? (
                            <div className="text-center py-4 text-tertiary text-sm">Đang tải bình luận...</div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-4 text-tertiary text-sm">Chưa có bình luận. Hãy là người đầu tiên!</div>
                        ) : (
                            comments.filter(c => !c.parentId).map((comment: any) => (
                                <div key={comment.id} className="space-y-3">
                                    {/* Main Comment */}
                                    <CommentItem
                                        comment={comment}
                                        currentUser={currentUser}
                                        post={post}
                                        onReply={(c: any) => setReplyingTo({ id: c.id, fullName: c.user.fullName })}
                                        editingCommentId={editingCommentId}
                                        setEditingCommentId={setEditingCommentId}
                                        editContent={editContent}
                                        setEditContent={setEditContent}
                                        saveEditComment={saveEditComment}
                                        activeDropdownId={activeDropdownId}
                                        setActiveDropdownId={setActiveDropdownId}
                                        handleDeleteComment={handleDeleteComment}
                                        toggleReaction={toggleReaction}
                                        formatRelativeTime={formatRelativeTime}
                                        onImageClick={(url) => setSelectedImage(url)}
                                        variant={variant}
                                    />

                                    {/* Replies */}
                                    {comments.filter(reply => reply.parentId === comment.id).length > 0 && (
                                        <div className="ml-0 sm:ml-9 space-y-3 border-l-2 border-slate-200 dark:border-slate-800 pl-2 sm:pl-4 mt-2">
                                            {comments.filter(reply => reply.parentId === comment.id).map((reply: any) => (
                                                <CommentItem
                                                    key={reply.id}
                                                    comment={reply}
                                                    currentUser={currentUser}
                                                    post={post}
                                                    onReply={(c: any) => setReplyingTo({ id: comment.id, fullName: c.user.fullName })}
                                                    editingCommentId={editingCommentId}
                                                    setEditingCommentId={setEditingCommentId}
                                                    editContent={editContent}
                                                    setEditContent={setEditContent}
                                                    saveEditComment={saveEditComment}
                                                    activeDropdownId={activeDropdownId}
                                                    setActiveDropdownId={setActiveDropdownId}
                                                    handleDeleteComment={handleDeleteComment}
                                                    toggleReaction={toggleReaction}
                                                    formatRelativeTime={formatRelativeTime}
                                                    onImageClick={(url) => setSelectedImage(url)}
                                                    isReply={true}
                                                    variant={variant}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Replying indicator */}
                    {replyingTo && (
                        <div className="flex items-center justify-between px-3 py-1 mb-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg animate-in slide-in-from-bottom-2 duration-200">
                            <span className="text-[12px] text-[var(--accent-blue)] font-medium">
                                Đang trả lời <span className="font-bold">{replyingTo.fullName}</span>
                            </span>
                            <button onClick={() => setReplyingTo(null)} className="text-tertiary hover:text-red-500">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Add Comment */}
                    <div className="flex items-start gap-2 sm:gap-3 mt-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm mt-0.5 overflow-hidden">
                            {currentUser?.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span>
                                    {currentUser
                                        ? (currentUser.fullName
                                            ? (currentUser.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase())
                                            : (currentUser.role === 'ADMIN' ? 'QT' : 'U'))
                                        : 'G'}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-[1.5rem] border border-primary/5 focus-within:border-[var(--accent-blue)]/30 focus-within:ring-4 focus-within:ring-[var(--accent-blue)]/5 transition-all flex flex-col shadow-sm">
                            {commentImageUrl && (
                                <div className="px-4 py-3 border-b border-primary/5 bg-black/5 dark:bg-black/20">
                                    <div className="relative inline-block self-start">
                                        <img src={commentImageUrl} alt="Preview" className="h-24 rounded-2xl object-cover border border-primary/10 shadow-md" />
                                        <button onClick={() => { setCommentImage(null); setCommentImageUrl(null) }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110 active:scale-95">
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <EmojiInput
                                value={newComment}
                                onChange={setNewComment}
                                placeholder={replyingTo ? "Viết câu trả lời..." : "Viết bình luận..."}
                                className="w-full bg-transparent px-4 py-3 text-[14px] leading-relaxed"
                                maxHeight="200px"
                                onEnter={handlePostComment}
                                onPaste={handlePaste}
                            />

                            <div className="flex items-center justify-between px-2 pb-2">
                                <div className="flex items-center gap-0.5 text-tertiary relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker) }}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-[var(--accent-blue)] dark:hover:text-blue-400 rounded-full transition-all active:scale-90"
                                        title="Chèn biểu tượng"
                                    >
                                        <Smile size={20} />
                                    </button>
                                    <div ref={pickerRef} className="relative">
                                        {showEmojiPicker && (
                                            <>
                                                {/* Backdrop for mobile */}
                                                <div
                                                    className="sm:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110] animate-in fade-in duration-300"
                                                    onClick={() => setShowEmojiPicker(false)}
                                                />

                                                {/* Desktop: Popover */}
                                                <div className="hidden sm:block absolute bottom-full left-0 mb-4 z-[120] shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                    <EmojiPicker
                                                        onEmojiClick={(e) => {
                                                            setNewComment(prev => prev + e.emoji)
                                                        }}
                                                        width={320}
                                                        height={450}
                                                        theme={isDark ? Theme.DARK : Theme.LIGHT}
                                                        emojiStyle={EmojiStyle.FACEBOOK}
                                                        lazyLoadEmojis={true}
                                                    />
                                                </div>

                                                {/* Mobile: Bottom Sheet */}
                                                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[120] animate-in slide-in-from-bottom-full duration-500 rounded-t-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] pb-safe">
                                                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3" />
                                                    <EmojiPicker
                                                        onEmojiClick={(e) => {
                                                            setNewComment(prev => prev + e.emoji)
                                                        }}
                                                        width="100%"
                                                        height={350}
                                                        theme={isDark ? Theme.DARK : Theme.LIGHT}
                                                        emojiStyle={EmojiStyle.FACEBOOK}
                                                        lazyLoadEmojis={true}
                                                        skinTonesDisabled={true}
                                                        searchDisabled={false}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <label className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-[var(--accent-blue)] dark:hover:text-blue-400 rounded-full transition-all active:scale-90 cursor-pointer" title="Đính kèm ảnh">
                                        <ImageIcon size={20} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setCommentImage(e.target.files[0])
                                                setCommentImageUrl(URL.createObjectURL(e.target.files[0]))
                                            }
                                        }} />
                                    </label>
                                </div>

                                <button
                                    onClick={handlePostComment}
                                    disabled={(!newComment.trim() && !commentImage) || postingComment}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 ${newComment.trim() || commentImage
                                        ? 'text-[var(--accent-blue)] hover:bg-blue-50 dark:hover:bg-blue-900/40'
                                        : 'text-tertiary opacity-30 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={20} className={postingComment ? 'animate-pulse' : ''} fill={(newComment.trim() || commentImage) ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300 outline-none"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setSelectedImage(null)
                        const isPostImg = post.images?.includes(selectedImage)
                        if (isPostImg) {
                            const currentIdx = post.images.indexOf(selectedImage)
                            if (e.key === 'ArrowLeft' && currentIdx > 0) setSelectedImage(post.images[currentIdx - 1])
                            if (e.key === 'ArrowRight' && currentIdx < post.images.length - 1) setSelectedImage(post.images[currentIdx + 1])
                        }
                    }}
                    ref={el => el?.focus()}
                >
                    <div
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        onClick={() => setSelectedImage(null)}
                    />

                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 border border-white/10"
                    >
                        <X size={24} />
                    </button>

                    {(() => {
                        const isPostImg = post.images?.includes(selectedImage)
                        const currentIdx = isPostImg ? post.images.indexOf(selectedImage) : -1
                        return (
                            <>
                                {isPostImg && currentIdx > 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedImage(post.images[currentIdx - 1]) }}
                                        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 border border-white/10"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                )}

                                <div className="relative max-w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
                                    <img
                                        src={selectedImage}
                                        alt="Phóng to"
                                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                    />
                                </div>

                                {isPostImg && currentIdx < post.images.length - 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedImage(post.images[currentIdx + 1]) }}
                                        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 border border-white/10"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                )}
                            </>
                        )
                    })()}
                </div>
            )}
        </article>
    )
}

