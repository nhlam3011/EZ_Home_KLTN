'use client'

import { useEffect, useState } from 'react'
import { Search, CheckCircle, XCircle, Eye, Trash2, Calendar, Image as ImageIcon, ThumbsUp, MessageCircle, Share2, X, Loader2, Filter, AlertCircle, FileCheck, Users, Clock, MoreHorizontal } from 'lucide-react'

interface Post {
  id: number
  content: string
  images: string[]
  status: string
  createdAt: Date
  user: {
    id: number
    fullName: string
    avatarUrl?: string
    phone?: string
    email?: string
  }
  likes?: number
  comments?: number
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [publicPosts, setPublicPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'moderate' | 'community'>('moderate')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [postLikes, setPostLikes] = useState<Record<number, number>>({})
  const [newPostContent, setNewPostContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [posting, setPosting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' | 'delete'; postId: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'moderate') {
      fetchPosts()
    } else {
      fetchPublicPosts()
    }
  }, [activeTab, statusFilter, searchQuery])

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
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      setPosts(data)
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
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await response.json()
      setPublicPosts(data)
      const likesMap: Record<number, number> = {}
      data.forEach((post: Post) => {
        likesMap[post.id] = post.likes || 0
      })
      setPostLikes(likesMap)
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
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ duyệt', className: 'badge badge-warning' },
      PUBLIC: { label: 'Đã duyệt', className: 'badge badge-success' },
      REJECTED: { label: 'Đã từ chối', className: 'badge badge-error' }
    }
    return statusMap[status] || { label: status, className: 'badge badge-info' }
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Quản lý Cộng đồng</h1>
        <p className="text-sm sm:text-base text-secondary mt-1">Duyệt và quản lý bài viết của cư dân</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('moderate')
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-2 ${activeTab === 'moderate'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <FileCheck size={18} className="inline" />
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
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-2 ${activeTab === 'community'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <Users size={18} className="inline" />
            Cộng đồng
          </button>
        </div>
      </div>

      {/* Filters - Only show in moderate tab */}
      {activeTab === 'moderate' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo nội dung, tên người đăng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-with-icon w-full pr-4 py-2 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter size={18} className="text-tertiary" />
              <label className="text-xs sm:text-sm text-secondary whitespace-nowrap">Trạng thái:</label>
              <div className="min-w-[120px] sm:min-w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select"
                >
                  <option value="all">Tất cả ({posts.length})</option>
                  <option value="PENDING">Chờ duyệt ({pendingCount})</option>
                  <option value="PUBLIC">Đã duyệt ({posts.filter(p => p.status === 'PUBLIC').length})</option>
                  <option value="REJECTED">Đã từ chối ({posts.filter(p => p.status === 'REJECTED').length})</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Form and Search for Community tab */}
      {activeTab === 'community' && (
        <>
          <div className="card">
            <div className="p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="sm:w-5 sm:h-5" />
                Đăng thông báo
              </h3>
              <div className="space-y-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  rows={4}
                  className="input w-full resize-none"
                />

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-primary transition-colors">
                    <ImageIcon size={18} />
                    <span>Thêm ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>

                  {/* Image Preview */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {selectedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-primary"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadingImages && (
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Đang upload ảnh...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-primary">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded w-4 h-4"
                    />
                    <span className="text-sm text-secondary">📌 Đánh dấu là thông báo quan trọng</span>
                  </label>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || posting || uploadingImages}
                    className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {posting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Đang đăng...</span>
                      </>
                    ) : (
                      'Đăng thông báo'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-with-icon w-full pr-4 py-2 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Moderate Tab - Posts Cards */}
      {activeTab === 'moderate' && (
        loading ? (
          <div className="card">
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
              <p className="text-tertiary">Đang tải...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {posts.length === 0 ? (
              <div className="card col-span-full">
                <div className="text-center py-12">
                  <FileCheck size={48} className="mx-auto text-tertiary mb-3" />
                  <p className="text-tertiary">Không có bài viết nào</p>
                </div>
              </div>
            ) : (
              posts.map((post) => {
                const statusBadge = getStatusBadge(post.status)
                const initials = getInitials(post.user.fullName)

                return (
                  <div key={post.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-semibold text-sm">{initials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{post.user.fullName}</p>
                          <p className="text-xs text-tertiary">{formatRelativeTime(post.createdAt)}</p>
                        </div>
                      </div>
                      <span className={statusBadge.className}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-primary line-clamp-3 mb-2">
                        {post.content}
                      </p>
                      {post.images && post.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ImageIcon size={14} className="text-tertiary" />
                          <span className="text-xs text-tertiary">{post.images.length} ảnh</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-primary">
                      <button
                        onClick={() => {
                          setSelectedPost(post)
                          setShowDetailModal(true)
                        }}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        <Eye size={14} />
                        <span>Xem</span>
                      </button>
                      {post.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Duyệt bài"
                          >
                            <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                          </button>
                          <button
                            onClick={() => handleReject(post.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Từ chối"
                          >
                            <XCircle size={18} className="text-red-600 dark:text-red-400" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Xóa bài"
                      >
                        <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                      </button>
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
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
              <p className="text-tertiary">Đang tải...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto">
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
                const isPinnedPost = post.content.startsWith('📌')
                return (
                  <div
                    key={post.id}
                    className={`card hover:shadow-xl transition-all duration-300 overflow-hidden ${isPinnedPost ? 'ring-2 ring-yellow-400 dark:ring-yellow-600' : ''}`}
                  >
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 border-b border-primary">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white font-bold text-sm">
                              {initials}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary text-sm">{post.user.fullName}</span>
                              {isPinnedPost && (
                                <span className="badge badge-warning text-xs">
                                  📌
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-tertiary">
                              <Clock size={10} />
                              <span>{formatRelativeTime(post.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPost(post)
                            setShowDetailModal(true)
                          }}
                          className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <MoreHorizontal size={20} className="text-secondary" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-primary mb-3 whitespace-pre-wrap break-words leading-relaxed text-sm line-clamp-4">
                        {isPinnedPost ? post.content.replace(/^📌\s*/, '') : post.content}
                      </p>

                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="mb-3 rounded-lg overflow-hidden" style={{
                          display: 'grid',
                          gridTemplateColumns: post.images.length === 1 ? '1fr' :
                            post.images.length === 2 ? 'repeat(2, 1fr)' :
                              'repeat(2, 1fr)',
                          gap: '2px'
                        }}>
                          {post.images.slice(0, 4).map((img, idx) => (
                            <div
                              key={idx}
                              className={`relative bg-tertiary ${post.images!.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                            >
                              <img
                                alt={`Post image ${idx + 1}`}
                                src={img}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                              />
                              {idx === 3 && post.images!.length > 4 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">+{post.images!.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-3 border-t border-primary">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors flex-1 justify-center text-sm ${likedPosts.has(post.id)
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                              : 'hover:bg-tertiary text-secondary'
                            }`}
                        >
                          <ThumbsUp size={14} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                          <span>{postLikes[post.id] || post.likes || 0}</span>
                        </button>
                        <button
                          onClick={() => handleComment(post.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-tertiary text-secondary text-sm flex-1 justify-center transition-colors"
                        >
                          <MessageCircle size={14} />
                          <span>{post.comments || 0}</span>
                        </button>
                        <button
                          onClick={() => handleShare(post.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-tertiary text-secondary font-medium transition-colors"
                        >
                          <Share2 size={18} />
                          <span>Chia sẻ</span>
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                          title="Xóa bài"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            {publicPosts.filter(post => {
              if (!searchQuery) return true
              const query = searchQuery.toLowerCase()
              return (
                post.content.toLowerCase().includes(query) ||
                post.user.fullName.toLowerCase().includes(query)
              )
            }).length === 0 && (
                <div className="card p-12 text-center">
                  <MessageCircle size={64} className="mx-auto text-tertiary mb-4" />
                  <p className="text-lg font-semibold text-primary mb-2">Chưa có bài viết nào</p>
                  <p className="text-tertiary">Hãy là người đầu tiên đăng bài!</p>
                </div>
              )}
          </div>
        )
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
          <div className="bg-primary rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">Chi tiết bài viết #{selectedPost.id}</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedPost(null)
                  }}
                  className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                >
                  <X size={20} className="text-tertiary" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-tertiary rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {getInitials(selectedPost.user.fullName)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{selectedPost.user.fullName}</p>
                    {selectedPost.user.phone && (
                      <p className="text-sm text-secondary">SĐT: {selectedPost.user.phone}</p>
                    )}
                    {selectedPost.user.email && (
                      <p className="text-sm text-secondary">Email: {selectedPost.user.email}</p>
                    )}
                  </div>
                  <span className={getStatusBadge(selectedPost.status).className}>
                    {getStatusBadge(selectedPost.status).label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-primary mb-2">Nội dung</h3>
                <div className="bg-tertiary rounded-lg p-4">
                  <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                </div>
              </div>

              {/* Images */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-primary mb-2">Ảnh đính kèm ({selectedPost.images.length})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPost.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-tertiary">
                        <img
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Calendar size={16} />
                  <span>Đăng lúc: {formatDate(selectedPost.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              {selectedPost.status === 'PENDING' && (
                <div className="flex items-center gap-3 pt-4 border-t border-primary">
                  <button
                    onClick={() => {
                      handleApprove(selectedPost.id)
                      setShowDetailModal(false)
                    }}
                    className="btn btn-success btn-md flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    <span>Duyệt bài</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedPost.id)
                      setShowDetailModal(false)
                    }}
                    className="btn btn-danger btn-md flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    <span>Từ chối</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={cancelConfirm}>
          <div className="bg-primary rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary">
                  {confirmAction.type === 'approve' && 'Duyệt bài viết'}
                  {confirmAction.type === 'reject' && 'Từ chối bài viết'}
                  {confirmAction.type === 'delete' && 'Xóa bài viết'}
                </h2>
                <button onClick={cancelConfirm} className="p-2 hover:bg-tertiary rounded-lg">
                  <X size={20} className="text-secondary" />
                </button>
              </div>
              <p className="text-secondary mb-6">
                {confirmAction.type === 'approve' && 'Bạn có chắc chắn muốn duyệt bài viết này?'}
                {confirmAction.type === 'reject' && 'Bạn có chắc chắn muốn từ chối bài viết này?'}
                {confirmAction.type === 'delete' && 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.'}
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={cancelConfirm} className="btn btn-secondary btn-md" disabled={actionLoading}>
                  Hủy
                </button>
                <button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`btn btn-md ${confirmAction.type === 'approve' ? 'btn-primary' : confirmAction.type === 'reject' ? 'btn-warning' : 'btn-danger'}`}
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
