'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Search, CheckCircle, XCircle, Trash2,
  Filter, AlertCircle, FileCheck, Users,
  Clock, ChevronDown, MessageSquareOff,
  Megaphone, MessageSquare, Heart, Bookmark,
  Image as ImageIcon, Send, X, Plus, Smile, Edit3,
  Loader2
} from 'lucide-react'
import Loading from '@/components/Loading'
import CommunityPostCard from '@/components/CommunityPostCard'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { useBuilding } from '@/components/BuildingContext'

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
    phone?: string
    email?: string
    contracts?: { room: { name: string } }[]
  }
  likes?: number
  comments?: number
}

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả', icon: Users, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30', shadow: 'shadow-blue-500/10' },
  { id: 'ANNOUNCEMENT', label: 'Thông báo', icon: Megaphone, color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30', shadow: 'shadow-amber-500/10' },
  { id: 'DISCUSSION', label: 'Thảo luận', icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30', shadow: 'shadow-blue-500/10' },
  { id: 'FEEDBACK', label: 'Góp ý', icon: Heart, color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/30', shadow: 'shadow-rose-500/10' },
  { id: 'MARKET', label: 'Mua bán', icon: Bookmark, color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', shadow: 'shadow-emerald-500/10' },
]

const CATEGORY_THEMES = {
  ALL: { bg: 'bg-blue-600 dark:bg-blue-500', text: 'text-blue-600', hover: 'hover:bg-blue-700 dark:hover:bg-blue-600' },
  ANNOUNCEMENT: { bg: 'bg-amber-500 dark:bg-amber-600', text: 'text-amber-600', hover: 'hover:bg-amber-600 dark:hover:bg-amber-700' },
  DISCUSSION: { bg: 'bg-sky-500 dark:bg-sky-600', text: 'text-sky-600', hover: 'hover:bg-sky-600 dark:hover:bg-sky-700' },
  FEEDBACK: { bg: 'bg-rose-500 dark:bg-rose-600', text: 'text-rose-600', hover: 'hover:bg-rose-600 dark:hover:bg-rose-700' },
  MARKET: { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-emerald-600', hover: 'hover:bg-emerald-600 dark:hover:bg-emerald-700' },
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'PUBLIC', label: 'Đã duyệt' },
  { id: 'REJECTED', label: 'Từ chối' },
]

export default function CommunityPage() {
  const { isDark } = useDarkMode()
  const [posts, setPosts] = useState<Post[]>([])
  const [publicPosts, setPublicPosts] = useState<Post[]>([])
  const { selectedBuildingId } = useBuilding()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'moderate' | 'community'>('moderate')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' | 'delete'; postId: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<'ANNOUNCEMENT' | 'DISCUSSION' | 'FEEDBACK' | 'MARKET'>('DISCUSSION')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [posting, setPosting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const onEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const text = newPostContent
      const before = text.substring(0, start)
      const after = text.substring(end)
      setNewPostContent(before + emoji + after)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length)
        }
      }, 0)
    } else {
      setNewPostContent(prev => prev + emoji)
    }
  }

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    if (activeTab === 'moderate') {
      fetchPosts(false, 1)
    } else {
      fetchPublicPosts(false, 1)
    }
  }, [activeTab, statusFilter, categoryFilter, searchQuery, selectedBuildingId])

  // Isolated SSE for real-time updates - strictly background
  useEffect(() => {
    const eventSource = new EventSource('/api/community/events')

    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data)

        // Refresh appropriate lists for any relevant change
        if (type === 'POST_CREATED' || type === 'POST_UPDATED' || type === 'POST_DELETED') {
          if (activeTab === 'moderate') {
            fetchPosts(true, 1)
          } else {
            fetchPublicPosts(true, 1)
          }
        }

        // Notify specific components (like CommunityPostCard for comments)
        window.dispatchEvent(new CustomEvent('community-event', { detail: { type, data } }))
      } catch (e) {
        console.error('SSE Error:', e)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE Connection failed.')
      eventSource.close()
    }

    return () => eventSource.close()
  }, [activeTab])

  const showAlert = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 3000)
  }

  const fetchPosts = async (isSilent = false, pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else if (!isSilent) setLoading(true)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())
      params.append('page', pageNum.toString())
      params.append('limit', '15')

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      
      const newPosts = Array.isArray(data) ? data : []
      const pinned = newPosts.filter((post: Post) => post.content.startsWith('📌'))
      const regular = newPosts.filter((post: Post) => !post.content.startsWith('📌'))
      const combined = [...pinned, ...regular]

      if (isLoadMore) {
        setPosts(prev => [...prev, ...combined])
      } else {
        setPosts(combined)
      }
      
      if (newPosts.length < 15) setHasMore(false)
      else setHasMore(true)

      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching posts:', error)
      if (!isLoadMore) setPosts([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchPublicPosts = async (isSilent = false, pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else if (!isSilent) setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('status', 'PUBLIC')
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())
      params.append('page', pageNum.toString())
      params.append('limit', '15')

      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        params.append('userId', user.id)
      }

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      
      const newPosts = Array.isArray(data) ? data : []
      const pinned = newPosts.filter((post: Post) => post.content.startsWith('📌'))
      const regular = newPosts.filter((post: Post) => !post.content.startsWith('📌'))
      const combined = [...pinned, ...regular]

      if (isLoadMore) {
        setPublicPosts(prev => [...prev, ...combined])
      } else {
        setPublicPosts(combined)
      }

      if (newPosts.length < 15) setHasMore(false)
      else setHasMore(true)

      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching public posts:', error)
      if (!isLoadMore) setPublicPosts([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    if (activeTab === 'moderate') {
      fetchPosts(false, page + 1, true)
    } else {
      fetchPublicPosts(false, page + 1, true)
    }
  }

  const handleApprove = (postId: number) => {
    setConfirmAction({ type: 'approve', postId })
    setShowConfirmModal(true)
  }

  const handleReject = (postId: number) => {
    setConfirmAction({ type: 'reject', postId })
    setShowConfirmModal(true)
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    const pined = post.content.startsWith('📌 ')
    setIsPinned(pined)
    setNewPostContent(pined ? post.content.replace('📌 ', '') : post.content)
    setSelectedImages(post.images)
    setNewPostCategory(post.category)
    setShowCreateModal(true)
  }

  const handleDeletePost = (postId: number) => {
    setConfirmAction({ type: 'delete', postId })
    setShowConfirmModal(true)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            setSelectedImages(prev => [...prev, base64].slice(0, 4))
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return

    setPosting(true)
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return
      const user = JSON.parse(userData)

      const url = editingPost ? `/api/admin/posts/${editingPost.id}` : '/api/admin/posts'
      const method = editingPost ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: isPinned ? `📌 ${newPostContent.replace(/^📌\s*/, '')}` : newPostContent.replace(/^📌\s*/, ''),
          images: selectedImages,
          category: newPostCategory,
          userId: user.id,
          status: 'PUBLIC',
          buildingId: selectedBuildingId
        })
      })

      if (response.ok) {
        showAlert(editingPost ? 'Đã cập nhật bài viết thành công!' : 'Đã đăng bài thành công!')
        setNewPostContent('')
        setSelectedImages([])
        setEditingPost(null)
        setIsPinned(false)
        setShowCreateModal(false)
        fetchPosts()
        fetchPublicPosts()
      }
    } catch (error) {
      console.error('Error handling post:', error)
    } finally {
      setPosting(false)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])

        const response = await fetch('/api/posts/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newImages.push(data.url)
        }
      }
      setSelectedImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setUploadingImages(false)
    }
  }

  const executeAction = async () => {
    if (!confirmAction) return

    setActionLoading(true)
    const { type, postId } = confirmAction

    try {
      let response
      if (type === 'delete') {
        response = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' })
      } else {
        response = await fetch(`/api/admin/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: type === 'approve' ? 'PUBLIC' : 'REJECTED' })
        })
      }

      if (response.ok) {
        const messages = {
          approve: 'Đã duyệt bài viết!',
          reject: 'Đã từ chối bài viết!',
          delete: 'Đã xóa bài viết!'
        }
        showAlert(messages[type])
        fetchPosts()
        fetchPublicPosts()
      }
    } catch (error) {
      console.error('Error performing action:', error)
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const pendingCount = posts.filter(p => p.status === 'PENDING').length
  const displayPosts = activeTab === 'moderate' ? posts : publicPosts
  const currentStatusFilter = STATUS_FILTERS.find(f => f.id === statusFilter) || STATUS_FILTERS[0]

  return (
    <div className="pb-12 min-h-screen space-y-8">
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
          <div className="bg-primary dark:bg-tertiary backdrop-blur-xl border border-green-500/20 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 border-primary">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="text-green-500" size={18} />
            </div>
            <p className="text-sm font-bold text-primary">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-wider">CỘNG ĐỒNG</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Quản lý bài viết và nội dung cộng đồng</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex btn btn-primary h-11 px-6 rounded-2xl items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="font-bold">Đăng bài</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary relative z-30 overflow-hidden">
        <div className="flex items-center justify-center lg:justify-start gap-4 lg:gap-8 overflow-x-auto no-scrollbar max-w-full lg:max-w-none px-4 lg:px-0">
          <button
            onClick={() => { setActiveTab('moderate'); setStatusFilter('all'); setSearchQuery(''); }}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'moderate' ? 'border-blue-500 text-blue-600' : 'border-transparent text-secondary hover:text-primary'}`}
          >
            <FileCheck size={18} />
            <span>Duyệt bài</span>
            {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{pendingCount}</span>}
          </button>
          <button
            onClick={() => { setActiveTab('community'); setSearchQuery(''); }}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'community' ? 'border-blue-500 text-blue-600' : 'border-transparent text-secondary hover:text-primary'}`}
          >
            <Users size={18} />
            <span>Cộng đồng</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full">
        <div className="relative w-full lg:w-72 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-with-icon w-full h-11 bg-white dark:bg-gray-800 rounded-full border-primary focus:ring-2 focus:ring-blue-500/20 transition-all text-primary placeholder:text-tertiary text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          <div className="relative w-full lg:w-48">
            <button
              onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowCategoryDropdown(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all h-11 ${showStatusDropdown ? 'bg-tertiary border-blue-500 ring-2 ring-blue-500/10' : 'bg-white dark:bg-primary border-primary'}`}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-500">
                <Filter size={14} />
              </div>
              <span className="flex-1 text-left uppercase text-sm font-medium tracking-wider text-primary">{currentStatusFilter.label}</span>
              <ChevronDown size={14} className={`text-tertiary transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50">
                  {STATUS_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setStatusFilter(item.id); setShowStatusDropdown(false); }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${statusFilter === item.id ? 'bg-blue-600 text-white' : 'hover:bg-tertiary text-secondary'}`}
                    >
                      <span className="uppercase text-sm font-medium tracking-wider">{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar min-w-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = categoryFilter === cat.id
            const theme = CATEGORY_THEMES[cat.id as keyof typeof CATEGORY_THEMES]
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-2.5 px-5 h-11 rounded-full whitespace-nowrap text-[11px] font-bold transition-all shadow-sm active:scale-95 ${isSelected ? `${theme?.bg} text-white shadow-lg` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                <Icon size={16} className={isSelected ? 'text-white' : theme?.text} />
                <span className="uppercase tracking-wider">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Posts List */}
      <div className={`${activeTab === 'community' ? 'max-w-4xl mx-auto space-y-6 w-full' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 col-span-full">
            <Loading size="lg" text="Đang tải bài viết..." />
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="py-12 text-center bg-tertiary/10 rounded-3xl border-2 border-dashed border-primary col-span-full font-medium">
            <MessageSquareOff className="w-12 h-12 text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-secondary">{searchQuery ? 'Không tìm thấy bài viết' : 'Không có bài viết nào'}</p>
          </div>
        ) : (
          <>
            {displayPosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                showCategory="text"
                showStatus={activeTab === 'moderate'}
                isModeration={activeTab === 'moderate'}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
                onViewDetail={setSelectedPost}
                variant="admin"
              />
            ))}
          </>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && displayPosts.length > 0 && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center justify-center gap-2.5 px-8 py-3 bg-white dark:bg-slate-800 border border-primary rounded-2xl text-sm font-bold text-secondary hover:text-blue-500 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none min-w-[200px] shadow-sm"
          >
            {loadingMore ? (
              <Loading size="sm" />
            ) : (
              <>
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                  <ChevronDown size={14} />
                </div>
                <span className="uppercase tracking-tight">Xem thêm bài viết</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-primary w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-primary animate-scaleIn">
            <div className="text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${confirmAction?.type === 'approve' ? 'bg-green-100 text-green-500' : confirmAction?.type === 'reject' ? 'bg-amber-100 text-amber-500' : 'bg-red-100 text-red-500'}`}>
                {confirmAction?.type === 'approve' && <CheckCircle size={28} />}
                {confirmAction?.type === 'reject' && <XCircle size={28} />}
                {confirmAction?.type === 'delete' && <Trash2 size={28} />}
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">
                {confirmAction?.type === 'approve' ? 'Duyệt bài viết' : confirmAction?.type === 'reject' ? 'Từ chối bài viết' : 'Xác nhận xóa bài'}
              </h3>
              <p className="text-secondary text-sm mb-6">
                {confirmAction?.type === 'delete' ? 'Hành động này không thể hoàn tác.' : 'Xác nhận thực hiện hành động này?'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-3 bg-tertiary rounded-2xl text-sm font-bold">Hủy</button>
                <button onClick={executeAction} disabled={actionLoading} className={`flex-1 px-4 py-3 text-white rounded-2xl text-sm font-bold flex items-center justify-center min-h-[44px] ${confirmAction?.type === 'approve' ? 'bg-green-500' : confirmAction?.type === 'reject' ? 'bg-amber-500' : 'bg-red-500'}`}>
                  {actionLoading ? <Loading size="sm" /> : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => { setShowCreateModal(false); setEditingPost(null); setNewPostContent(''); setSelectedImages([]); }} />
          <div className="relative bg-primary w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-primary animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="px-8 py-6 border-b border-primary bg-tertiary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Plus className={editingPost ? 'rotate-45' : ''} size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary uppercase tracking-wider">{editingPost ? 'Chỉnh sửa bài viết' : 'Đăng bài mới'}</h2>
                  <p className="text-[11px] text-tertiary font-bold uppercase tracking-widest mt-0.5">{editingPost ? 'Cập nhật lại thông tin bài viết' : 'Tạo thông báo hoặc thảo luận mới'}</p>
                </div>
              </div>
              <button onClick={() => { setShowCreateModal(false); setEditingPost(null); setNewPostContent(''); setSelectedImages([]); setIsPinned(false); }} className="w-10 h-10 flex items-center justify-center bg-tertiary rounded-xl hover:text-red-500 transition-all"><X size={20} /></button>
            </div>

            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 no-scrollbar">
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest px-1">Chọn thể loại</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {CATEGORIES.slice(1).map((cat) => {
                    const Icon = cat.icon
                    const isSelected = newPostCategory === cat.id
                    const theme = CATEGORY_THEMES[cat.id as keyof typeof CATEGORY_THEMES]
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setNewPostCategory(cat.id as any)}
                        className={`flex items-center gap-2.5 px-5 h-11 rounded-full whitespace-nowrap text-[11px] font-bold transition-all border-none shadow-sm active:scale-95 ${isSelected
                          ? `${theme.bg} text-white shadow-lg shadow-blue-500/20`
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-white' : theme.text} />
                        <span className="uppercase tracking-wider">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pin Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPinned ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                    <Megaphone size={18} className={isPinned ? 'fill-current' : ''} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary italic">Ghim bài viết này lên đầu</h4>
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mt-0.5">Bài viết sẽ luôn nằm ở đầu trang bảng tin của cư dân</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isPinned ? 'bg-blue-500 shadow-inner' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${isPinned ? 'translate-x-7' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest">Nội dung</p>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors"><Smile size={18} /></button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Chia sẻ điều gì đó với hàng xóm..."
                  rows={8}
                  className="w-full resize-none p-5 rounded-[1.5rem] bg-tertiary border-2 border-transparent focus:border-[var(--accent-blue)] transition-all text-sm text-primary placeholder:text-tertiary shadow-inner font-medium leading-relaxed"
                />
              </div>

              {selectedImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest px-1">Hình ảnh ({selectedImages.length})</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-lg flex items-center justify-center text-white hover:bg-red-500 shadow-lg"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-primary bg-tertiary/20 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-sm"><ImageIcon size={22} /></div>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                {uploadingImages && <Loader2 size={18} className="animate-spin text-blue-500 ml-2" />}
              </label>
              <button onClick={handleCreatePost} disabled={!newPostContent.trim() || posting} className="btn btn-primary h-12 px-8 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm">
                {posting ? <><Loader2 size={18} className="animate-spin" /><span className="font-bold">Đang xử lý...</span></> : <><Send size={18} /><span className="font-bold uppercase tracking-tight">{editingPost ? 'Cập nhật' : 'Đăng bài'}</span></>}
              </button>
            </div>

            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-[110]" onClick={() => setShowEmojiPicker(false)} />
                <div className="absolute top-[140px] right-6 z-[120] animate-scaleIn shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-800">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme={isDark ? Theme.DARK : Theme.LIGHT} width={350} height={420} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-3xl bg-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-primary flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-8 py-5 border-b border-primary bg-tertiary/20">
              <h3 className="font-bold text-primary uppercase tracking-wider">Chi tiết bài viết</h3>
              <button onClick={() => setSelectedPost(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-tertiary text-secondary hover:text-red-500 transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto no-scrollbar">
              <CommunityPostCard
                post={selectedPost}
                variant="admin"
                showCategory="text"
                showStatus={true}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
