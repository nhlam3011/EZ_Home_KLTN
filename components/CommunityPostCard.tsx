'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Clock, Heart, MessageCircle, Share2, MoreHorizontal,
    CheckCircle, XCircle, Trash2, Image as ImageIcon,
    Megaphone, MessageSquare, Heart as HeartIcon, Bookmark,
    Smile, Edit3, Send, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import dynamic from 'next/dynamic'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

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
    LIKE: '👍', LOVE: '❤️', HAHA: '😆', WOW: '😮', SAD: '😢', ANGRY: '😡'
}
const REACTION_COLORS: Record<string, string> = {
    LIKE: 'text-blue-500', LOVE: 'text-red-500', HAHA: 'text-yellow-500',
    WOW: 'text-yellow-500', SAD: 'text-orange-500', ANGRY: 'text-orange-600'
}
const REACTION_LABELS: Record<string, string> = {
    LIKE: 'Thích', LOVE: 'Yêu thích', HAHA: 'Haha',
    WOW: 'Wow', SAD: 'Buồn', ANGRY: 'Phẫn nộ'
}

function CommentItem({
    comment, currentUser, post, onReply, editingCommentId,
    setEditingCommentId, editContent, setEditContent, saveEditComment,
    activeDropdownId, setActiveDropdownId, handleDeleteComment,
    toggleReaction, hoveringReaction, setHoveringReaction, formatRelativeTime,
    onImageClick, isReply = false
}: {
    comment: any, currentUser: any, post: any, onReply: (c: any) => void,
    editingCommentId: number | null, setEditingCommentId: (id: number | null) => void,
    editContent: string, setEditContent: (c: string) => void,
    saveEditComment: (id: number) => void,
    activeDropdownId: number | null, setActiveDropdownId: (id: number | null) => void,
    handleDeleteComment: (id: number) => void,
    toggleReaction: (id: number, type: string) => void,
    hoveringReaction: number | null, setHoveringReaction: (id: number | null) => void,
    formatRelativeTime: (d: any) => string,
    onImageClick: (url: string) => void,
    isReply?: boolean
}) {
    return (
        <div className={`flex gap-3 group/comment relative ${isReply ? 'mt-3' : ''}`}>
            <div className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm`}>
                {comment.user.avatarUrl ? (
                    <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className={isReply ? 'text-[9px]' : 'text-xs'}>
                        {comment.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                )}
            </div>
            <div className="flex-1 relative">
                <div className="flex items-center group/bubble">
                    {editingCommentId === comment.id ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 shadow-sm border border-[var(--accent-blue)] min-w-[200px]">
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
                        <div className="max-w-[95%]">
                            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-md px-3.5 py-2 inline-block relative border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors shadow-sm">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[13px] font-bold text-primary leading-tight hover:underline cursor-pointer">{comment.user.fullName}</h4>
                                    {comment.user.contracts?.[0]?.room?.name && (
                                        <span className="text-[9px] font-bold uppercase bg-white/60 dark:bg-slate-700 px-1.5 py-[0.5px] rounded border border-primary/5 text-secondary">
                                            {comment.user.contracts[0].room.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[14px] text-primary mt-1 whitespace-pre-wrap leading-snug">{comment.content}</p>
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

                            <div className="flex items-center gap-1.5 sm:gap-3 mt-1.5 ml-0.5 sm:ml-1 text-[11px] sm:text-[12px] text-tertiary font-bold relative flex-wrap sm:flex-nowrap min-w-0">
                                <span className="font-medium opacity-70 tracking-tight">{formatRelativeTime(comment.createdAt)}</span>
                                {editingCommentId !== comment.id && (() => {
                                    const userReaction = comment.reactions?.find((r: any) => r.userId === currentUser?.id);
                                    const label = userReaction ? REACTION_LABELS[userReaction.type] || 'Thích' : 'Thích';
                                    const colorClass = userReaction ? REACTION_COLORS[userReaction.type] || 'text-[var(--accent-blue)]' : '';

                                    return (
                                        <div
                                            className="relative"
                                            onMouseEnter={() => setHoveringReaction(comment.id)}
                                            onMouseLeave={() => setHoveringReaction(null)}
                                        >
                                            <button
                                                onClick={() => toggleReaction(comment.id, userReaction ? userReaction.type : 'LIKE')}
                                                className={`hover:underline transition-colors whitespace-nowrap ${colorClass}`}
                                            >
                                                {label}
                                            </button>

                                            {hoveringReaction === comment.id && (
                                                <div className="absolute bottom-full left-0 pb-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                                                    <div className="bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-primary/10 px-2 py-1 flex items-center gap-0.5 group/picker">
                                                        {Object.entries(REACTION_ICONS).map(([type, icon]) => (
                                                            <button
                                                                key={type}
                                                                onClick={() => toggleReaction(comment.id, type)}
                                                                className="transition-all duration-300 origin-bottom p-1 text-[26px] font-emoji leading-none group-hover/picker:scale-75 group-hover/picker:opacity-60 hover:!scale-[1.3] hover:!opacity-100 hover:!z-10 relative"
                                                                title={REACTION_LABELS[type]}
                                                            >
                                                                {icon}
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
                                        <div className="flex items-center gap-1 sm:gap-1.5 ml-0.5 sm:ml-1 bg-white dark:bg-slate-800/50 rounded-full px-1.5 sm:px-2 py-0.5 shadow-sm border border-primary/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group/reaction">
                                            <div className="flex -space-x-1">
                                                {topTypes.map((type: any, i) => (
                                                    <span key={type} className="inline-block text-[13px] leading-none" style={{ zIndex: 10 - i }}>
                                                        {REACTION_ICONS[type] || '👍'}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[11px] font-bold text-secondary group-hover/reaction:text-primary transition-colors">{comment.reactions.length}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {(currentUser?.id === comment.userId || currentUser?.id === post.user.id || currentUser?.role === 'ADMIN') && editingCommentId !== comment.id && (
                        <div className="opacity-0 group-hover/comment:opacity-100 focus-within:opacity-100 transition-opacity ml-1 self-center relative z-20">
                            <button
                                onClick={() => setActiveDropdownId(activeDropdownId === comment.id ? null : comment.id)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-tertiary"
                            >
                                <MoreHorizontal size={14} />
                            </button>
                            {activeDropdownId === comment.id && (
                                <div className="absolute left-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-primary overflow-hidden z-[100] flex flex-col text-sm">
                                    {currentUser?.id === comment.userId && (
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
}: CommunityPostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLiked || false)
    const [likesCount, setLikesCount] = useState(post.likes || 0)
    const [commentsCount, setCommentsCount] = useState(post.comments || 0)
    const [showComments, setShowComments] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(false)
    const [postingComment, setPostingComment] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Facebook style features
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [hoveringReaction, setHoveringReaction] = useState<number | null>(null)
    const [commentImage, setCommentImage] = useState<File | null>(null)
    const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null)
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
    const [editContent, setEditContent] = useState('')
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)
    const [postDropdownOpen, setPostDropdownOpen] = useState(false)
    const [replyingTo, setReplyingTo] = useState<{ id: number, fullName: string } | null>(null)
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
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setCurrentUser(JSON.parse(userStr))
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
            const res = await fetch(`/api/tenant/posts/${post.id}/comments`)
            if (res.ok) {
                const data = await res.json()
                console.log(`Comments fetched for post ${post.id}:`, data.length)
                setComments(data)
            } else {
                console.error(`Failed to fetch comments for post ${post.id}:`, res.status)
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
        setHoveringReaction(null)
        try {
            const response = await fetch(`/api/tenant/posts/${post.id}/comments/${commentId}/reaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, type })
            })
            if (response.ok) {
                const commentsRes = await fetch(`/api/tenant/posts/${post.id}/comments`)
                const commentsData = await commentsRes.json()
                setComments(commentsData)
            }
        } catch (error) {
            console.error('Error toggling reaction:', error)
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
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 border-t border-primary">
                    <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto no-scrollbar pb-14">
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
                                        hoveringReaction={hoveringReaction}
                                        setHoveringReaction={setHoveringReaction}
                                        formatRelativeTime={formatRelativeTime}
                                        onImageClick={(url) => setSelectedImage(url)}
                                    />

                                    {/* Replies */}
                                    {comments.filter(reply => reply.parentId === comment.id).length > 0 && (
                                        <div className="ml-11 space-y-3 border-l-2 border-slate-200 dark:border-slate-800 pl-4 mt-2">
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
                                                    hoveringReaction={hoveringReaction}
                                                    setHoveringReaction={setHoveringReaction}
                                                    formatRelativeTime={formatRelativeTime}
                                                    onImageClick={(url) => setSelectedImage(url)}
                                                    isReply={true}
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
                        <div className="w-9 h-9 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm mt-0.5">
                            {currentUser ? (currentUser.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()) : 'G'}
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
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onPaste={handlePaste}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handlePostComment()
                                    }
                                }}
                                placeholder={replyingTo ? "Viết câu trả lời..." : "Viết bình luận..."}
                                className="w-full bg-transparent px-4 py-3 text-[14px] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none border-none shadow-none ring-0 focus:ring-0 resize-none overflow-hidden min-h-[48px] leading-relaxed"
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
                                    <div ref={pickerRef} className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
                                        {showEmojiPicker && (
                                            <EmojiPicker
                                                onEmojiClick={(e) => {
                                                    setNewComment(prev => prev + e.emoji)
                                                    setShowEmojiPicker(false)
                                                }}
                                                width={320}
                                                height={450}
                                                theme={typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' as any : 'light' as any}
                                                lazyLoadEmojis={true}
                                            />
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

