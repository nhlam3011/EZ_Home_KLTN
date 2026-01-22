'use client'

import { useEffect, useState } from 'react'
import { Search, CheckCircle, XCircle, Eye, Trash2, Calendar, Image as ImageIcon, ThumbsUp, MessageCircle, Share2, X, Loader2, Filter, AlertCircle, FileCheck, Users } from 'lucide-react'

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

  const handleApprove = async (postId: number) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt bài viết này?')) return

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLIC' })
      })

      if (response.ok) {
        showAlert('Đã duyệt bài viết thành công!')
        fetchPosts()
        if (activeTab === 'community') {
          fetchPublicPosts()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error approving post:', error)
      alert('Có lỗi xảy ra khi duyệt bài viết')
    }
  }

  const handleReject = async (postId: number) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối bài viết này?')) return

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      })

      if (response.ok) {
        showAlert('Đã từ chối bài viết!')
        fetchPosts()
        if (activeTab === 'community') {
          fetchPublicPosts()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error rejecting post:', error)
      alert('Có lỗi xảy ra khi từ chối bài viết')
    }
  }

  const handleDelete = async (postId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showAlert('Đã xóa bài viết thành công!')
        fetchPosts()
        if (activeTab === 'community') {
          fetchPublicPosts()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Có lỗi xảy ra khi xóa bài viết')
    }
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
      PENDING: { label: 'Chờ duyệt', className: 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded' },
      PUBLIC: { label: 'Đã duyệt', className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      REJECTED: { label: 'Đã từ chối', className: 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded' }
    }
    return statusMap[status] || { label: status, className: 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded' }
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
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                activeTab === 'moderate'
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
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                activeTab === 'community'
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
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <input
                type="text"
                placeholder="Tìm kiếm theo nội dung, tên người đăng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-primary rounded-lg text-xs sm:text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter size={18} className="text-tertiary" />
              <label className="text-xs sm:text-sm text-secondary whitespace-nowrap">Trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-primary rounded-lg text-xs sm:text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] sm:min-w-[150px]"
              >
                <option value="all">Tất cả ({posts.length})</option>
                <option value="PENDING">Chờ duyệt ({pendingCount})</option>
                <option value="PUBLIC">Đã duyệt ({posts.filter(p => p.status === 'PUBLIC').length})</option>
                <option value="REJECTED">Đã từ chối ({posts.filter(p => p.status === 'REJECTED').length})</option>
              </select>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-primary rounded-lg text-xs sm:text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Moderate Tab - Posts Table */}
      {activeTab === 'moderate' && (
        loading ? (
          <div className="card">
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
              <p className="text-tertiary">Đang tải...</p>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead className="bg-tertiary border-b border-primary">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase sticky left-0 bg-tertiary z-10">Mã</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">Nội dung</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">Người đăng</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">Trạng thái</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-secondary uppercase">Ngày đăng</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-secondary uppercase">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary">
                    {posts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs sm:text-sm text-tertiary">
                          Không có bài viết nào
                        </td>
                      </tr>
                    ) : (
                      posts.map((post) => {
                        const statusBadge = getStatusBadge(post.status)
                        const initials = getInitials(post.user.fullName)
                        
                        return (
                          <tr key={post.id} className="hover:bg-tertiary transition-colors">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 sticky left-0 bg-primary dark:bg-secondary z-10">
                              <span className="text-xs sm:text-sm font-medium text-primary">#{post.id}</span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-start gap-2 max-w-md">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm text-primary line-clamp-2">
                                    {post.content}
                                  </p>
                                  {post.images && post.images.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <ImageIcon size={12} className="sm:w-[14px] sm:h-[14px] text-tertiary" />
                                      <span className="text-xs text-tertiary">{post.images.length} ảnh</span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedPost(post)
                                    setShowDetailModal(true)
                                  }}
                                  className="p-1.5 hover:bg-primary rounded transition-colors flex-shrink-0"
                                  title="Xem chi tiết"
                                >
                                  <Eye size={14} className="sm:w-4 sm:h-4 text-secondary" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <span className="text-white font-semibold text-xs sm:text-sm">{initials}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-primary truncate">{post.user.fullName}</p>
                                  {post.user.phone && (
                                    <p className="text-xs text-tertiary truncate">{post.user.phone}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-center">
                              <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className="sm:w-[14px] sm:h-[14px] text-tertiary flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm text-secondary">{formatDate(post.createdAt)}</p>
                                  <p className="text-xs text-tertiary">{formatRelativeTime(post.createdAt)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                {post.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(post.id)}
                                      className="p-1.5 sm:p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                      title="Duyệt bài"
                                    >
                                      <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-green-600 dark:text-green-400" />
                                    </button>
                                    <button
                                      onClick={() => handleReject(post.id)}
                                      className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                      title="Từ chối"
                                    >
                                      <XCircle size={16} className="sm:w-[18px] sm:h-[18px] text-red-600 dark:text-red-400" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(post.id)}
                                  className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Xóa bài"
                                >
                                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
          <div className="space-y-4">
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
                    <div key={post.id} className="card p-5 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-semibold">
                            {initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-primary truncate">{post.user.fullName}</span>
                            {isPinnedPost && (
                              <span className="bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                                📌 Thông báo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-tertiary">{formatRelativeTime(post.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-primary mb-4 whitespace-pre-wrap break-words leading-relaxed">
                        {isPinnedPost ? post.content.replace(/^📌\s*/, '') : post.content}
                      </p>
                      {post.images && post.images.length > 0 && (
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          {post.images.slice(0, 4).map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-tertiary">
                              <img
                                src={img}
                                alt={`Post image ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-4 border-t border-primary">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            likedPosts.has(post.id)
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-secondary hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                        >
                          <ThumbsUp size={18} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                          <span className="text-sm">{postLikes[post.id] || post.likes || 0} lượt thích</span>
                        </button>
                        <button 
                          onClick={() => handleComment(post.id)}
                          className="flex items-center gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <MessageCircle size={18} />
                          <span className="text-sm">{post.comments || 0} bình luận</span>
                        </button>
                        <button 
                          onClick={() => handleShare(post.id)}
                          className="flex items-center gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Share2 size={18} />
                          <span className="text-sm">Chia sẻ</span>
                        </button>
                        <div className="ml-auto">
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Xóa bài"
                          >
                            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
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
                <div className="card">
                  <div className="text-center py-12">
                    <p className="text-tertiary">Không có bài viết nào</p>
                  </div>
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
                    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${getStatusBadge(selectedPost.status).className}`}>
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
    </div>
  )
}
