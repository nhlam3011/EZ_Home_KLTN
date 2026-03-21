'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Search, CheckCircle, XCircle, Trash2,
  Filter, AlertCircle, FileCheck, Users,
  Clock, ChevronDown, Loader2, MessageSquareOff,
  Megaphone, MessageSquare, Heart, Bookmark,
  Image as ImageIcon, Send, X, Plus, Smile
} from 'lucide-react'
import CommunityPostCard from '@/components/CommunityPostCard'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { useBuilding } from '@/components/BuildingContext'

interface Post {
  id: number
  content: string
  images: string[]
  category: 'ANNOUNCEMENT' | 'DISCUSSION' | 'FEEDBACK' | 'MARKET'
  status: string
  createdAt: Date
  user: {
    id: number
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
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const emojis = [
    '😊', '😂', '🥰', '😍', '😎', '🤔', '😅', '🙄', '😴', '😋', '😱', '🤩', '🥳', '😭', '🤬',
    '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✨', '🔥', '❤️', '🧡', '💛', '💚', '💙',
    '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '🏠', '🏢', '🏨', '🏦', '🏥', '🏤', '🏣', '🏫', '🏪', '🏭', '🏚', '🏘', '🏡', '🌟',
    '☀️', '☁️', '❄️', '🍀', '🌸', '🥑', '🍕', '🚀', '✔️', '❌', '📅', '🔑', '💰'
  ]

  const onEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const text = newPostContent
      const before = text.substring(0, start)
      const after = text.substring(end)
      setNewPostContent(before + emoji + after)

      // Reset cursor position after state update
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
    if (activeTab === 'moderate') {
      fetchPosts()
    } else {
      fetchPublicPosts()
    }
  }, [activeTab, statusFilter, categoryFilter, searchQuery, selectedBuildingId])

  const showAlert = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 3000)
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('status', 'PUBLIC')
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      setPublicPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching public posts:', error)
      setPublicPosts([])
    } finally {
      setLoading(false)
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

  const handleDelete = (postId: number) => {
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

      const response = await fetch('/api/tenant/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          images: selectedImages,
          category: newPostCategory,
          userId: user.id,
          status: 'PUBLIC' // Admin posts are automatically public
        })
      })

      if (response.ok) {
        showAlert('Đã đăng bài thành công!')
        setNewPostContent('')
        setSelectedImages([])
        setShowCreateModal(false)
        if (activeTab === 'community') fetchPublicPosts()
      }
    } catch (error) {
      console.error('Error creating post:', error)
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
        if (activeTab === 'community') fetchPublicPosts()
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
  const currentCategoryFilter = CATEGORIES.find(c => c.id === categoryFilter) || CATEGORIES[0]

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

      {/* Navigation Tabs - Centered on mobile/tablet */}
      <div className="border-b border-primary relative z-30 overflow-hidden">
        <div className="flex items-center justify-center lg:justify-start gap-4 lg:gap-8 overflow-x-auto no-scrollbar max-w-full lg:max-w-none px-4 lg:px-0">
          <button
            onClick={() => {
              setActiveTab('moderate')
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'moderate'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <FileCheck size={18} />
            <span>Duyệt bài</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('community')
              setSearchQuery('')
            }}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'community'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <Users size={18} />
            <span>Cộng đồng</span>
          </button>
        </div>
      </div>

      {/* Filters & Search - Single Row on Desktop */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full">
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-with-icon w-full h-11 bg-white dark:bg-gray-800 rounded-2xl border-primary focus:ring-2 focus:ring-blue-500/20 transition-all text-primary placeholder:text-tertiary text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          {/* Status Dropdown */}
          <div className="relative w-full lg:w-44">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown)
                setShowCategoryDropdown(false)
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-primary border border-primary text-sm font-medium text-secondary hover:border-[var(--accent-blue)] transition-all h-11 shadow-sm group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[var(--accent-blue)] group-hover:bg-[var(--accent-blue)] group-hover:text-white transition-colors">
                <Filter size={14} />
              </div>
              <span className="flex-1 text-left uppercase text-[10px] font-bold tracking-wider">{currentStatusFilter.label}</span>
              <ChevronDown size={14} className={`text-tertiary transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left">
                  {STATUS_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setStatusFilter(item.id); setShowStatusDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${statusFilter === item.id ? 'bg-[var(--accent-blue)] text-white shadow-lg' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-secondary'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category Buttons List - Matching Tenant */}
        <div className="flex items-center justify-center lg:justify-start gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 min-w-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = categoryFilter === cat.id
            const theme = CATEGORY_THEMES[cat.id as keyof typeof CATEGORY_THEMES]

            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-2.5 px-5 h-11 rounded-2xl whitespace-nowrap text-[11px] font-bold transition-all border-none shadow-sm active:scale-95 ${isSelected
                  ? `${theme?.bg} text-white shadow-lg shadow-blue-500/20`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                <Icon size={16} className={isSelected ? 'text-white' : theme?.text || 'text-slate-500'} />
                <span className="uppercase tracking-wider">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Posts List */}
      <div className={`${activeTab === 'community' ? 'max-w-4xl mx-auto space-y-6 w-full' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full'}`}>
        {loading ? (
          <div className={`flex flex-col items-center justify-center py-16 ${activeTab === 'moderate' ? 'col-span-full' : ''}`}>
            <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mb-3" size={32} />
            <p className="text-tertiary text-sm">Đang tải...</p>
          </div>
        ) : displayPosts.length === 0 ? (
          <div className={`py-12 text-center bg-tertiary/10 rounded-3xl border-2 border-dashed border-primary ${activeTab === 'moderate' ? 'col-span-full' : ''}`}>
            <MessageSquareOff className="w-12 h-12 text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-secondary font-medium">
              {searchQuery ? 'Không tìm thấy bài viết phù hợp' : 'Không có bài viết nào'}
            </p>
          </div>
        ) : (
          <>
            {displayPosts.map((post) => (
              <div key={post.id} className="animate-fadeIn">
                <CommunityPostCard
                  post={post}
                  showCategory="text"
                  showStatus={activeTab === 'moderate'}
                  variant="admin"
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  onViewDetail={(post) => setSelectedPost(post as any)}
                  isModeration={activeTab === 'moderate'}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-primary dark:bg-tertiary w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-primary animate-scaleIn">
            <div className="text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${confirmAction?.type === 'approve' ? 'bg-green-100 dark:bg-green-500/20 text-green-500' :
                confirmAction?.type === 'reject' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'bg-red-100 dark:bg-red-500/20 text-red-500'
                }`}>
                {confirmAction?.type === 'approve' && <CheckCircle className="w-7 h-7" />}
                {confirmAction?.type === 'reject' && <XCircle className="w-7 h-7" />}
                {confirmAction?.type === 'delete' && <Trash2 className="w-7 h-7" />}
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">
                {confirmAction?.type === 'approve' ? 'Duyệt bài viết' : confirmAction?.type === 'reject' ? 'Từ chối bài viết' : 'Xác nhận xóa bài'}
              </h3>
              <p className="text-secondary text-sm mb-6 px-4">
                {confirmAction?.type === 'delete'
                  ? 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này?'
                  : confirmAction?.type === 'approve'
                    ? 'Bài viết sẽ được hiển thị công khai trên bảng tin cộng đồng.'
                    : 'Bài viết sẽ không được hiển thị cho cư dân khác thấy.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-secondary dark:bg-gray-800 text-secondary rounded-2xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-3 text-white rounded-2xl text-sm font-bold shadow-lg transition-transform active:scale-95 ${confirmAction?.type === 'approve' ? 'bg-green-500 shadow-green-500/20' :
                    confirmAction?.type === 'reject' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'
                    } disabled:opacity-50`}
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-primary dark:bg-tertiary w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col border-t sm:border border-primary animate-slideUp sm:animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-primary">
              <h2 className="text-xl font-bold text-primary tracking-tight">Tạo bài viết mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-tertiary text-secondary rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 no-scrollbar">
              {/* Category Selection */}
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
                        className={`flex items-center justify-center gap-2.5 h-11 px-5 rounded-2xl whitespace-nowrap text-[11px] font-bold transition-all border-none ${isSelected
                          ? `${theme?.bg} text-white shadow-lg shadow-blue-500/20`
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        <Icon size={14} className={isSelected ? 'text-white' : theme?.text || 'text-slate-500'} />
                        <span className="uppercase tracking-wider">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest">Nội dung</p>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-[var(--accent-blue)]"
                  >
                    <Smile size={18} />
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Chia sẻ điều gì đó với cư dân..."
                  rows={8}
                  className="w-full resize-none p-5 rounded-[1.5rem] bg-tertiary border-2 border-transparent focus:border-[var(--accent-blue)] transition-all text-sm text-primary placeholder:text-tertiary shadow-inner font-medium leading-relaxed"
                />
              </div>

              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest px-1">Hình ảnh ({selectedImages.length})</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-tertiary group">
                        <img src={img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <button
                          onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur-md rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-primary bg-tertiary/20">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[var(--accent-blue)] group-hover:scale-110 transition-transform shadow-sm">
                    <ImageIcon size={22} />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                  {uploadingImages && <Loader2 size={18} className="animate-spin text-[var(--accent-blue)] ml-2" />}
                </label>

                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || posting}
                  className="btn btn-primary h-12 px-8 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm"
                >
                  {posting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="font-bold">Đang đăng...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="font-bold uppercase tracking-tight">Đăng bài</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Emoji Picker - Rendered outside scrollable area */}
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-[110]" onClick={() => setShowEmojiPicker(false)} />
                {/* Desktop */}
                <div className="hidden sm:block absolute top-[140px] right-6 z-[120] animate-scaleIn shadow-2xl rounded-3xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                    theme={isDark ? Theme.DARK : Theme.LIGHT}
                    width={350}
                    height={420}
                    searchPlaceholder="Tìm kiếm emoji..."
                  />
                </div>
                {/* Mobile: bottom sheet */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[120] animate-slideUp rounded-t-3xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                    theme={isDark ? Theme.DARK : Theme.LIGHT}
                    width="100%"
                    height={350}
                    searchPlaceholder="Tìm kiếm emoji..."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-2xl bg-primary rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary">
              <h3 className="font-bold text-primary">Chi tiết bài viết</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-tertiary text-secondary hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh] no-scrollbar">
              <CommunityPostCard
                post={selectedPost}
                variant="admin"
                showCategory="text"
                showStatus={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
