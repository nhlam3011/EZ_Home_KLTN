'use client'

import { useEffect, useState } from 'react'
import { Badge } from 'flowbite-react'
import {
  Search, CheckCircle, XCircle, Eye, Trash2, Calendar,
  Image as ImageIcon, ThumbsUp, MessageCircle, Share2,
  X, Filter, AlertCircle, FileCheck, Users, Clock,
  MoreHorizontal, Megaphone, MessageSquare, Heart,
  Bookmark, ChevronDown, LayoutGrid, ClipboardList,
  Settings2, PackageCheck, Wallet, Sparkles, Loader2
} from 'lucide-react'
import Loading, { LoadingSpinner } from '@/components/Loading'

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
  { id: 'ALL', label: 'Tất cả', icon: Users, color: 'blue' },
  { id: 'ANNOUNCEMENT', label: 'Thông báo', icon: Megaphone, color: 'orange' },
  { id: 'DISCUSSION', label: 'Thảo luận', icon: MessageSquare, color: 'purple' },
  { id: 'FEEDBACK', label: 'Góp ý', icon: Heart, color: 'red' },
  { id: 'MARKET', label: 'Mua bán', icon: Bookmark, color: 'green' },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [publicPosts, setPublicPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'moderate' | 'community'>('moderate')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [postLikes, setPostLikes] = useState<Record<number, number>>({})
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<'ANNOUNCEMENT' | 'DISCUSSION' | 'FEEDBACK' | 'MARKET'>('ANNOUNCEMENT')
  const [isPinned, setIsPinned] = useState(false)
  const [posting, setPosting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' | 'delete'; postId: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showNewPostCategoryDropdown, setShowNewPostCategoryDropdown] = useState(false)

  useEffect(() => {
    if (activeTab === 'moderate') {
      fetchPosts()
    } else {
      fetchPublicPosts()
    }
  }, [activeTab, statusFilter, categoryFilter, searchQuery])

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

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setPosts(data)
      } else {
        console.error('API returned non-array data for posts:', data)
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
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

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setPublicPosts(data)
        const likesMap: Record<number, number> = {}
        data.forEach((post: Post) => {
          likesMap[post.id] = post.likes || 0
        })
        setPostLikes(likesMap)
      } else {
        console.error('API returned non-array data for public posts:', data)
        setPublicPosts([])
      }
    } catch (error) {
      console.error('Error fetching public posts:', error)
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
          approve: 'Đã duyệt bài viết thành công!',
          reject: 'Đã từ chối bài viết!',
          delete: 'Đã xóa bài viết thành công!'
        }
        showAlert(messages[type])
        fetchPosts()
        if (activeTab === 'community') {
          fetchPublicPosts()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error performing action:', error)
      alert('Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const cancelConfirm = () => {
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const getConfirmModalContent = () => {
    if (!confirmAction) return null
    const contents = {
      approve: {
        title: 'Duyệt bài viết',
        message: 'Bạn có chắc chắn muốn duyệt bài viết này?',
        confirmText: 'Duyệt',
        confirmClass: 'btn btn-primary'
      },
      reject: {
        title: 'Từ chối bài viết',
        message: 'Bạn có chắc chắn muốn từ chối bài viết này?',
        confirmText: 'Từ chối',
        confirmClass: 'btn btn-warning'
      },
      delete: {
        title: 'Xóa bài viết',
        message: 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.',
        confirmText: 'Xóa',
        confirmClass: 'btn btn-danger'
      }
    }
    return contents[confirmAction.type]
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    return 'Vừa xong'
  }

  const handleLike = async (postId: number) => {
    const isLiked = likedPosts.has(postId)
    const newLikedPosts = new Set(likedPosts)

    if (isLiked) {
      newLikedPosts.delete(postId)
      setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) - 1 }))
    } else {
      newLikedPosts.add(postId)
      setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }))
    }

    setLikedPosts(newLikedPosts)
  }

  const handleComment = (postId: number) => {
    const comment = prompt('Nhập bình luận của bạn:')
    if (comment && comment.trim()) {
      showAlert('Bình luận đã được gửi!')
    }
  }

  const handleShare = async (postId: number) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Bài viết từ EZ-Home',
          text: 'Xem bài viết này trên EZ-Home',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showAlert('Đã sao chép liên kết vào clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert('Vui lòng nhập nội dung thông báo')
      return
    }

    setPosting(true)
    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
        return
      }

      const user = JSON.parse(userData)

      if (user.role !== 'ADMIN') {
        alert('Chỉ quản trị viên mới có thể đăng thông báo')
        return
      }

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: isPinned ? `📌 ${newPostContent}` : newPostContent,
          images: selectedImages,
          category: newPostCategory,
          status: 'PUBLIC',
          userId: user.id
        })
      })

      if (response.ok) {
        showAlert('Đã đăng thông báo thành công!')
        setNewPostContent('')
        setIsPinned(false)
        setSelectedImages([])
        fetchPublicPosts()
        if (activeTab === 'moderate') {
          fetchPosts()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi đăng thông báo')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Có lỗi xảy ra khi đăng thông báo')
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
        const file = files[i]

        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} không phải là ảnh`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn (tối đa 5MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/posts/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newImages.push(data.url)
        } else {
          const error = await response.json()
          alert(`Lỗi upload ${file.name}: ${error.error}`)
        }
      }

      setSelectedImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Có lỗi xảy ra khi upload ảnh')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Chờ duyệt', color: 'warning' },
      PUBLIC: { label: 'Đã duyệt', color: 'success' },
      REJECTED: { label: 'Đã từ chối', color: 'failure' }
    }
    return statusMap[status] || { label: status, color: 'info' }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const pendingCount = posts.filter(p => p.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">CỘNG ĐỒNG CƯ DÂN</h1>
          <p className="text-sm sm:text-base text-secondary mt-1">Quản lý bài viết và tương tác của cư dân</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary mb-6">
        <div className="flex items-center gap-2 sm:gap-6">
          <button
            onClick={() => {
              setActiveTab('moderate')
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'moderate' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <FileCheck size={18} className="inline mr-1" />
            Duyệt bài
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('community')
              setSearchQuery('')
            }}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'community' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <Users size={18} className="inline mr-1" />
            Cộng đồng
          </button>
        </div>
      </div>

      {activeTab === 'moderate' && (
        <div className="card p-3 sm:p-4 mb-4 !overflow-visible relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="sm:col-span-1 lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              <input
                type="text"
                placeholder="Tìm bài viết, người đăng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-with-icon w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown)
                  setShowCategoryDropdown(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showStatusDropdown
                  ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                  : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                  statusFilter === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                    statusFilter === 'PUBLIC' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' :
                      'bg-red-50 dark:bg-red-900/20 text-red-500'
                  }`}>
                  {statusFilter === 'all' && <ClipboardList size={14} />}
                  {statusFilter === 'PENDING' && <AlertCircle size={14} />}
                  {statusFilter === 'PUBLIC' && <CheckCircle size={14} />}
                  {statusFilter === 'REJECTED' && <XCircle size={14} />}
                </div>
                <div className="text-left pr-1 flex-1 min-w-0">
                  <p className="text-md font-medium leading-tight whitespace-nowrap text-primary uppercase truncate">
                    {statusFilter === 'all' ? 'TẤT CẢ' :
                      statusFilter === 'PENDING' ? 'CHỜ DUYỆT' :
                        statusFilter === 'PUBLIC' ? 'ĐÃ DUYỆT' : 'ĐÃ TỪ CHỐI'}
                  </p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left ring-1 ring-black/5 dark:ring-white/5">
                    {[
                      { id: 'all', label: 'TẤT CẢ', icon: <ClipboardList size={16} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10' },
                      { id: 'PENDING', label: 'CHỜ DUYỆT', icon: <AlertCircle size={16} />, color: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10' },
                      { id: 'PUBLIC', label: 'ĐÃ DUYỆT', icon: <CheckCircle size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10' },
                      { id: 'REJECTED', label: 'ĐÃ TỪ CHỐI', icon: <XCircle size={16} />, color: 'text-red-500', bg: 'bg-red-50/50 dark:bg-red-900/10' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setStatusFilter(item.id); setShowStatusDropdown(false); }}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === item.id ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                      >
                        <div className={`p-1.5 rounded-lg ${statusFilter === item.id ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`}`}>
                          {item.icon}
                        </div>
                        <span className="uppercase">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown)
                  setShowStatusDropdown(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 group h-11 w-full ${showCategoryDropdown
                  ? 'bg-tertiary border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/10 shadow-lg'
                  : 'bg-white dark:bg-primary border-primary hover:border-[var(--accent-blue)] shadow-sm'
                  }`}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                  <Filter size={14} />
                </div>
                <div className="text-left pr-1 flex-1 min-w-0">
                  <p className="text-md font-medium leading-tight whitespace-nowrap text-primary uppercase truncate">
                    {CATEGORIES.find(c => c.id === categoryFilter)?.label || 'Tất cả'}
                  </p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 text-tertiary ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-max min-w-full bg-primary dark:bg-tertiary rounded-2xl shadow-xl border border-primary p-2 z-50 animate-scaleIn origin-top-left ring-1 ring-black/5 dark:ring-white/5">
                    {CATEGORIES.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setCategoryFilter(item.id); setShowCategoryDropdown(false); }}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${categoryFilter === item.id ? 'bg-[var(--accent-blue)] text-white shadow-md' : 'hover:bg-tertiary text-secondary'}`}
                        >
                          <div className={`p-1.5 rounded-lg ${categoryFilter === item.id ? 'bg-white/20 text-white' : 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-500'}`}>
                            <Icon size={16} />
                          </div>
                          <span className="uppercase">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Post Form and Search for Community tab */}
      {activeTab === 'community' && (
        <>
          <div className="card shadow-2xl rounded-[2rem] border-none overflow-hidden">
            <div className="p-5 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary leading-tight">Đăng bài viết mới</h3>
                    <p className="text-xs text-secondary mt-1">Nội dung sẽ được ghim hoặc đăng trực tiếp lên bảng tin</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Category Selection Dropdown */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Loại bài viết</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowNewPostCategoryDropdown(!showNewPostCategoryDropdown)}
                      className="flex items-center justify-between w-full md:w-64 px-5 py-3.5 bg-tertiary hover:bg-secondary rounded-2xl text-sm font-bold text-primary transition-all border-2 border-transparent focus:border-blue-500/50"
                    >
                      <div className="flex items-center gap-3">
                        {(() => {
                          const cat = CATEGORIES.find(c => c.id === newPostCategory) || CATEGORIES[1]
                          const Icon = cat.icon
                          return (
                            <>
                              <div className={`w-8 h-8 rounded-xl bg-${cat.color}-500/10 text-${cat.color}-500 flex items-center justify-center`}>
                                <Icon size={18} />
                              </div>
                              <span>{cat.label}</span>
                            </>
                          )
                        })()}
                      </div>
                      <ChevronDown size={18} className={`text-tertiary transition-transform duration-300 ${showNewPostCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showNewPostCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-full md:w-64 bg-primary rounded-2xl shadow-2xl border border-primary z-[50] overflow-hidden animate-fadeIn">
                        {CATEGORIES.slice(1).map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setNewPostCategory(cat.id as any)
                              setShowNewPostCategoryDropdown(false)
                            }}
                            className={`flex items-center gap-3 w-full px-5 py-4 text-sm font-bold transition-all hover:bg-tertiary ${newPostCategory === cat.id ? 'text-blue-500 bg-blue-500/5' : 'text-primary'
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-xl bg-${cat.color}-500/10 text-${cat.color}-500 flex items-center justify-center`}>
                              <cat.icon size={18} />
                            </div>
                            <span>{cat.label}</span>
                            {newPostCategory === cat.id && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Hãy nhập nội dung thông báo hoặc bài viết của bạn tại đây..."
                    rows={4}
                    className="input w-full resize-none p-5 rounded-[2rem] bg-tertiary border-2 border-transparent focus:border-[var(--accent-blue)] transition-all text-sm leading-relaxed"
                  />
                </div>

                {/* Media & Options */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <label className="group flex items-center gap-3 cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                        <ImageIcon size={20} />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        disabled={uploadingImages}
                        className="hidden"
                      />
                    </label>


                    <button
                      onClick={() => setIsPinned(!isPinned)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isPinned ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-tertiary text-tertiary hover:bg-secondary'}`}
                      title={isPinned ? 'Bỏ ghim' : 'Ghim bài viết'}
                    >
                      <Bookmark size={20} className={isPinned ? 'fill-current' : ''} />
                    </button>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || posting || uploadingImages}
                    className="btn btn-primary h-12 px-8 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 group overflow-hidden relative"
                  >
                    <div className="relative z-10 flex items-center gap-2">
                      {posting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>ĐANG ĐĂNG...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span className="font-bold">ĐĂNG BÀI VIẾT</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Image Previews */}
                {(selectedImages.length > 0 || uploadingImages) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-tertiary rounded-2xl border border-primary animate-fadeIn">
                    {selectedImages.map((url, index) => (
                      <div key={index} className="relative group aspect-square overflow-hidden rounded-xl border-2 border-white dark:border-primary shadow-sm">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-lg p-1.5 shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {uploadingImages && (
                      <div className="flex flex-col items-center justify-center gap-2 aspect-square bg-white/50 dark:bg-black/20 rounded-xl border-2 border-dashed border-blue-400">
                        <Loader2 size={24} className="text-blue-500 animate-spin" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Uploading...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative group max-w-2xl mx-auto w-full my-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-tertiary group-focus-within:text-blue-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm nội dung bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-14 bg-white dark:bg-primary border-2 border-primary rounded-2xl focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-sm font-medium shadow-sm"
            />
          </div>
        </>
      )}

      {/* Moderate Tab - Posts Cards */}
      {activeTab === 'moderate' && (
        loading ? (
          <div className="card">
            <Loading size="lg" text="Đang tải..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
            {posts.length === 0 ? (
              <div className="card col-span-full">
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList size={40} className="text-tertiary" />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-1">Không có bài viết nào</h3>
                  <p className="text-secondary text-sm">Thử thay đổi bộ lọc để tìm kiếm bài viết khác.</p>
                </div>
              </div>
            ) : (
              posts.map((post) => {
                const statusBadge = getStatusBadge(post.status)
                const initials = getInitials(post.user.fullName)
                const category = CATEGORIES.find(c => c.id === post.category) || CATEGORIES[0]
                const CategoryIcon = category.icon

                return (
                  <div key={post.id} className="card group hover:shadow-xl transition-all duration-300 flex flex-col h-full border-none shadow-md">
                    <div className="p-4 flex flex-col h-full">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-sm">{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary truncate leading-tight">{post.user.fullName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-tertiary font-medium flex items-center gap-1">
                                <Clock size={10} />
                                {formatRelativeTime(post.createdAt)}
                              </span>
                              {post.user.contracts?.[0]?.room?.name && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-tertiary rounded text-secondary font-bold">
                                  {post.user.contracts[0].room.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge color={statusBadge.color} className="whitespace-nowrap rounded-lg font-bold px-2 py-1 text-[10px] uppercase shadow-sm">
                          {statusBadge.label}
                        </Badge>
                      </div>

                      {/* Category Badge */}
                      <div className="mb-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-${category.color}-500/10 text-${category.color}-500 border border-${category.color}-500/20`}>
                          <CategoryIcon size={12} />
                          {category.label}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 mb-4">
                        <p className="text-sm text-secondary line-clamp-4 leading-relaxed">
                          "{post.content}"
                        </p>
                        {post.images && post.images.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-tertiary rounded-xl border border-primary group-hover:border-[var(--accent-blue)] transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center">
                              <ImageIcon size={16} className="text-blue-500" />
                            </div>
                            <span className="text-xs font-bold text-primary">{post.images.length} ảnh đính kèm</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-primary">
                        <button
                          onClick={() => {
                            setSelectedPost(post)
                            setShowDetailModal(true)
                          }}
                          className="btn btn-ghost bg-tertiary hover:bg-secondary text-primary btn-sm flex-1 font-bold rounded-xl"
                        >
                          <Eye size={14} />
                          <span>CHI TIẾT</span>
                        </button>

                        {post.status === 'PENDING' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleApprove(post.id)}
                              className="w-9 h-9 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-300 shadow-sm"
                              title="Duyệt bài"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(post.id)}
                              className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 shadow-sm"
                              title="Từ chối"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleDelete(post.id)}
                          className="w-9 h-9 flex items-center justify-center bg-tertiary text-tertiary hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300"
                          title="Xóa bài"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )
      )}

      {/* Community Tab - Public Posts Feed */}
      {activeTab === 'community' && (
        loading ? (
          <div className="card">
            <Loading size="lg" text="Đang tải..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 pb-20 mt-8">
              {publicPosts
                .filter(post => {
                  if (!searchQuery) return true
                  const query = searchQuery.toLowerCase()
                  return (
                    post.content.toLowerCase().includes(query) ||
                    post.user.fullName.toLowerCase().includes(query)
                  )
                })
                .map((post) => {
                  const initials = getInitials(post.user.fullName)
                  const category = CATEGORIES.find(c => c.id === post.category) || CATEGORIES[0]
                  const CategoryIcon = category.icon
                  const isPinnedPost = post.content.startsWith('📌')

                  return (
                    <div
                      key={post.id}
                      className={`card group hover:shadow-2xl transition-all duration-500 overflow-hidden border-none shadow-md ${isPinnedPost ? 'ring-2 ring-amber-400/20 shadow-amber-500/10 bg-amber-50/10' : ''}`}
                    >
                      <div className="p-0">
                        {/* Post Header */}
                        <div className="px-5 py-5 flex items-start justify-between border-b border-primary">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                              <span className="text-white font-black text-base">{initials}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-primary text-sm leading-none">{post.user.fullName}</span>
                                <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-${category.color}-500/10 text-${category.color}-500 border border-${category.color}-500/20`}>
                                  {category.label}
                                </div>
                                {isPinnedPost && (
                                  <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-1 rounded-lg text-[10px] animate-pulse">
                                    📌
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-tertiary font-bold uppercase tracking-tighter">
                                <div className="flex items-center gap-1">
                                  <Clock size={10} />
                                  <span>{formatRelativeTime(post.createdAt)}</span>
                                </div>
                                {post.user.contracts?.[0]?.room?.name && (
                                  <>
                                    <span className="opacity-30">•</span>
                                    <span className="text-blue-500 bg-blue-500/5 px-1.5 rounded-md font-black">P.{post.user.contracts[0].room.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPost(post)
                              setShowDetailModal(true)
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-tertiary text-tertiary hover:text-primary transition-all active:scale-90"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>

                        {/* Post Content */}
                        <div className="p-5">
                          <p className="text-sm text-secondary leading-relaxed mb-4 whitespace-pre-wrap selection:bg-blue-500/30">
                            {isPinnedPost ? post.content.replace(/^📌\s*/, '') : post.content}
                          </p>

                          {/* Image Grid */}
                          {post.images && post.images.length > 0 && (
                            <div className="mb-4 rounded-2xl overflow-hidden shadow-inner border border-primary">
                              <div className="grid gap-1" style={{
                                gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                              }}>
                                {post.images.slice(0, 4).map((img, idx) => (
                                  <div
                                    key={idx}
                                    className={`relative bg-tertiary group/img overflow-hidden ${post.images!.length === 1 ? 'w-full max-h-[400px]' : 'aspect-video'}`}
                                  >
                                    <img
                                      alt={`Post image ${idx + 1}`}
                                      src={img}
                                      className={`w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110`}
                                    />
                                    {idx === 3 && post.images!.length > 4 && (
                                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-white font-black text-xl">+{post.images!.length - 4}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Engagement Stats */}
                          <div className="flex items-center justify-between pt-4 border-t border-primary mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider ${likedPosts.has(post.id) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-tertiary text-secondary hover:bg-secondary'}`}
                              >
                                <Heart size={14} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                                <span>{postLikes[post.id] || post.likes || 0}</span>
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2 bg-tertiary text-secondary hover:bg-secondary rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider">
                                <MessageSquare size={14} />
                                <span>{post.comments || 0}</span>
                              </button>
                            </div>

                            <button
                              onClick={() => handleDelete(post.id)}
                              className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 group/del"
                              title="Xóa bài"
                            >
                              <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              {publicPosts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4 grayscale">
                    <MessageSquare size={40} className="text-tertiary" />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-1">Bảng tin trống</h3>
                  <p className="text-secondary text-sm">Chưa có bài viết công khai nào.</p>
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" onClick={() => setShowDetailModal(false)}>
          <div className="bg-primary rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-tight">Chi tiết bài viết</h2>
                  <p className="text-xs text-secondary font-bold uppercase tracking-widest mt-1">ID: #{selectedPost.id}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedPost(null)
                  }}
                  className="w-12 h-12 flex items-center justify-center bg-tertiary hover:bg-secondary rounded-2xl transition-all group"
                >
                  <X size={24} className="text-secondary group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              {/* User Info Card */}
              <div className="bg-tertiary/50 rounded-3xl p-6 mb-8 border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <span className="text-white font-black text-xl">
                      {getInitials(selectedPost.user.fullName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-primary text-lg leading-tight">{selectedPost.user.fullName}</p>
                      {selectedPost.user.contracts?.[0]?.room?.name && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-lg uppercase shadow-lg shadow-blue-500/20">
                          PHÒNG {selectedPost.user.contracts[0].room.name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      {selectedPost.user.phone && (
                        <p className="text-xs text-secondary font-bold flex items-center gap-2">
                          <span className="text-blue-500">•</span> SĐT: {selectedPost.user.phone}
                        </p>
                      )}
                      {selectedPost.user.email && (
                        <p className="text-xs text-secondary font-bold flex items-center gap-2">
                          <span className="text-blue-500">•</span> EMAIL: {selectedPost.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge color={getStatusBadge(selectedPost.status).color} className="rounded-xl font-black px-3 py-1 text-[10px] uppercase shadow-sm">
                      {getStatusBadge(selectedPost.status).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 ml-1">NỘI DUNG BÀI VIẾT</h3>
                  <div className="bg-white dark:bg-primary-dark rounded-3xl p-6 shadow-inner border-none">
                    <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">
                      {selectedPost.content}
                    </p>
                  </div>
                </div>

                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 ml-1">HÌNH ẢNH ĐÍNH KÈM ({selectedPost.images.length})</h3>
                    <div className={`grid gap-3 ${selectedPost.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {selectedPost.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative rounded-2xl overflow-hidden bg-tertiary border-2 border-primary group/img">
                          <img
                            src={img}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] font-black text-tertiary uppercase tracking-wider bg-tertiary/50 w-fit px-4 py-2 rounded-xl">
                  <Calendar size={14} className="text-blue-500" />
                  <span>NGÀY ĐĂNG: {formatDate(selectedPost.createdAt)}</span>
                </div>
              </div>

              {/* Action buttons */}
              {selectedPost.status === 'PENDING' && (
                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => {
                      handleApprove(selectedPost.id)
                      setShowDetailModal(false)
                    }}
                    className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/10 transition-all font-bold flex items-center justify-center gap-2 active:scale-95 text-sm"
                  >
                    <CheckCircle size={18} />
                    <span>DUYỆT</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedPost.id)
                      setShowDetailModal(false)
                    }}
                    className="h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/10 transition-all font-bold flex items-center justify-center gap-2 active:scale-95 text-sm"
                  >
                    <XCircle size={18} />
                    <span>TỪ CHỐI</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={cancelConfirm}>
          <div className="bg-primary rounded-3xl shadow-2xl max-w-md w-full animate-scaleIn overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <h2 className="text-xl font-bold text-primary mb-4">
                {confirmAction.type === 'approve' && 'Xác nhận duyệt bài viết'}
                {confirmAction.type === 'reject' && 'Xác nhận từ chối bài viết'}
                {confirmAction.type === 'delete' && 'Xác nhận xóa bài viết'}
              </h2>
              <p className="text-secondary text-sm leading-relaxed mb-10">
                {confirmAction.type === 'approve' && 'Nội dung này sẽ được hiển thị công khai trên bảng tin cộng đồng. Bạn có chắc chắn muốn duyệt?'}
                {confirmAction.type === 'reject' && 'Bài viết này sẽ bị đánh dấu là không được chấp nhận. Bạn có chắc chắn muốn từ chối?'}
                {confirmAction.type === 'delete' && 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.'}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={cancelConfirm} className="px-6 py-2.5 bg-tertiary hover:bg-secondary text-primary rounded-xl transition-all font-bold text-sm" disabled={actionLoading}>
                  Hủy
                </button>
                <button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`px-6 py-2.5 rounded-xl transition-all font-bold text-sm text-white shadow-lg active:scale-95 ${confirmAction.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' :
                    confirmAction.type === 'reject' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                      'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    }`}
                >
                  {actionLoading ? 'Đang xử lý...' :
                    confirmAction.type === 'approve' ? 'Duyệt' :
                      confirmAction.type === 'reject' ? 'Từ chối' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
