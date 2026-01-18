'use client'

import { useEffect, useState } from 'react'
import { Search, CheckCircle, XCircle, Eye, Trash2, User, Calendar, Image as ImageIcon, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'

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
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'PENDING', 'PUBLIC', 'REJECTED'
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

  useEffect(() => {
    if (activeTab === 'moderate') {
      fetchPosts()
    } else {
      fetchPublicPosts()
    }
  }, [activeTab, statusFilter, searchQuery])

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
      // Initialize likes state
      const likesMap: Record<number, number> = {}
      data.forEach((post: Post) => {
        likesMap[post.id] = post.likes || Math.floor(Math.random() * 50)
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
        alert('Đã duyệt bài viết thành công!')
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
        alert('Đã từ chối bài viết!')
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
        alert('Đã xóa bài viết thành công!')
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
      alert('Bình luận đã được gửi!')
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
        alert('Đã sao chép liên kết vào clipboard!')
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
      // Get admin user from localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        alert('Không tìm thấy thông tin người dùng')
        return
      }

      const user = JSON.parse(userData)
      
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: isPinned ? `📌 ${newPostContent}` : newPostContent,
          images: selectedImages,
          status: 'PUBLIC' // Admin posts are automatically approved
        })
      })

      if (response.ok) {
        alert('Đã đăng thông báo thành công!')
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
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} không phải là ảnh`)
          continue
        }

        // Validate file size (max 5MB)
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
      // Reset input
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ duyệt', className: 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 font-semibold px-3 py-1 rounded-full text-xs' },
      PUBLIC: { label: 'Đã duyệt', className: 'badge badge-success' },
      REJECTED: { label: 'Đã từ chối', className: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 font-semibold px-3 py-1 rounded-full text-xs' }
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs' }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const pendingCount = posts.filter(p => p.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto space-y-4 p-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-primary">Quản lý Cộng đồng</h1>
          <p className="text-secondary mt-1">Duyệt và quản lý bài viết của cư dân</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-primary">
          <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              setActiveTab('moderate')
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'moderate'
                ? 'font-semibold text-accent-blue border-b-2 border-accent-blue'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Duyệt bài
          </button>
          <button 
            onClick={() => {
              setActiveTab('community')
              setSearchQuery('')
            }}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'community'
                ? 'font-semibold text-accent-blue border-b-2 border-accent-blue'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Cộng đồng
          </button>
        </div>
      </div>

        {/* Filters - Only show in moderate tab */}
        {activeTab === 'moderate' && (
          <div className="card p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px] relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo nội dung, tên người đăng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full pl-10 pr-4 py-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-secondary whitespace-nowrap flex items-center mb-0">TRẠNG THÁI:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input px-4 py-2 text-sm"
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
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Đăng thông báo</h3>
              <div className="space-y-3">
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
                  <ImageIcon size={18} className="flex-shrink-0 w-[18px] h-[18px]" />
                  <span className="leading-5">Thêm ảnh</span>
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
                    <div className="grid grid-cols-4 gap-2">
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
                            <XCircle size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {uploadingImages && (
                    <p className="text-xs text-secondary">Đang upload ảnh...</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-primary">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded w-4 h-4 flex-shrink-0 pd-2"
                    />
                    <span className="text-sm text-secondary leading-none">  📌  Đánh dấu là thông báo quan trọng</span>
                  </label>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || posting || uploadingImages}
                    className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {posting ? 'Đang đăng...' : 'Đăng thông báo'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full pl-10 pr-4 py-2"
                />
              </div>
            </div>
          </>
        )}

        {/* Moderate Tab - Posts Table */}
        {activeTab === 'moderate' && (
          loading ? (
            <div className="text-center py-12">
              <p className="text-tertiary">Đang tải...</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-tertiary border-b border-primary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">MÃ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">NỘI DUNG</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">NGƯỜI ĐĂNG</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase">TRẠNG THÁI</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">NGÀY ĐĂNG</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-secondary uppercase">HÀNH ĐỘNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-tertiary">Không có bài viết nào</p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const statusBadge = getStatusBadge(post.status)
                  const initials = getInitials(post.user.fullName)
                  
                  return (
                      <tr key={post.id} className="hover:bg-tertiary transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-primary">#{post.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-primary line-clamp-2">
                                {post.content}
                              </p>
                              {post.images && post.images.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <ImageIcon size={14} className="text-tertiary" />
                                  <span className="text-xs text-tertiary">{post.images.length} ảnh</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedPost(post)
                                setShowDetailModal(true)
                              }}
                              className="p-1 hover:bg-tertiary rounded transition-colors flex-shrink-0"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} className="text-secondary" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-primary truncate">{post.user.fullName}</p>
                              {post.user.phone && (
                                <p className="text-xs text-tertiary truncate">{post.user.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block ${statusBadge.className} whitespace-nowrap`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-tertiary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-secondary">{formatDate(post.createdAt)}</p>
                              <p className="text-xs text-tertiary">{formatRelativeTime(post.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
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
                      </td>
                    </tr>
                  )
                })
              )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

      {/* Community Tab - Public Posts Feed */}
      {activeTab === 'community' && (
        loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải...</p>
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
                return (
                  <div key={post.id} className="card p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {initials}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary truncate">{post.user.fullName}</span>
                        </div>
                        <p className="text-xs text-tertiary">{formatRelativeTime(post.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-primary mb-3 whitespace-pre-wrap break-words">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        {post.images.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-tertiary">
                            <img
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-3 border-t border-primary">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          likedPosts.has(post.id)
                            ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500'
                            : 'text-secondary hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <ThumbsUp size={18} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                        <span className="text-sm whitespace-nowrap">{postLikes[post.id] || post.likes || 0} lượt thích</span>
                      </button>
                      <button 
                        onClick={() => handleComment(post.id)}
                        className="flex items-center gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <MessageCircle size={18} />
                        <span className="text-sm whitespace-nowrap">{post.comments || 0} bình luận</span>
                      </button>
                      <button 
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Share2 size={18} />
                        <span className="text-sm whitespace-nowrap">Chia sẻ</span>
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
              <div className="text-center py-12">
                <p className="text-tertiary">Không có bài viết nào</p>
              </div>
            )}
          </div>
        )
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary">Chi tiết bài viết #{selectedPost.id}</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedPost(null)
                  }}
                  className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-tertiary" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-tertiary rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
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
                  <span className={`inline-block ${getStatusBadge(selectedPost.status).className}`}>
                    {getStatusBadge(selectedPost.status).label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-primary mb-2">Nội dung</h3>
                <div className="bg-tertiary rounded-lg p-4">
                  <p className="text-sm text-primary whitespace-pre-wrap">{selectedPost.content}</p>
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
                    className="btn btn-success btn-md flex-1"
                  >
                    <CheckCircle size={18} />
                    <span>Duyệt bài</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedPost.id)
                      setShowDetailModal(false)
                    }}
                    className="btn btn-danger btn-md flex-1"
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
    </div>
  )
}
